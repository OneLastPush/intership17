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
var assert = require('assert');

var servers = require('../servers.json');
var router = require('../index')(servers).router;

var app = express();
app.use(router);
var server = app.listen(8080);
var request = test(app);

var files = fs.readdirSync('./test');
files = files.filter(function(val){ //ignores folders
	return val.match(/.js$/i);
});
files.splice(files.indexOf('test.js'), 1); //ignore this file

describe('browse_ftp', function(){ //run all the tests found
	var testSuites = [];
	files.forEach(function(file){
		file = path.basename(file, '.js');
		describe(file, function(){
			var testLib = require('./'+file);
			testLib.name = file;
			testSuites.push(testLib);
		});
	});

	function testServer(serverName, server){
		describe(server.protocol + ' ' + serverName, function(){
			testSuites.forEach(function(suite){
				describe(suite.name, function(){
					suite.test(request, serverName);
				});
			});
		});
	}

	for(var server in servers){
		testServer(server, servers[server]);
	}
});