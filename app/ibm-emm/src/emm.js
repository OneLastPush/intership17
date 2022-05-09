var path = require('path');
var cp = require('child_process');
var fs = require('fs');

var config = require('smart-config');
var log = require('smart-tracer');

var us = {};
us.resolve = function(util){
	return path.join(config.get('IBM Campaign._bin'), util);
};
us.credentials = function(creds){
	var a = [];
	var a2;
	if(creds && creds.user && creds.pw){
		a.push('-y');
		a.push(creds.user);
		a.push('-z');
		a.push(creds.pw);
		a2 = a.slice(0, a.length-1);
		a2.push('******');
	}else{
		a2 = a.slice(0);
	}
	return {
		args: a,
		sanitized: a2
	};
};

us.call = function(util, params, opts, cb){
	//build
	var creds = us.credentials(opts);
	var args = {
		args: params.concat(creds.args),
		sanitized: params.concat(creds.sanitized)
	};
	var exec = opts.noPath? util: us.resolve(util);
	var r = {
		cmd: exec,
		stdout: '',
		stderr: '',
		username: opts.user
	};
	if(args.sanitized.length > 0)
		r.cmd += ' "'+args.sanitized.join('" "')+'"';
	//execute
	var p = cp.spawn(exec, args.args);
	p.on('error', function(err){
		r.err = err;
	});
	p.stdout.on('data', function(data){
		r.stdout += data;
	});
	p.stderr.on('data', function(data){
		r.stderr += data;
	});
	//on done
	if(opts.cache){
		cb(r.err, {
			err: r.err,
			cmd: r.cmd,
			stdout: 'Successfully ran command',
			stderr: r.stderr
		});
		us.cache.make(opts.cache, r, p);
	}else{
		p.on('close', function(){
			us.translateResult(r, cb);
		});
	}
};
/**
 * Due to a variety of ridiculous behaviours by the utilities this is needed.
 * Behaviours:
 * - svradm does not put errors into stderr
 * - svradm puts warnings into stderr
 *
 * @param  {[type]} out [description]
 * @return {[type]}     [description]
 */
us.translateResult = function(r, cb){
	if(r.err) return cb(r.err);
	var output = '';
	if(r.stdout){
		output += r.stdout;
		if(r.stderr)
			output += '\r\n';
	}
	if(r.stderr)
		output += r.stderr;

	r.stderr = undefined;
	r.stdout = undefined;
	if(output.match(/error/i))
		r.stderr = output;
	else
		r.stdout = output;
	cb(r.err || r.stderr, r);
};

//caching of run functionality
us.cache = {};
us.cache.getPath = function(cacheName){
	return path.join(config.get('General.temp_folder'), 'cache_'+cacheName);
}
us.cache.clear = function(cacheName, cb){
	var cacheFile = us.cache.getPath(cacheName);
	fs.stat(cacheFile, function(err, stats){
		if(stats)
			fs.unlink(cacheFile, cb);
		else
			cb();
	});
};
us.cache.make = function(cache, meta, p){
	us.cache.clear(cache, function(err){
		if(err)
			return log.error('Error clearing cache ' + cache, err.stack);
		p.on('close', function(){
			us.translateResult(meta, function(err, res){
				fs.writeFile(us.cache.getPath(cache), JSON.stringify(res, null, 4), function(err){
					if(err) log.error('Error writing cache ' + cache, err.stack);
				});
			});
		});
	});
};
us.cache.get = function(cacheName, cb){
	fs.readFile(us.cache.getPath(cacheName), function(err, data){
		if(err)
			cb(err);
		else
			cb(undefined, JSON.parse(data.toString()));
	});
};

module.exports = us;