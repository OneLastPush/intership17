/**
 * Use:
 * var errors = require('errors');
 * var errs = new errors();
 * app.use(errs.addErrors('modulename', './errors.ini', [
 * 		['404-0', /missing/i]
 * ]).middleware());
 *
 * errors.ini:
 * 404-0 = This page is not accessible.
 *
 * Now you can call:
 * app.get('/route', function(req, res){
 * 		res.error('missing', '/route'); //responds with 404 status code & 'This page is not accessible /route' message.
 * });
 *
 * You can add the middleware multiple times from multiple different instances of errors, too.
 */
var ini = require('node-ini');
var log = require('smart-tracer');

var us = {};
us.debug = false;
us.missing = false;
us.errors = {};
us.readErrFile = function(file){
	var errsFile = ini.parseSync(file);
	var errors = {};
	for(var err in errsFile){
		errors[err] = {
			code: err.match(/(\d+)/)[1],
			msg: errsFile[err],
			silent: err.match(/-.+(s)/)? true: false
		};
	}
	return errors;
}
us.makeErrs = function(module, file, hooks){
	var missingHooks = [];
	var missingIni = [];

	file = us.readErrFile(file);
	var errors = {};
	var ini;
	//do regexes & keep trakc of which is done
	hooks.forEach(function(hook){
		var code = hook[0];
		var regex = hook[1];
		hook[3] = true;
		ini = file[code];
		if(ini){
			errors[regex] = {
				code: ini.code,
				module: module,
				msg: ini.msg,
				silent: ini.silent,
				regex: regex
			};
		}else{
			missingIni.push(code);
		}
	});
	//check if any regexes missing .ini values
	hooks.forEach(function(hook){
		if(hook[3] !== true)
			missingHooks.push(hook[0]);
	});
	if(us.missing){
		if(missingHooks.length > 0)
			log.warn('There are missing hooks for codes: ', missingHooks);
		if(missingIni.length > 0)
			log.warn('There are missing errors .ini configurations for codes: ', missingIni);
	}
	return errors;
}

us.isSameError = function(newErr, oldErr){
	var same = true;
	var important = ['code', 'msg', 'silent'];
	important.forEach(function(f){
		if(newErr[f] != oldErr[f])
			same = false;
	});
	return same;
}

us.addErrors = function(module, file, hooks){
	var newErrs = us.makeErrs(module, file, hooks);
	var newErr, oldErr;
	for(var regex in newErrs){
		newErr = newErrs[regex];
		oldErr = us.errors[regex];
		if(oldErr && !us.isSameError(newErr, oldErr)){
			log.warn('Overriding error '+regex+' from\n', oldErr, '\nto\n', newErr);
		}
		us.errors[regex] = newErr;
	}
	return us;
};

us.middleware = function(req, res, next){
	if(!res.error){
		res.error = function(err){
			var msg = err instanceof Object? err.toString(): err;
			var resErr = {
				code: 500,
				module: undefined,
				msg: msg,
				silent: false
			};
			var matchedErr;
			for(var regex in us.errors){
				if(msg.match(us.errors[regex].regex)){ //regex value is regex.toStrting() and not actually regex object
					matchedErr = us.errors[regex];
					resErr.code = matchedErr.code;
					resErr.module = matchedErr.module;
					resErr.msg = matchedErr.msg;
					resErr.silent = matchedErr.silent;
				}
			}
			if(!matchedErr){
				if(us.missing)
					log.warn('Not supprots/configured error!\n', err);
				resErr.msg = err instanceof Object? err.stack: err;
			}
			var info = [];
			if(!resErr.silent){
				for(var i=1; i<arguments.length; i++)
					info.push(arguments[i]);
			}
			log.error('%s-%s [%s] %s - %s', resErr.code, resErr.module, resErr.msg, err, info);
			res.status(resErr.code).send(resErr.msg+(info.length>0?' '+info.join(' '):''));
		}
	}else if(us.debug)
		log.warn(new Error('Errors middleware called twice!').stack);
	next();
}

module.exports = us;