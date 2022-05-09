/**
 * mocha
 */
var log = require('tracer').colorConsole();
var errs = require('../index');

var express = require('express');
var test = require('supertest');

var app, errs, request, server;

function start(fn){
	app = express();
	request = test(app);
	fn(app);
	app.get('/unauth', function(req, res){ res.error('unauthorized'); });
	app.get('/noerr', function(req, res){ res.error('no error'); });
	app.get('/someerr', function(req, res){ res.error('some error', 'sup'); });
	server = app.listen(3333);
}

describe('errors', function(){
	describe('file data and hooks', function(){
		describe('missing file data', function(){
			before(function(){
				start(function(app){
					errs.addErrors('matching', './test/errors.ini', [
						['401-1', /unauthorized/i]
					]);
					app.use(errs.middleware);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('unauthorized route', function(done){
				request.get('/unauth').expect(401, 'unauthorized error').end(done);
			});
			it('no error route', function(done){
				request.get('/noerr').expect(500, 'no error').end(done);
			});
		});
		describe('missing hook', function(){
			before(function(){
				start(function(app){
					errs.addErrors('matching', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i],
						['405-1', /some error/i]
					]);
					app.use(errs.middleware);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('existing error', function(done){
				request.get('/unauth').expect(401, 'unauthorized error').end(done);
			});
			it('error not in errors file', function(done){
				request.get('/someerr').expect(500, 'some error sup').end(done);
			});
		});
		describe('exact match', function(){
			before(function(){
				start(function(app){
					errs.addErrors('matching', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i]
					]);
					app.use(errs.middleware);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('unauthorized route', function(done){
				request.get('/unauth').expect(401, 'unauthorized error').end(done);
			});
			it('no error route', function(done){
				request.get('/noerr').expect(404, 'There are no errors here').end(done);
			});
		});
	});
	describe('extension', function(){
		describe('exact duplicates', function(){
			before(function(){
				start(function(app){
					app.use(errs.middleware);
					errs.addErrors('first', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i]
					]);
					errs.addErrors('second', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i]
					]);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('unauthorized route', function(done){
				request.get('/unauth').expect(401, 'unauthorized error').end(done);
			});
			it('no error route', function(done){
				request.get('/noerr').expect(404, 'There are no errors here').end(done);
			});
		});
		describe('changed duplicate', function(){
			before(function(){
				start(function(app){
					app.use(errs.middleware);
					errs.addErrors('first', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i]
					]);
					errs.addErrors('second', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /some error/i]
					]);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('same route', function(done){
				request.get('/unauth').expect(401, 'unauthorized error').end(done);
			});
			it('changed route', function(done){
				request.get('/someerr').expect(404, 'There are no errors here sup').end(done);
			});
		});
		describe('different and duplicate', function(){
			before(function(){
				start(function(app){
					app.use(errs.middleware);
					errs.addErrors('first', './test/errors.ini', [
						['401-1', /unauthorized/i],
						['404-1', /no error/i]
					]);
					errs.addErrors('second', './test/errors2.ini', [
						['401-1', /unauthorized/i],
						['404-2', /some error/i]
					]);
				});
			});
			after(function(done){
				server.close(done);
			});
			it('can call old errors error', function(done){
				request.get('/noerr').expect(404, 'There are no errors here').end(done);
			});
			it('can call new errors error', function(done){
				request.get('/someerr').expect(404, 'There are some errors here sup').end(done);
			});
		});
	});
});