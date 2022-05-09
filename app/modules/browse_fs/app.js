var port = parseInt(process.argv[2]) || 8080;

var express = require('express');
var log = require('smart-tracer');

var app = express();
var router = require('./index').router;

app.use(router);
var server = app.listen(port);
log.info('Launched browse_fs app at ' + port);

module.exports = {
	app: app,
	server: server
};