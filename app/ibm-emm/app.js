var EventEmitter = require('events').EventEmitter;

var log = require('smart-tracer');
var express = require('express');
var slave = require('master-slave').slave;
var bodyParser = require('body-parser');
var config = require('smart-config');

var browse_fs = require('browse_fs');
var systemInfo = require('system_info_monitoring')();

process.on('uncaughtException', function(err){
	log.error(err.stack); //catch random errors
});

var us = new EventEmitter();
module.exports = function(logLevel, cb){
	if(logLevel)
		log.setLevel(logLevel);
	us.once('started', cb);
};

log.setLevel('trace');
log.logToFiles(true);

config.default('General.auth', 'superdupersecretthing');
config.default('General.port', '4333');

var salt = require('./src/salt');
function parseObjChangeStringValue(obj, regex, valueFn){
	function parse(obj){
		for(var key in obj){
			if(typeof obj[key] == 'object')
				parse(obj[key]);
			else if(key.match(regex)){
				obj[key] = valueFn(obj[key]);
			}
		}
	}
	parse(obj);
}
config.on('preSave', function(data, save){ //salts sensitive data & unsalts
	parseObjChangeStringValue(save, /password|auth/i, salt.encrypt);
});
config.on('postLoad', function(data){
	parseObjChangeStringValue(data, /password|auth/i, salt.decrypt);
});

var index = require('./index');
index.init(function(err){
	if(err) throw err;
	var app = express();
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());

	slave = slave(config.get('General'));
	slave.on('config', function(data){
		for(var category in data){
			for(var key in data[category]){
				config.set(category+'.'+key, data[category][key], true); //don't save
			}
		}
		config.save();
	});
	app.use(slave.router);

	slave.router.use('/fs', browse_fs.router);
	slave.router.use('/sys', systemInfo.router);
	slave.router.use('/app', index.getRouter());

	slave.router.all('*', function(req, res){ //catch 404s
		log.warn('404 - '+req.url);
		res.status(404).send();
	});
	app.use(function(err, req, res, next){ //catch errors
		log.error(err.stack);
		res.status(500).send();
	});
	app.listen(config.get('General.port'));
	log.info('Started app on port ' + config.get('General.port'));
	us.emit('started', app);
});