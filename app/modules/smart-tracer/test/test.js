var fs = require('fs');
var path = require('path');

var intercept = require('intercept-stdout');
var rimraf = require('rimraf');

function expectStdout(expected, done){
	var stopIntercepting = intercept(function(data){
		stopIntercepting();
		data = data.toString().trim();
		if(!data.match(new RegExp(expected)))
			throw new Error('Expected ' + expected + ' but got ' + data);
		done();
	});
}

var log = require('../index');
describe('smart-tracer', function(){
	it('level methods work', function(){
		log.log('log');
		log.trace('trace');
		log.debug('debug');
		log.info('info');
		log.warn('warn');
		log.error('error');
		log.audit('audit');
	});
	it('logs to console', function(done){
		var msg = 'logging';
		expectStdout(msg, done);
		log.log(msg);
	});
	it('set log level', function(done){
		var msg = 'log level';
		expectStdout(msg, done);
		log.setLevel('error');
		log.trace(msg+'wrong');
		log.error(msg);

		log.setLevel('trace'); //cleanup
	});
	describe('audits', function(){
		var logDir = 'test/log';
		function getAuditFileName(){
			var date = new Date();
			return 'audit_'+date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'.json';
		}
		before(function(done){
			log.logToFiles(logDir);
			fs.exists(logDir, function(e){
				e? done(): fs.mkdir(logDir, done);
			});
		});
		after(function(done){
			rimraf(logDir, done);
		});
		it('disabled', function(done){
			log.audit('testing', {who: 'mocha test', test: 'disabled'});
			setTimeout(function(){
				fs.exists(path.join('..', logDir, getAuditFileName()), function(exist){
					if(exist)
						throw new Error('Audits is disabled but audited data anyway');
					done();
				});
			}, 200);
		});
		it('default', function(done){
			log.setAudit(true);
			log.audit('testing', {who: 'mocha test', test: 'default'});
			setTimeout(function(){
				fs.readFile(path.join(logDir, getAuditFileName()), function(err, data){
					if(err)
						throw err;
					var lines = data.toString().trim().split(/\r?\n/);
					var lastLine = lines.pop();
					var audit = JSON.parse(lastLine);
					if(audit.action !== 'testing')
						throw new Error('Audit does not have correct action, got ' + audit.action);
					if(!audit.when)
						throw new Error('Audit does not have a when datetime');
					if(audit.who !== 'mocha test')
						throw new Error('Audit does not have correct who recorded, got ' + audit.who);
					if(audit.test !== 'default')
						throw new Error('Audit does not have correct test name, got ' + audit.test);
					done();
				});
			}, 200);
		});
		it('two logs', function(done){
			log.setAudit(true);
			log.audit('testing', {who: 'mocha test', test: 'two logs'});
			setTimeout(function(){
				fs.readFile(path.join(logDir, getAuditFileName()), function(err, data){
					if(err)
						throw err;
					var lines = data.toString().trim().split(/\r?\n/);
					var lastLine = lines.pop();
					var audit = JSON.parse(lastLine);
					if(audit.action !== 'testing')
						throw new Error('Audit does not have correct action, got ' + audit.action);
					if(!audit.when)
						throw new Error('Audit does not have a when datetime');
					if(audit.who !== 'mocha test')
						throw new Error('Audit does not have correct who recorded, got ' + audit.who);
					if(audit.test !== 'two logs')
						throw new Error('Audit does not have correct test name, got ' + audit.test);
					done();
				});
			}, 200);
		});
		it('custom', function(done){
			log.setAudit(function(data, info){
				if(info.action !== 'testing')
					throw new Error('Audit does not have correct action, got ' + info.action);
				if(!info.when)
					throw new Error('Audit does not have a when datetime');
				if(info.who !== 'mocha test')
					throw new Error('Audit does not have correct who recorded, got ' + info.who);
				if(info.test !== 'custom')
					throw new Error('Audit does not have correct test name, got ' + info.test);
				done();
			});
			log.audit('testing', {who: 'mocha test', test: 'custom'});
		});
	});
	describe('logs to files', function(){
		var log1 = 'test/logs1';
		var log2 = 'test/logs2';
		before(function(done){
			fs.exists(log1, function(e){
				e? done(): fs.mkdir(log1, done);
			});
		});
		before(function(done){
			fs.exists(log2, function(e){
				e? done(): fs.mkdir(log2, done);
			});
		});
		after(function(done){
			rimraf(log1, done);
		});
		after(function(done){
			rimraf(log2, done);
		});
		it('enabled', function(done){
			log.logToFiles(log1, true);
			log.warn('warn');

			setTimeout(function(){
				fs.readFile(path.join(log1, 'warn.log'), function(err, data){
					if(err)
						throw err;
					data = data.toString().trim();
					if(!data.match(/warn$/))
						throw new Error('Expected warn message to be last but did not find, found: ' + data);
					done();
				})
			}, 200);
		});
		it('different folder', function(done){
			log.logToFiles(log2, true);
			log.debug('debug');

			setTimeout(function(){
				fs.readFile(path.join(log2, 'debug.log'), function(err, data){
					if(err)
						throw err;
					data = data.toString().trim();
					if(!data.match(/debug$/))
						throw new Error('Expected debug message to be last but did not find, found: ' + data);
					done();
				})
			}, 200);
		});
		it('disabled', function(done){
			log.logToFiles(false);
			log.error('error');

			setTimeout(function(){
				fs.readFile(path.join(log2, 'error.log'), function(err, data){
					if(err) return done();
					data = data.toString().trim();
					if(data.match(/error$/))
						throw new Error('Expected not to find error message as last in log file but did');
					done();
				})
			}, 200);
		});
	});
});