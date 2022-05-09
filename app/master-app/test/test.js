/**
 * mocha
 *
 * Only tests if module works, not extensively.
 * If functionality is written in master-app should be tested extensively.
 */

var d = {
	testEmail: 'ganna.shmatova@cleargoals.com',
	canEmail: false, //gmail now blocks addresses that try to use api more than once every 10 mins, ffs
	adminLogin: {
		username: 'admin',
		password: 'password'
	},
	externalLogin: { //has to have cli and run permissions
		username: 'ganna',
		password: 'Cleargoals1'
	},
	externalLogin2: { //has to have cli and run permissions
		username: 'asm_admin',
		password: 'password'
	},

	plugins: { //plugins for tests to skip if they are not active / if you don't want start / stop env tests
		emm: false,
		cognos: false,

		websphere: false,
		weblogic: false,

		apache: false,
		iis: false
	},
	validRunnableFlowchartPath: 'campaigns/test/Test_C000000003_Flowchart 1.ses', //only if emm is true
	validRunnableFlowchartPath2: 'campaigns/test/Test_C000000003_Flowchart 2.ses', //only if emm is true

	//test configs, pay no mind
	logsFolder: 'test/logs',
	tmp: 'test/tmp',

	//functional stuff
	Session: undefined,
	request: undefined
};

var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var async = require('async');
var log = require('smart-tracer');

var safeRoutes = [ //these should be behind authorization & only on POST d.request
	//all of these also have been tested in their own repos and should require minimum to get working
	//so these tests are rudimentary just to see that they arent crashing
	{ name: 'configuration', url: '/config/get' },
	{ name: 'browse fs', url: '/fs', send: {folder: './'} },
	{ skip: true, name: 'browse ftp', url: '/ftp', send: {server: 'target10', folder: './'} }, //TODO configured doesn't work anymore...
	{ skip: !d.canEmail, name: 'email', url: '/email/send', send: {
		subject: 'Test - {getServerDate}',
		body: 'Hello, world. You are THE world! Right now is: {getServerDate}',
		emails: ['ganna.shmatova@cleargoals.com']}
	}
];

var plugins = [
	{ name: 'emm', url: '/emm/app/listener/campaign/name' },
	{ name: 'cognos', url: '/cognos/app/name' },
	{ name: 'websphere', url: '/websphere/app/name' },
	{ name: 'weblogic', url: '/weblogic/app/name' },
	{ name: 'apache', url: '/apache/app/name' },
	{ name: 'iis', url: '/iis/app/name' }
];
plugins.forEach(function(p){
	if(!d.plugins[p.name])
		p.skip = true;
});

//set lower case usernames for case insensitivity tests
d.adminLogin.username = d.adminLogin.username.toLowerCase();
d.externalLogin.username = d.externalLogin.username.toLowerCase();

//normalize paths
if(d.validRunnableFlowchartPath)
	d.validRunnableFlowchartPath = path.normalize(d.validRunnableFlowchartPath);
if(d.validRunnableFlowchartPath2)
	d.validRunnableFlowchartPath2 = path.normalize(d.validRunnableFlowchartPath2);

d.removeIds = function removeIds(res){ //use this to remove _id from db. We arne't matching for that.
	if(res.body){
		if(res.body._id)
			delete res.body._id;
		if(res.body instanceof Array){
			res.body.forEach(function(i){
				if(i._id)
					delete i._id;
			});
		}
	}
};

d.findFlowchart = function findFlowchart(d, flowchartFileRegex, cb){
	d.request.post('/emm/app/status').expect(200).send(d.adminLogin).end(function(err, res){
		if(err) return cb(err);
		var session;
		res.body.data.forEach(function(s){
			if(s.filename && path.normalize(s.filename).match(flowchartFileRegex))
				session = s;
		});
		cb(err, session, res.body.data);
	});
}

