var assert = require('assert');
var request = require('supertest');
var express = require('express');
var master = require('master-slave').master;

var d = {
	loginCreds: {
		username: 'platform_admin',
		password: 'password'
	},
	listenerTests: [{
		desc: 'campaign',
		skip: false,
		stop_start: true //will do stop & start tests if true
	},{
		desc: 'optimizer',
		skip: true,
		stop_start: false //will do stop & start tests if true
	}],

	//this flowchart should not be instant/should have data in it
	//this flowchart should not take longer than the timeout time on the tests to run (probably < 15 seconds)
	validRunnableFlowchartPath: 'campaigns/test/Test_C000000003_Flowchart 1.ses',

	validCampaignCode: 'C000000003',
	invalidCampaignCode: 'C000invalid',
	validFlowchartName: 'Flowchart 1',
	invalidFlowchartName: 'Flowchart invalid',
	triggerMsg: 'test',

	p: [ //products that are installed on this machine & to test for
		'IBM Marketing Platform',
		'IBM Campaign',
		// 'IBM Marketing Platform',
		// 'IBM Contact Optimization',
		// 'IBM Distributed Marketing',
		// 'IBM Marketing Operations',
		'IBM Interact',
		// 'IBM SPSS Modeler Advantage'
	],
	util: [ //utilities available on this machine & to test for versions of
		'unica_svradm',
		'unica_aclsnr'
	],

	testCatalogPath: 'catalogs/testCatalog.cat',
	importedCamp: 'campaigns/importedCamp/',
	loginCreds: {
		username: 'platform_admin',
		password: 'password'
	},
	replicationAction: {
		abort: 'abort',
		replace: 'replace',
		skip: 'skip'
	},

	policy: 'Global Policy',

	masterPort: 4334,
	mount: 'emm',
	auth: 'superdupersecretthing',

	db: [ //databases to test versions for
		'IBM Platform Database',
		'IBM Campaign Database'
	],

	cmd: {
		noParam: 'npm', //TODO need to find a command you can run on windows without needing cmd.exe env vars
		stderr: 'java'
	}
};
describe('ibm-emm', function(){
	before(function(done){
		require('../app')('trace', function(app){
			d.master = {};
			d.master.ms = master();
			d.master.app = new express();
			d.master.app.use(d.master.ms.router);
			d.master.ms.addServer('ibm-emm', 'http://localhost:4333', d.auth, d.mount);
			d.master.app.listen(d.masterPort);
			d.request = request(d.master.app);
			d.master.ms.sniffAll(function(err, servers){
				done();
			});
		});
		d.emm = require('../index');
	});

	describe('stand-alone', function(){
		it('retrieve product versions', function(done){
			d.request.post('/'+d.mount+'/app/version')
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				d.p.forEach(function(p){
					if(!res.body[p])
						throw new Error('Could not find version for expected product: ' + p);
				});
				done();
			});
		});
		require('./db')(d); //does database tests
		describe('emm', function(){
			require('./emm/svradm')(d);
			require('./emm/report')(d);
			require('./emm/listeners')(d);
			require('./emm/trigger')(d);
			require('./emm/acsesutil')(d);
			//etc...
		});
		describe('external modules', function(){
			describe('manage application', function(){
				it('campaign', function(done){
					d.request.post('/'+d.mount+'/app/listener/campaign/name')
					.expect(200, 'IBM Campaign Listener')
					.end(done);
				});
				it('optimizer', function(done){
					d.request.post('/'+d.mount+'/app/listener/optimizer/name')
					.expect(200, 'IBM Contact Optimization')
					.end(done);
				});
				it('process logs', function(done){
					d.request.post('/'+d.mount+'/app/process/logs')
					.expect(200)
					.end(done);
				});
			});
			it('browse_fs', function(done){
				d.request.post('/'+d.mount+'/fs')
				.send({folder: './'})
				.expect(200)
				.end(done);
			});
			it('system_info_monitoring', function(done){
				d.request.post('/'+d.mount+'/sys')
				.expect(200)
				.end(done);
			});
		});
	});
	describe('module', function(){
		//this is rudimentary (unless otherwise stated) to see if stuff works despite standalone
		//stand-alone SHOULD test everything through and through
		describe('cli', function(){ //fully tested here / otherwise stated
			it.skip('no param', function(done){
				//TODO need to find a command you can run on windows without needing cmd.exe env vars
				d.emm.emm.call(d.cmd.noParam, [], {
					noPath: true
				}, function(err, data){
					if(err || data.stderr)
						return done(err || data.stderr);
					assert.equal(data.cmd, d.cmd.noParam);
					if(!data.stdout)
						return done(new Error('stdout is not what\'s expected, got ' + data.stdout));
					done();
				});
			});
			it('multi params', function(done){
				d.emm.emm.call('node', [
					'--print',
					'module.exports="hello";'
				], {
					noPath: true
				}, function(err, data){
					if(err || data.stderr)
						return done(err || data.stderr);
					assert.equal(data.cmd, 'node "--print" "module.exports="hello";"');
					assert.equal(data.stdout, 'hello\n');
					done();
				});
			});
			it('special characters', function(done){
				d.emm.emm.call('node', [
					'--print',
					'console.log(\'\\"test$%\\"\'); module.exports = \'test2\';'
				], {
					noPath: true
				}, function(err, data){
					if(err || data.stderr)
						return done(err || data.stderr);
					assert.equal(data.cmd, 'node "--print" "console.log(\'\\"test$%\\"\'); module.exports = \'test2\';"');
					assert.equal(data.stdout, '"test$%"\ntest2\n');
					done();
				});
			});
			it('provides username & password & hides password', function(done){
				d.emm.emm.call('node', [
					'test/echo.js'
				], {
					user: 'Someone here',
					pw: 'something',
					noPath: true
				}, function(err, data){
					if(err || data.stderr)
						return done(err || data.stderr);
					assert.equal(data.cmd, 'node "test/echo.js" "-y" "Someone here" "-z" "******"');
					if(!data.stdout || !data.stdout.match('-y Someone here -z something'))
						return done(new Error('command run did not recieve credentials, got '+data.stdout));
					done();
				});
			});
			it('cached run & accessing results');
			it.skip('stderr', function(done){ //removed because 'translateResult' in emm needed
				d.emm.emm.call(d.cmd.stderr, [], {
					noPath: true
				}, function(err, data){
					if(err)
						return done(err);
					assert.equal(data.cmd, d.cmd.stderr);
					if(!data.stderr)
						return done(new Error('stderr is not what\'s expected, got ' + data.stderr));
					done();
				});
			});
		});
	});
});