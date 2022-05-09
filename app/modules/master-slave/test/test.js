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

var express = require('express');
var test = require('supertest');
var request = require('request');

var index = require('../index');

//slave 1
var slave1 = {
	app: new express(),
	config: { 'auth': 'test_auth' },
	ms: null,
	req: null
};
//slave 2 secure-er
var slave2 = {
	app: new express(),
	config: { 'auth': 'super_secure' },
	ms: null,
	req: null
};
//master
var master = {
	app: new express(),
	auth: 'test_auth',
	ms: null,
	req: null
};

describe('master-slave', function(){
	before(function(){
		slave1.ms = index.slave(slave1.config); //set initial config
		slave1.ms.on('config', function(config){ //add listener for config changes in case master wants to overwrite config
			slave1.config.slave = config; //do whatever you want with it
		});
		slave1.app.use(slave1.ms.router); //add slave to your express application
		//make some routes:
		slave1.ms.router.use('/hello', function(req, res){
			res.status(200).send('hello, from slave1');
		});
		slave1.ms.router.use('/echo', function(req, res){
			res.status(200).send(req.body);
		});
		slave1.app.listen(3334); //start app
		slave1.req = test(slave1.app); //make test request object
	});
	before(function(){
		slave2.ms = index.slave(slave2.config);
		slave2.ms.on('config', function(config){
			slave2.config.slave = config;
		});
		slave2.app.use(slave2.ms.router);
		slave2.ms.router.all('/special/hello', function(req, res){
			res.status(200).send('hello, from slave2');
		});

		// var base = express.Router(); //EXPRESS DOES NOT SUPPORT
		// base.all('/echo2', function(req, res){
		// 	res.status(200).send(req.body.echo+'1');
		// });
		// slave2.ms.router.use(base);
		var mounted = express.Router();
		mounted.all('/echo2', function(req, res){
			res.status(200).send(req.body.echo+'2');
		});
		slave2.ms.router.use('/mounted', mounted);
		var mountOnMount = express.Router();
		mountOnMount.all('/echo2', function(req, res){
			res.status(200).send(req.body.echo+'3');
		});
		mounted.use('/mountOnMount', mountOnMount);

		slave2.app.listen(3335);
		slave2.req = test(slave2.app);
	});
	before(function(done){
		master.ms = index.master(function(router){
			router.all('/setup', function(req, res){
				master.setupData = 'setupRan';
				res.send();
			});
		});
		master.app.use(master.ms.router); //add master to your express application
		master.ms.config.auth = master.auth; //set default auth key (will sue if a server doens't have one)
		//set your normal routes that master serves
		master.app.use('/master', function(req, res){
			res.status(200).send('hello, from master');
		});

		//prelaunch slave added
		master.ms.addServer('slave1', 'http://localhost:3334');

		master.app.listen(3333); //start app
		master.req = test(master.app); //make test request object

		//post launch slave added
		master.ms.addServer('slave2', 'http://localhost:3335', 'super_secure');

		//sniff slaves
		master.ms.sniffAll(function(err, servers){
			done(err);
		});
	});

	it('master config transfer to slave', function(done){
		master.ms.getForwardData('/config', 'slave2', function(err, connOpts){
			connOpts.body = {test: 'woohoo'};
			connOpts.json = true;
			master.ms.request.post(connOpts, function(err, res, body){
				if(res.statusCode != 200)
					throw new Error('status code expect 200, got ' + res.statusCode);
				if(slave2.config.slave.test != 'woohoo')
					throw new Error('config was not saved');
				done(err);
			});
		});
	});

	describe('master', function(){
		it('get response', function(done){
			master.req.get('/master').expect(200)
			.expect(function(res){
				if(res.text != 'hello, from master');
					new Error('response does not match expected');
			}).end(done);
		});
		it('change something', function(done){
			master.req.get('/setup')
			.expect(200)
			.end(function(err, res){
				if(err)
					return done(err);
				if(master.setupData !== 'setupRan')
					return done(new Error('expected function was not run'));
				done();
			});
		});
	});
	describe('routing', function(){
		it('unkown route', function(done){
			master.req.get('/abcabc').expect(404).end(done);
		});

		it('slave1 default auth', function(done){
		master.req.get('/hello').expect(200)
			.expect(function(res){
				if(res.text != 'hello, from slave1');
					new Error('response does not match expected');
			}).end(done);
		});
		it('slave2 special auth', function(done){
			master.req.get('/special/hello').expect(200)
			.expect(function(res){
				if(res.text != 'hello, from slave2');
					new Error('response does not match expected');
			}).end(done);
		});
		it('slave1 echo string', function(done){
			master.req.get('/echo').expect(200)
			.send('hello world')
			.expect(function(res){
				if(res.text != 'hello world');
					new Error('response does not match expected');
			}).end(done);
		});

		it('slave1 echo json', function(done){
			master.req.get('/echo').expect(200)
			.send({hello: 'world'})
			.expect(function(res){
				var json = res.body;
				if(!json || json.hello != 'world')
					new Error('response does not match expected');
			}).end(done);
		});

		describe('mounts', function(){
			// it.skip('base', function(done){ //express does not support
			// 	slave2.req.get('/echo2').expect(200)
			// 	.send({echo:'helloworld'})
			// 	.expect(200, 'helloworld1')
			// 	.end(done);

			// 	master.req.get('/echo2').expect(200)
			// 	.send({echo:'helloworld'})
			// 	.expect(200, 'helloworld1')
			// 	.end(done);
			// });
			it('mounted', function(done){
				master.req.get('/mounted/echo2').expect(200)
				.send({echo:'helloworld'})
				.expect(200, 'helloworld2')
				.end(done);
			});
			it('mount on mount', function(done){
				master.req.get('/mounted/mountOnMount/echo2').expect(200)
				.send({echo:'helloworld'})
				.expect(200, 'helloworld3')
				.end(done);
			});
		});
	});

	describe('slave security', function(){
		it('directly existing', function(done){
			slave1.req.get('/hello').expect(404)
			.expect(function(res){
				if(res.text != 'Request from Master server is missing authentication key. Please configure.');
					new Error('response does not match expected');
			}).end(done);
		});
		it('directly non-existing', function(done){
			slave2.req.get('/mfrggerfr').expect(404)
			.expect(function(res){
				if(res.text != 'Request from Master server is missing authentication key. Please configure.');
					new Error('response does not match expected');
			}).end(done);
		});
	});

	describe('named routing', function(){
		before(function(done){
			//give mount points
			master.ms.addServer('slave1', 'http://localhost:3334', undefined, 'slave1');
			master.ms.addServer('slave2', 'http://localhost:3335', 'super_secure', 'slave2');
			//sniff slaves
			master.ms.sniffAll(function(err, servers){
				done(err);
			});
		});
		it('slave1', function(done){
			master.req.get('/slave1/hello').expect(200)
			.expect(function(res){
				if(res.text != 'hello, from slave1');
					new Error('response does not match expected');
			}).end(done);
		});
		it('slave2', function(done){
			master.req.get('/slave2/special/hello').expect(200)
			.expect(function(res){
				if(res.text != 'hello, from slave2');
					new Error('response does not match expected');
			}).end(done);
		});
		it('non-existant slave1', function(done){
			master.req.get('/slave1/rferwfre').expect(404).end(done);
		});
		it('non-existant slave', function(done){
			master.req.get('/erfref/fewrf').expect(404).end(done);
		});
	});
});
