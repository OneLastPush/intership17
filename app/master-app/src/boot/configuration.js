/**
 * Don't display config options that start with _ on the front end.
 * They're generated and should not be changeable by a user.
 */
var config = require('smart-config');

var log = require('smart-tracer');
var salt = require('../salt');

function parseObjChangeStringValue(obj, regex, valueFn){
	function parse(obj){
		for(var key in obj){
			if(typeof obj[key] == 'object')
				parse(obj[key]);
			else if(key.match(regex)){
				if(obj[key])
					obj[key] = valueFn(obj[key]);
			}
		}
	}
	parse(obj);
}
config.on('preSave', function(data, save){
	parseObjChangeStringValue(save, /password|passphrase/i, salt.encrypt);
});
config.on('postLoad', function(data){
	parseObjChangeStringValue(data, /password|passphrase/i, salt.decrypt);
});

//defaults
//built-in
config.default('Node', {
	'*port': 3333,
	allowed_origins: '*',
	'*session_password': 'dgewdvewgdvewgdw',
	crypting_keyword: 'applesauce',
	logging_level: 'trace',
	logging_directory: 'logs',
	public_folder: 'public',
	archive_folder: 'archive',
	temp_folder: 'tmp'
});
config.default('Master', {
	'auth': 'defaultauthdefaultofsomething',
});
config.default('User Interface', {
	'flowchart_warning_hours': 0.5,
	'ram_usage_warning_percent': 10,
	'swap_usage_warning_percent': 10,
	'disk_usage_warning_percent': 10
});
config.default("System Monitoring", {
	"watched_paths": 'c:/, d:/'
});
config.default("Global Bookmarks List", {
	"CLEARGOALS": "http://cleargoals.com"
});
config.default("Watched Servers List", {
	"localhost": ""
});
config.default("FTP", {
	"target10": {
		"protocol": "sftp",
		"host": "10.0.0.186",
		"port": 22,
		"username": "ganna",
		"password": "Cleargoals1"
	}
});
//toggable functionality
config.default('Captcha', {
	active: true,
	key: '6Leb0B0TAAAAACYKJkrzx0gMnBHDLrtTIrhMdbed',
	secret: '6Leb0B0TAAAAAPOq5yPJYU0YlMgecXLG_JAzEA8S'
});
config.default('SSL', {
	active: true,
	key: './ssl/server.key',
	cert: './ssl/server.crt',
	ca: './ssl/ca.crt',
	passphrase: 'baaaanaaaanaaaa'
});
config.default("LDAP", {
	"active": true,
	"url": "10.0.0.243",
	"port": "389",
	"baseDN": "dc=cleargoals,dc=com",
	"anonymousBind": true,
	"bindDN": "",
	"bindPassword": ""
});
config.default("Email", {
	"active": true,
	"service": "gmail",
	"address": "system.alerts@cleargoals.com",
	"password": "unica*12ae$2",
	"display_name": "CLEARGOALS System Alerts"
});

//modules
config.default('IBM EMM', {
	"active": true,
	"host": '',
	"auth": '',
});
config.default("IBM Cognos", {
	"active": true,
	"host": "",
	"auth": "",
});
config.default("IBM WebSphere", {
	"active": true,
	"host": "",
	"auth": "",
});
config.default("Oracle WebLogic", {
	"active": true,
	"host": "",
	"auth": ""
});
config.default("Apache", {
	"active": true,
	"host": "",
	"auth": ""
});
config.default("Microsoft IIS", {
	"active": true,
	"host": "",
	"auth": ""
});

module.exports = function(cb){
	config.load(function(err){
		if(err){
			log.error(err.stack);
			log.info('defaulting to default config options');
			config.save();
		}
		cb(config);
	});
};