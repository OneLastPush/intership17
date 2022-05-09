/**
 * This is a mocha test suite
 *
 * > npm install -g mocha
 *
 * to run:
 * > mocha
 * or
 * > mocha test/test.js
 *
 * then you will see if passes
 */
var test = require('supertest');
var fs = require('fs');

var log = require('smart-tracer');
log.setLevel(6); //silent logging, remove to see all

var app = {
	slave: {},
	master: {}
};
var getState = "var state = require('./test/app/state.json');";
var saveState = "require('fs').writeFile('./test/app/state.json', JSON.stringify(state, null, 4));";
var configs = {
	name: 'Test',
	start: 'node -e "'+getState+"state.ping=true;"+saveState+'"',
	stop: 'node -e "'+getState+"state.ping=false;"+saveState+'"',
	ping: 'node -e "'+getState+"process.stdout.write(state.ping+'');"+'"',
	url: 'http://www.google.com',
	version: 'node -e "process.stdout.write(\'1.0.1\');"'
	//version file
	//log_file
	//install_log_folder
};
var config = require('smart-config').setFile('test/config.json');
var module = {};
describe('manage-application', function(){
	describe('as an application', function(){
		before(function(done){
			var index = 1;
			function doDone(err){
				if(err){
					done(err);
					index=-100;
				}
				if(--index===0)
					done();
			}
			index++;
			require('../app')(function(app){
				doDone();
			});
			index++;
			var express = require('express');
			app.master.m = require('master-slave').master();
			app.master.m.addServer('application', 'http://localhost:4333', 'superdupersecretthing');
			app.master.app = new express();
			app.master.app.use(app.master.m.router);
			app.master.app.listen(4001);
			app.master.request = test(app.master.app);
			app.master.m.sniffAll(function(err){
				doDone(err);
				//console.log(app.master.m.config.servers.application.routes);
			})
			doDone();
		});
		it('set configuration', function(done){
			app.master.request.post('/config')
			.send(configs)
			.expect(200)
			.end(function(err, res){
				if(err)
					return done(err);
				setTimeout(function(){
					var config = require('./config.json');
					if(config.Application){
						for(var key in configs){
							if(config.Application[key] != configs[key])
								throw new Error('Expected ' + configs[key] + ' under '+key+' in configuration file. Got ' + config.Application[key]);
						}
					}else{
						done(new Error('Configuration file does not have Application section'));
					}
					done();
				}, 2000);
			});
		});
		it('get name', function(done){
			app.master.request.post('/app/name')
			.expect(200, 'Test')
			.end(done);
		});
		it('get url', function(done){
			app.master.request.post('/app/url')
			.expect(200, 'http://www.google.com')
			.end(done);
		});
		describe('start & stop', function(){
			describe('configured', function(){
				it('start', function(done){
					app.master.request.post('/app/start')
					.expect(200)
					.end(function(err, res){
						if(err)
							return done(err);
						var state = require('./app/state.json');
						if(state===false)
							return done(new Error('started app but app is still off'));
						done();
					});
				});
				it('stop', function(done){
					app.master.request.post('/app/stop')
					.expect(200)
					.end(function(err, res){
						if(err)
							return done(err);
						var state = require('./app/state.json');
						if(state===true)
							return done(new Error('stopped app but app is still on'));
						done();
					});
				});
			});
			describe('not configured', function(){
				before(function(done){
					app.master.request.post('/config')
					.send({
						start: '',
						stop: ''
					}).end(done);
				});
				after(function(done){
					app.master.request.post('/config')
					.send({
						start: 'node -e "'+getState+"state.ping=true;"+saveState+'"',
						stop: 'node -e "'+getState+"state.ping=false;"+saveState+'"'
					}).end(done);
				});
				it('start', function(done){
					app.master.request.post('/app/start')
					.expect(404, 'Could not start because there is no start command to run')
					.end(done);
				});
				it('stop', function(done){
					app.master.request.post('/app/stop')
					.expect(404, 'Could not stop because there is no stop command to run')
					.end(done);
				});
			});
		});
		describe('version', function(){
			it('cmd', function(done){
				app.master.request.post('/app/version')
				.expect(200, '1.0.1')
				.end(done);
			});
			it('cognos file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './test/version_files/cognos.txt'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(200, 'C8BISRVR-LX64-ML-RTM-10.2.1003.159-0')
					.end(done);
				})
			});
			it('weblogic file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './test/version_files/weblogic.properties'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(200, '12.1.3.0.0')
					.end(done);
				})
			});
			it('websphere fixpack file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './test/version_files/websphere_fixpack.fxtag'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(200, '8.5.5.2')
					.end(done);
				})
			});
			it('websphere file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './test/version_files/websphere.swtag'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(200, '8.5.5')
					.end(done);
				})
			});
			it('other file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './test/version_files/other.txt'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(200, '10.0.21')
					.end(done);
				})
			});
			it('wrong file', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: './ergfegr'
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(400, 'Error retrieving version information')
					.end(done);
				})
			});
			it('dne', function(done){
				app.master.request.post('/config')
				.send({
					version: '',
					version_file: ''
				}).end(function(err){
					if(err)
						return done(err);
					app.master.request.post('/app/version')
					.expect(404, 'Could not find version information')
					.end(done);
				})
			});
		})
		describe('ping', function(){
			it('cmd ping up', function(done){
				app.master.request.post('/app/start')
				.expect(200)
				.end(function(err, res){
					if(err)
						return done(err);
					app.master.request.post('/app/ping')
					.expect(200, 'true')
					.end(done);
				});
			});
			it('cmd ping down', function(done){
				app.master.request.post('/app/stop')
				.expect(200)
				.end(function(err, res){
					if(err)
						return done(err);
					app.master.request.post('/app/ping')
					.expect(200, 'false')
					.end(done);
				});
			});
			it('url ping up', function(done){
				var index = 2;
				function doTest(err){
					if(err){
						index = -100;
						return done(err);
					}
					if(--index===0){
						app.master.request.post('/app/ping')
						.expect(200, 'true')
						.end(done);
					}
				}
				app.master.request.post('/config')
				.send({ping:''})
				.expect(200)
				.end(doTest);
				app.master.request.post('/app/start')
				.expect(200)
				.end(doTest);
			});
			it('url ping down / dne', function(done){
				app.master.request.post('/config')
				.send({url:'http://awfdewferwrr.fwge'})
				.expect(200)
				.end(function(err, res){
					if(err)
						return done(err);
					app.master.request.post('/app/ping')
					.expect('false')
					.end(function(err, res){
						done();
					});
				});
			});
		});
		describe('modules', function(){
			it('browse_fs', function(done){
				app.master.request.post('/fs')
				.send({folder:'./'})
				.expect(200)
				.end(function(err, res){
					if(err)
						return done(err);
					if(res.body.title && res.body.path && res.body.folder && res.body.children && res.body.children.length > 0)
						done();
					else
						done(new Error('browse fs did not return expected data'));
				});
			});
			it('system info', function(done){
				app.master.request.post('/sys')
				.expect(200)
				.end(function(err, res){
					if(err)
						return done(err);
					var data = res.body;
					if(data.host_name && data.type && data.platform && data.architecture && data.release && data.model &&
						data.cpus && data.ram && data.swap && data.network && data.disk_usage)
						done();
					else
						done(new Error('system info did not return expected data'));
				});
			});
		});
		describe('file system functions', function(){
			var logs = [{
				name: 'normal logs',
				config: 'log_folder',
				url: 'logs',
				errInvalidConfig: 'Could not serve log files because the configured log folder is invalid',
				err: 'Could not serve log files. There is a configuration issue with the configured folder.'
			},{
				name: 'install logs',
				config: 'install_log_folder',
				url: 'logs/install',
				errInvalidConfig: 'Could not serve install log files because the configured install log folder is invalid',
				err: 'Could not serve install log files. There is a configuration issue with the configured folder.'
			}];
			before(function(done){ //setup logs test area. Git doens't commit empty folders so may have to make
				var index = 4;
				function doDone(err){
					if(err){
						index = -100;
						done(err);
					}
					if(--index===0)
						done();
				}
				fs.exists('test/logs/empty', function(exists){
					if(!exists)
						fs.mkdir('test/logs/empty', doDone);
					else
						doDone();
				});
				fs.exists('test/logs/files folders/folder', function(exists){
					if(!exists)
						fs.mkdir('test/logs/files folders/folder', doDone);
					else
						doDone();
				});
				fs.exists('test/logs/logs files folders/folder', function(exists){
					if(!exists)
						fs.mkdir('test/logs/logs files folders/folder', doDone);
					else
						doDone();
				});
				doDone();
			});

			logs.forEach(function(l){
				describe(l.name, function(){
					it('hasLogs no', function(done){
						var send = {};
						send[l.config] = '';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url)
							.expect(200, 'false')
							.end(done);
						});
					});
					it('hasLogs yes', function(done){
						var send = {};
						send[l.config] = 'test/logs/empty';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url)
							.expect(200, 'true')
							.end(done);
						});
					});

					it('getLogslist none', function(done){
						var send = {};
						send[l.config] = '';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url+'/list')
							.expect(404, l.errInvalidConfig)
							.end(done);
						});
					});
					it('getLogsList wrong path', function(done){
						var send = {};
						send[l.config] = 'test/logs/not here';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url+'/list')
							.expect(400, l.err)
							.end(done);
						});
					});
					it('getLogsList empty', function(done){
						var send = {};
						send[l.config] = 'test/logs/empty';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url+'/list')
							.expect(200, {
								dir: 'test/logs/empty',
								files: []
							}).end(done);
						});
					});
					it('getLogsList with files and folders', function(done){
						var send = {};
						send[l.config] = 'test/logs/files folders';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url+'/list')
							.expect(200, {
								dir: 'test/logs/files folders',
								files: []
							}).end(done);
						});
					});
					it('getLogsList with .log files and files and folders', function(done){
						var send = {};
						send[l.config] = 'test/logs/logs files folders';
						app.master.request.post('/config')
						.send(send)
						.expect(200)
						.end(function(err, res){
							if(err)
								return done(err);
							app.master.request.post('/app/'+l.url+'/list')
							.expect(200, {
								dir: 'test/logs/logs files folders',
								files: ['log.log']
							}).end(done);
						});
					});

					it('read whole file', function(done){
						app.master.request.post('/fs/file')
						.send({file: 'test/logs/logs files folders/log.log'})
						.expect(200, 'test1\r\ntest2')
						.end(done);
					});
					it('tail', function(done){
						app.master.request.post('/fs/file')
						.send({
							file: 'test/logs/logs files folders/log.log',
							lines: -1
						}).expect(200, '... <<< more >>>\ntest2')
						.end(done);
					});
					it('head', function(done){
						app.master.request.post('/fs/file')
						.send({
							file: 'test/logs/logs files folders/log.log',
							lines: 1
						}).expect(200, 'test1\r\n<<< more >>> ...')
						.end(done);
					});
				});
			});
			describe('log file extension change', function(){
				before(function(done){
					app.master.request.post('/config')
					.send({'log_extension': ''})
					.expect(200)
					.end(done);
				});
				after(function(done){
					app.master.request.post('/config')
					.send({'log_extension': 'log'})
					.expect(200)
					.end(done);
				});
				it('logs', function(done){
					app.master.request.post('/app/logs/list')
					.expect(200, {
						dir: 'test/logs/logs files folders',
						files: ['file', 'log.log']
					}).end(done);
				});
				it('install logs', function(done){
					app.master.request.post('/app/logs/install/list')
					.expect(200, {
						dir: 'test/logs/logs files folders',
						files: ['file', 'log.log']
					}).end(done);
				});
			});
		});
	});
	describe('as a module', function(){
		before(function(){
			module.ma = require('../index');
		});
		it('set configuration', function(){
			config.set('App1', configs);
			config.set('App1.name', 'App1');
			config.set('App2', configs);
			config.set('App2.name', 'App2');
		});
		it('one instance', function(){
			module.instance1 = new module.ma.ApplicationManager('App1');
			if(!module.ma.app.App1 || module.ma.app.App1 !== module.instance1)
				throw new Error('App1 could not be found in saved instances');
		});
		it('two instance', function(){
			module.instance2 = new module.ma.ApplicationManager('App2');
			if(!module.ma.app.App2 || module.ma.app.App2 !== module.instance2)
				throw new Error('App2 could not be found in saved instances');
			if(module.instance1 === module.instance2)
				throw new Error('App1 and App2 are the same instance');
		});
		it('overwriting instance functionality changes router', function(done){
			var app = new require('express')();
			app.use(module.instance1.getRouter());
			app.listen(436543);
			var request = test(app);

			module.instance1.getVersion = function(opts, cb){
				cb(undefined, 'App1.1.0.0');
			};

			request.get('/version')
			.expect(200, 'App1.1.0.0')
			.end(done);
		});
	});
});