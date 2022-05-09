/**
 * Decides if a application is remote or embedded and provides appropriate router.
 */
var log = require('smart-tracer');
var config = require('smart-config');

var ms = require('master-slave');
var ma = require('manage-application');
var emm = require('ibm-emm');

var us = {};
us.applications = {};
/**
 * Forwards a call to a plugin
 * @param  {[type]}   instance  [manager.applications.name]
 * @param  {[type]}   url       [relative url to call if plugin is a server]
 * @param  {[type]}   method    [method or obj.methods to call if instance (expected array: ie ['method'] or ['obj', 'method'])]
 * @param  {[type]}   arguments [object with key-value pairs for a form request, or value sequences for emthod call]
 * @param  {Function} cb        [callback function]
 * @return {[type]}             [description]
 */
us.forward = function(instance, url, method, arguments, cb){
	if(instance.instance){
		var args = [];
		for(var f in arguments)
			args.push(arguments[f]);
		args.push(cb);
		var fn = instance.instance;
		method.forEach(function(f){
			fn = fn[f];
		});
		var result = fn.apply(instance.instance, args);
		if(result != undefined)
			cb(undefined, result);
	}else if(instance.server){
		ms.instance.getForwardData(url, instance.mount, function(err, connOpts){
			connOpts.body = arguments;
			connOpts.json = true;
			ms.instance.request.post(connOpts, function(err, res, body){
				var json;
				try{
					json = JSON.parse(body);
				}catch(err){
					log.debug(err.stack);
				}
				cb(err, json || res.text || body);
			});
		});
	}else{
		cb(new Error('Not implemented'));
	}
}

us['IBM EMM'] = function(name, cb){
	emm.init(function(err){
		if(err){
			if(err.toString().match(/(sql)|(jdbc)/i)){
				log.error(err.stack);
				err = undefined;
			}
		}
		cb(err, emm);
	})
}
us.application = function(name, cb){
	var manager = new ma.ApplicationManager(name);
	cb(undefined, manager);
}

us.register = function(app, mount, name, cb){
	var settings = config.get(name);
	us.applications[name] = {
		name: name,
		mount: mount,
		instance: false,
		server: false
	};
	if(!settings)
		return cb(new Error(name + ' could not be found in configuration!'));
	if(!settings.active)
		return cb(new Error(name + ' is not activated, therefore will not be usable'));
	if(settings.host){
		ms.instance.addServer(mount, settings.host, settings.auth, mount, function(err, server){
			if(err) return cb(err);
			us.applications[name].server = server;
			cb(err, us.applications[name]);
		});
	}else{
		var instancer = us[name]? us[name]: us.application;
		instancer(name, function(err, ma){
			if(err) return cb(err);
			// +/app because standalones have fs, sys, etc. Don't want possible conflicts on standalones, and url must be mimicked
			app.useVerb('post', mount+'/app', ma.getRouter());
			app.post(mount+'/fs*', function(req, res){ //local fs. Mounted at app level
				res.redirect(307, '/fs'+req.url.match(/\/fs(.*)/i)[1]);
			});
			us.applications[name].instance = ma;
			cb(err, us.applications[name]);
		});
	}
}

module.exports = us;