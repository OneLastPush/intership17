var path = require('path');
var fs = require('fs');
var request = require('http').request;
var exec = require('child_process').exec;

var express = require('express');
var errors = require('errors');

var log = require('smart-tracer');
var config = require('smart-config');

var managers = {};
var requiredFields = ['name', 'start', 'stop', 'ping', 'url', 'version', 'version_file', 'log_folder', 'install_log_folder'];

function ApplicationManager(name){
	managers[name] = this;
	var app = this;
	//setup config required fields for this application's config
	requiredFields.forEach(function(f){
		config.default(name+'.'+f, '');
	});
	config.default(name+'.log_extension', 'log');
	//utility for accessing configs later
	this.configRoot = name;
	this.config = {
		get: function(key){
			return config.get(key? app.configRoot+'.'+key: app.configRoot);
		}
	}

	//functions
	this.versionRegexes = [
		/C8BISRVR_version=(.+)/i, //cognos
		/product_version.?([\d\.]+)/i, //weblogic
		/fixversion.?([\d\.]+)/i, //websphere fixpack
		/version.?([\d\.]+)/i, //version=, version>, etc //websphere normal
		/([\d\.]+)/ //just look for version looking string
	];
	this.getVersion = function(opts, cb){
		var cmd = app.config.get('version');
		if(!cmd){
			var file = app.config.get('version_file');
			if(!file)
				return cb(new Error('could not find version file'));
			fs.readFile(file, function(err, data){
				if(err){
					err.message += ': version error '+file;
					return cb(err);
				}
				data = data.toString();
				var version, match;
				var index = 0;
				do{
					match = data.match(app.versionRegexes[index++]);
					if(match && match.length > 0)
						version = match[1];
				}while(!version && index < app.versionRegexes.length);
				if(!version)
					return cb(new Error('could not find version'));
				cb(undefined, version.trim());
			});
		}else{
			exec(cmd, function(err, stdout, stderr){
				cb(err || stderr, stdout);
			});
		}
	};
	this.ping = function(opts, cb){
		var cmd = app.config.get('ping');
		if(!cmd){
			var url = app.config.get('url');
			request(url, function(res){
				res.on('data', function(chunk){

				});
				res.on('end', function(){
					cb(undefined, (res.statusCode == 200 || res.statusCode == 302 || res.statusCode == 301));
				});
			}).on('error', function(err){
				cb(err, false);
			}).end();
		}else{
			exec(cmd, function(err, stdout, stderr){
				cb(err || stderr, stdout);
			});
		}
	};
	this.start = function(opts, cb){
		var cmd = app.config.get('start');
		if(!cmd)
			return cb(new Error('start command not found'));
		exec(cmd, function(err, stdout, stderr){
			cb(err || stderr, stdout);
		});
	};
	this.stop = function(opts, cb){
		var cmd = app.config.get('stop');
		if(!cmd)
			return cb(new Error('stop command not found'));
		exec(cmd, function(err, stdout, stderr){
			cb(err || stderr, stdout);
		});
	};
	//logs
	this.hasLogs = function(){
		return app.config.get('log_folder')? true: false;
	};
	this.getLogsList = function(cb){
		var dir = app.config.get('log_folder');
		var ext = app.config.get('log_extension');
		if(!dir)
			return cb(new Error('no logs configured'));
		fs.readdir(dir, function(err, list){
			if(err){
				err.message += ': logs configuration issue';
				return cb(err);
			}
			var files = [];
			var filter = function(file){
				return fs.statSync(path.join(dir, file)).isFile();
			};
			if(ext){
				var regexp = new RegExp('\.'+ext+'$', 'i');
				filter = function(file){
					return file.match(regexp);
				}
			}
			list.forEach(function(file){
				if(filter(file))
					files.push(file);
			});
			cb(undefined, {
				dir: dir,
				files: files
			});
		});
	};
	this.hasInstallLogs = function(){
		return app.config.get('install_log_folder')? true: false;
	};
	this.getInstallLogsList = function(cb){
		var dir = app.config.get('install_log_folder');
		var ext = app.config.get('log_extension');
		if(!dir)
			return cb(new Error('no install logs configured'));
		fs.readdir(dir, function(err, list){
			if(err){
				err.message += ': install logs configuration issue';
				return cb(err);
			}
			var files = [];
			var filter = function(file){
				return fs.statSync(path.join(dir, file)).isFile();
			};
			if(ext){
				var regexp = new RegExp('\.'+ext+'$', 'i');
				filter = function(file){
					return file.match(regexp);
				}
			}
			list.forEach(function(file){
				if(filter(file))
					files.push(file);
			});
			cb(undefined, {
				dir: dir,
				files: files
			});
		});
	}

	//express / router stuff
	this.errors = errors.addErrors('manage-application', path.join(__dirname, 'errors.ini'), [
		['404-0', /could not find version/i],
		['404-1', /start command not found/i],
		['404-2', /stop command not found/i],

		['404-3', /no logs configured/i],
		['404-4', /no install logs configured/i],

		['400-0', /version error/i],
		['400-1', /logs configuration issue/i],
		['400-2', /install logs configuration issue/i],
	]).middleware;
	this.router;
	this.getRouter = function(){
		if(app.router)
			return app.router;

		app.router = new express.Router();
		app.router.use(app.errors);
		app.router.all('/name', function(req, res){
			res.send(app.config.get('name'));
		});
		app.router.all('/url', function(req, res){
			res.send(app.config.get('url'));
		});
		app.router.all('/version', function(req, res){
			app.getVersion(req.body, function(err, v){
				if(err)
					return res.error(err);
				res.send(v);
			});
		});
		app.router.all('/start', function(req, res){
			app.start(req.body, function(err, output){
				if(err)
					return res.error(err);
				res.send(output);
			});
		});
		app.router.all('/stop', function(req, res){
			app.stop(req.body, function(err, output){
				if(err)
					return res.error(err);
				res.send(output);
			});
		});
		app.router.all('/ping', function(req, res){
			app.ping(req.body, function(err, output){
				if(err)
					return res.error(err);
				res.send(output);
			});
		});

		app.router.all('/logs', function(req, res){
			res.send(app.hasLogs());
		});
		app.router.all('/logs/list', function(req, res){
			app.getLogsList(function(err, data){
				if(err)
					return res.error(err);
				res.send(data);
			});
		});
		app.router.all('/logs/install', function(req, res){
			res.send(app.hasInstallLogs());
		});
		app.router.all('/logs/install/list', function(req, res){
			app.getInstallLogsList(function(err, data){
				if(err)
					return res.error(err);
				res.send(data);
			});
		});

		return app.router;
	}
}

module.exports = {
	app: managers,
	ApplicationManager: ApplicationManager
};