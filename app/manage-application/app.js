var EventEmitter = require('events').EventEmitter;

var express = require('express');
var slave = require('master-slave').slave;

var config = require('smart-config');
var log = require('smart-tracer');

var browse_fs = require('browse_fs');
var systemInfo = require('system_info_monitoring')();

process.on('uncaughtException', function(err){
	log.error(err.stack);
});

var ma = require('./index');
var salt = require('./src/salt');

var us = new EventEmitter();
module.exports = function(cb){
	us.once('started', cb);
};
//salts sensitive data & unsalts
config.on('preSave', function(data, saveData){
	if(data && data.General && data.General.auth)
		saveData.General.auth = salt.encrypt(data.General.auth);
});
config.on('postLoad', function(data){
	if(data && data.General && data.General.auth)
		data.General.auth = salt.decrypt(data.General.auth);
});
config.default('General', {
	auth: 'superdupersecretthing',
	port: '4333'
});
config.default('Application', ma.default);
config.load(function(err){
	if(err){
		log.error(err.stack);
		log.info('defaulting to default config options');
		config.save();
	}
	var app = express();
	slave = slave(config.get('General'));
	slave.on('config', function(data){
		for(var key in data)
			config.set('Application.'+key, data[key], true); //don't save
		config.save();
	});
	app.use(slave.router);

	slave.router.use('/fs', browse_fs.router);
	slave.router.use('/sys', systemInfo.router);
	slave.router.use('/app', new ma.ApplicationManager('Application').getRouter());

	app.use(function(err, req, res){
		log.error(err.stack);
		res.status(500).send();
	});

	app.listen(config.get('General.port'));
	log.info('Started app on port ' + config.get('General.port'));
	us.emit('started', app);
});