d.smartFindFlowchart = function smartFindFlowchart(d, flowchartFile, cb){
	var flowchartFileRegex = new RegExp(path.normalize(flowchartFile).replace(/\\|\//g, '\\$&'));
	var index = 50;
	var foundSession;
	async.whilst(function(){
		if(--index <= 0)
			throw new Error('Timed out trying to find flowchart');
		return !foundSession;
	}, function(cb){
		setTimeout(d.findFlowchart, 200, d, flowchartFileRegex, function(err, session, data){
			foundSession = session? (session.pid != -1? true: false): false;
			cb(err, session, data);
		});
	}, cb);
}

// START //
describe('master-app', function(){
	before(function(done){
		log.logToFiles(d.logsFolder);
		log.setAudit(true);
		fs.exists(d.logsFolder, function(exists){
			if(exists)
				done();
			else
				fs.mkdir(d.logsFolder, done);
		});
	});
	before(function(done){
		require('../app')('test', function(app){
			log.setLevel('error');
			var session = require('supertest-session');
			d.Session = function(){ //backwards compatibility with sueprtest-session 1.x (originally cases were written with 1.x)
				return session(app);
			};
			done();
		});
	});
	before(function(done){
		fs.exists(d.tmp, function(exist){
			exist? done(): fs.mkdir(d.tmp, done);
		});
	});
	before(function(done){ //sets Admin to be able to use ibm emm
		d.request = new d.Session();
		d.request.post('/login').send(d.adminLogin).end(function(err, res){
			if(err) throw err;
			d.request.post('/db/internal/user/set').send({
				username: 'admin',
				data: {
					'IBM Marketing': {
						Username: d.externalLogin.username,
						Password: d.externalLogin.password
					}
				}
			}).end(function(err, res){
				if(err) throw err;
				d.request.post('/login/logout').end(function(err, res){
					d.request.destroy();
					done(err);
				});
			});
		});
	});
	after(function(done){
		rimraf(d.logsFolder, done);
	});
	after(function(done){
		rimraf(d.tmp, done);
	});
	after(function(done){
		rimraf('test/data', function(err){ //gives eperm erorr but deletes insides anyway
			done();
		});
	});

	//test specific functionality
	require('./audits')(d);
	require('./db/internal_db')(d);
	require('./router_permission')(d);

	//test master-app framework
	describe('sessionless', function(){
		describe('public routes', function(){
			before(function(){
				d.request = new d.Session();
			});
			after(function(){
				d.request.destroy();
			});
			it('license', function(done){
				d.request.get('/license').expect(200).end(done);
			});
			it('system info', function(done){
				d.request.post('/sys').expect(200).end(done);
			});
		});
		describe('authenticating', function(){
			before(function(){
				d.request = new d.Session();
			});
			after(function(){
				d.request.destroy();
			});
			it('brute force protection');
			describe('non-existent', function(){
				it('login', function(done){
					d.request.post('/login').send({username: '123123', password: 'bwuahahaha'}).expect(401).end(done);
				});
				it('logout', function(done){
					d.request.post('/login/logout').expect(200).end(done);
				});
			});
			describe('internal', function(){
				require('./db/login')(d);
			});
			describe('ldap', function(){
				it('login', function(done){
					d.request.post('/login').send(d.externalLogin).expect(200).end(done);
				});
				it('logout', function(done){
					d.request.post('/login/logout').expect(200).end(done);
				});
			});
			describe('campaign', function(){
				it('login');
				it('logout');
			});
		});

		describe('unauthorized routes', function(){
			before(function(){
				d.request = new d.Session();
			});
			after(function(){
				d.request.destroy();
			});
			safeRoutes.forEach(function(test){
				it(test.name, function(done){
					d.request.post(test.url).expect(401).end(done);
				});
			});
		});
	});
	describe('authenticated routes', function(){
		before(function(done){
			d.request = new d.Session();
			d.request.post('/login').send(d.adminLogin).end(done);
		});
		after(function(done){
			d.request.post('/login/logout').end(function(err, res){
				d.request.destroy();
				done(err, res);
			});
		});

		describe('POST', function(){
			safeRoutes.forEach(function(test){
				if(test.skip)
					it(test.name)
				else{
					it(test.name, function(done){
						d.request.post(test.url).send(test.send).expect(200).end(done);
					});
				}
			});
		});
		describe('GET', function(){
			safeRoutes.forEach(function(test){
				if(test.skip)
					it(test.name)
				else{
					it(test.name, function(done){
						d.request.get(test.url).send(test.send).expect(404).end(done);
					});
				}
			});
		});
		describe('plugins', function(){
			describe('POST', function(){
				plugins.forEach(function(test){
					if(test.skip)
						it(test.name)
					else{
						it(test.name, function(done){
							d.request.post(test.url).send(test.send).expect(200).end(done);
						});
					}
				});
			});
			describe('GET', function(){
				plugins.forEach(function(test){
					if(test.skip)
						it(test.name)
					else{
						it(test.name, function(done){
							d.request.get(test.url).send(test.send).expect(404).end(done);
						});
					}
				});
			});
		});
	});
});