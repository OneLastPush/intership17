var port = process.argv[2] || 8080;

var express = require('express');
var bodyParser = require('body-parser');
var log = require('smart-tracer');

var app = express();
var servers = require('./servers.json');
var router = require('./index')(servers).router;

app.use(router);
var server = app.listen(port);
log.info('Launched browse_ftp app at ' + port);

module.exports = {
	app: app,
	server: server
};