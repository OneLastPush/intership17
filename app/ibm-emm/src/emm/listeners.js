var log = require('smart-tracer');
var ma = require('manage-application');
var emm = require('../emm');

var us = {};

//campaign
us.campaign = new ma.ApplicationManager("IBM Campaign");
us.campaign._ping = us.campaign.ping;
us.campaign.ping = function(opts, cb){
	if(this.config.get('ping')){
		this._stop(opts, cb);
	}else{
		if(!opts.username) return cb(new Error('missing field username'));
		if(!opts.password) return cb(new Error('missing field password'));
		emm.call('svrstop', ['-g'], {
			user: opts.username,
			pw: opts.password
		}, function(err, res){
			if(res.stdout && res.stdout.match('PING message delivered to server process'))
				res.status = true;
			else
				res.status = false;
			cb(undefined, res);
		});
	}
}
us.campaign._stop = us.campaign.stop;
us.campaign.stop = function(opts, cb){
	if(this.config.get('stop'))
		this._stop(opts, cb);
	else{
		if(!opts.username) return cb(new Error('missing field username'));
		if(!opts.password) return cb(new Error('missing field password'));
		emm.call('svrstop', [], {
			user: opts.username,
			pw: opts.password
		}, cb);
	}
}
us.campaign._getVersion = us.campaign.getVersion;
us.campaign.getVersion = function(opts, cb){
	if(this.config.get('version'))
		this._getVersion(opts, cb);
	else{
		emm.call('unica_aclsnr', ['-v'], {}, function(err, res){
			var version = '--';
			if(res && res.stdout){
				var matched = res.stdout.match(/version (.*)/i);
				if(matched)
					version = matched[1];
			}
			cb(err, version);
		});
	}
}

//optimizer
us.optimizer = new ma.ApplicationManager("IBM Contact Optimization");
us.optimizer._ping = us.optimizer.ping;
us.optimizer.ping = function(opts, cb){
	if(this.config.get('ping'))
		this._stop(opts, cb);
	else{
		if(!opts.username) return cb(new Error('missing field username'));
		if(!opts.password) return cb(new Error('missing field password'));
		emm.call('svrstop', ['-g', '-P', 'Optimize'], {
			user: opts.username,
			pw: opts.password
		}, function(err, res){
			if(res.stdout && res.stdout.match('PING message delivered to server process'))
				res.status = true;
			else
				res.status = false;
			cb(undefined, res);
		});
	}
}
us.optimizer._stop = us.optimizer.stop;
us.optimizer.stop = function(opts, cb){
	if(this.config.get('stop'))
		this._stop(opts, cb);
	else{
		if(!opts.username) return cb(new Error('missing field username'));
		if(!opts.password) return cb(new Error('missing field password'));
		emm.call('svrstop', ['-P', 'Optimize'], {
			user: opts.username,
			pw: opts.password
		}, cb);
	}
}

module.exports = us;