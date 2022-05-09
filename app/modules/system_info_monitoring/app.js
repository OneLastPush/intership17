var port = process.argv[2] || 8080;

var express = require('express');
var app = express();
var paths = require('./watchedPaths.json');
var router = require('./index')(console.log, paths).router;

app.use('/sys', router);
var server = app.listen(port);
console.log('Launched system info & monitoring app at ' + port);

module.exports = {
	app: app,
	server: server
};