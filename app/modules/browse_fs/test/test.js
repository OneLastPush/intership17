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
var path = require('path');
var fs = require('fs');

var express = require('express');
var test = require('supertest');

var request = test(require('../app').app);

var files = fs.readdirSync('./test');
files = files.filter(function(val){ //ignores folders
	return val.match(/.js$/i);
});
files.splice(files.indexOf('test.js'), 1); //ignore this file

describe('browse_fs', function(){ //run all the tests found
	before(function(done){
		var exist = fs.existsSync('test/test/dir');
		if(!exist)
			fs.mkdir('test/test/dir', done);
		else
			done();
	});
	files.forEach(function(file){
		file = path.basename(file, '.js');
		describe(file, function(){
			require('./'+file).test(request);
		});
	});
});
