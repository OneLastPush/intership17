var config = require('smart-config');
var emm = require('../../emm');
var status = require('./status');

var us = {};

us.getCacheName = function(flowchartFile){
	return flowchartFile.replace(/\/|\\/g, '_');
};
us.isActive = function(pid, username, password, cb){
	status.getFiltered({pid: pid}, username, password, function(err, res){
		if(err) return cb(err);
		var isActive = false;
		var data;
		if(res && res.filtered && res.filtered[0]){
			data = res.filtered[0];
			if(data.section == 'active')
				isActive = true;
		}
		cb(err, isActive, data);
	});
};
us.run = function(flowchartFile, username, password, cb){
	var cmd = 'run -s'
	cmd += ' -p \"' + flowchartFile + '\"';
	cmd += ' -u \"' + username + '\"';
	cmd += ' -h \"' + config.get('IBM Campaign.default_partition') + '\"';
	emm.call('unica_svradm', ['-x', cmd], {
		user: username,
		pw: password,
		cache: us.getCacheName(flowchartFile)
	}, cb);
};
us.status = function(flowchartFile, cb){
	emm.cache.get(us.getCacheName(flowchartFile), cb);
};
us.save = function(opts, username, password, cb){
	var params = ['-x'];
	if(isNaN(opts.pid))
		params.push('save -a');
	else
		params.push('save -p \"'+opts.pid+'\"');
	emm.call('unica_svradm', params, {
		user: username,
		pw: password
	}, cb);
};
us.suspend = function(opts, username, password, cb){
	var params = ['-x'];
	var cmd;
	if(isNaN(opts.pid))
		cmd = 'suspend -a'
	else
		cmd = 'suspend -p \"'+opts.pid+'\"'
	if(opts.force)
		cmd += ' -f';
	params.push(cmd);
	emm.call('unica_svradm', params, {
		user: username,
		pw: password
	}, cb);
};
us.resume = function(opts, username, password, cb){
	var params = ['-x'];
	if(isNaN(opts.pid))
		params.push('resume -a');
	else
		params.push('resume -p \"'+opts.pid+'\"');
	emm.call('unica_svradm', params, {
		user: username,
		pw: password
	}, cb);
};
us.stop = function(opts, username, password, cb){
	var params = ['-x'];
	var cmd;
	if(isNaN(opts.pid))
		cmd = 'stop -a'
	else
		cmd = 'stop -p \"'+opts.pid+'\"'
	if(opts.force)
		cmd += ' -f';
	params.push(cmd);
	emm.call('unica_svradm', params, {
		user: username,
		pw: password
	}, cb);
};
us.kill = function(pid, username, password, cb){
	if(isNaN(pid)){
		emm.call('unica_svradm', ['-x', 'kill -a'], {
			user: username,
			pw: password
		}, cb);
	}else{
		//killing a suspended flowchart will bug out that flowchart until resume -a is called, therefore let's not do that
		us.isActive(pid, username, password, function(err, isActive, data){
			if(err) return cb(err);
			if(!isActive) return cb(new Error('Flowchart is not active'));
			emm.call('unica_svradm', ['-x', 'kill -p \"'+pid+'\"'], {
				user: username,
				pw: password
			}, function(err, res){
				if(res)
					res.data = data;
				cb(err, res);
			});
		});
	}
};

module.exports = us;