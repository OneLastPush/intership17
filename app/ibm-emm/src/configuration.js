var path = require('path');
var config = require('smart-config');
var log = require('smart-tracer');
var salt = require('./salt');
var fs = require('fs');

function ensureDirectory(dir){
	fs.exists(dir, function(exist){
		if(!exist){
			fs.mkdir(dir, function(err){
				if(err)
					log.error(err.stack);
			});
		}
	});
}
config.on('change.General.public_folder', function(v, o){
	ensureDirectory(v);
});
config.on('change.IBM Campaign.root', function(v, o){
	config.set('IBM Campaign._bin', path.join(v, 'bin'));
	config.set('IBM Campaign._partitions', path.join(v, 'partitions'));
	config.set('IBM Campaign.log_folder', path.join(v, 'logs'));
});
config.on('change.IBM Campaign._partitions', function(v, o){
	config.set('IBM Campaign._default_partition', path.join(v, config.get('IBM Campaign.default_partition')));
});
config.on('change.IBM Campaign.default_partition', function(v, o){
	config.set('IBM Campaign._default_partition', path.join(config.get('IBM Campaign._partitions'), v));
});
config.on('change.IBM Campaign._default_partition', function(v, o){
	config.set('IBM Campaign Flowcharrts.log_folder', path.join(v, 'logs'));
});

config.default('General.temp_folder', 'tmp');
config.default('General.public_folder', 'public');
config.default('IBM Marketing Platform', {
	"active": true,
	"root": "c:/ibm/emm/Platform"
});
config.default("IBM Platform Database", {
	"active": true,
	"*JDBC_jar": "jdbc/ojdbc6.jar",
	"sid_dbname": "ORCL",
	"host": "10.0.0.168",
	"port": "1521",
	"username": "T10PLATFORM",
	"password": "CG3575001",
	"max_pool": "20",
	"use_override_url": false,
	"override_url": "jdbc:oracle:thin:T10PLATFORM/password@10.0.0.168:1521:ORCL",
	"schema": "",
});
config.default("IBM Campaign", {
	"active": true,
	"root": "c:/ibm/emm/Campaign",
	"default_partition": "partition1",
	"log_folder_name": "logs",

	"name": "IBM Campaign Listener",
	"start": "net start unica_aclsnr",
	"url": "",
	"log_folder": "",
	"install_log_folder": ""
});
config.default("IBM Campaign Database", {
	"active": true,
	"*JDBC_jar": "jdbc/ojdbc6.jar",
	"sid_dbname": "ORCL",
	"host": "10.0.0.168",
	"port": "1521",
	"username": "T10CAMPAIGN",
	"password": "CG3575001",
	"max_pool": "20",
	"use_override_url": false,
	"override_url": "jdbc:oracle:thin:T10CAMPAIGN/password@10.0.0.168:1521:ORCL",
	"schema": "",
});
config.default("IBM Contact Optimization", {
	"active": false,
	"root": "",

	"name": "IBM Contact Optimization",
	"start": ""
});
config.default("IBM Distributed Marketing", {
	"active": false,
	"root": ""
});
config.default("IBM Marketing Operations", {
	"active": false,
	"root": ""
});
config.default("IBM Interact", {
	"active": true,
	"root": "C:\\IBM\\EMM2\\Interact"
});
config.default("IBM SPSS Modeler Advantage", {
	"active": false,
	"root": ""
});

module.exports = function(cb){
	config.load(function(err){
		if(err){
			log.error(err.stack);
			log.info('defaulting to default config options');
			config.save();
		}
		cb();
	});
};