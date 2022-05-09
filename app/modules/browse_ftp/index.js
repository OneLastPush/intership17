/**
 * Use:
 * app.use('/browse*', function(req, res, next){
 * 		if(!req.session.user) return res.error('user not authenticated');
 * 	 	req.body.types = getFileTypes(req.session.user);
 * 	  	next();
 * });
 * app.get('/browse', require('browse_ftp')({
 * 	"target10": {
 * 		"protocol": "sftp",
 * 		"host": "10.0.0.186",
 * 		"port": 22,
 * 		"username": "ganna",
 * 		"password": "password"
 * 	},
 * 	"localhosts": {
 * 		"protocol": "ftps",
 * 		"host": "127.0.0.1",
 * 		"port": 21,
 * 		"key": "ftp.key",
 * 		"username": "ganna",
 * 		"password": "password"
 * 	},
 * 	"localhost": {
 * 		"protocol": "ftp",
 * 		"host": "127.0.0.1",
 * 		"port": 21,
 * 		"username": "ganna",
 * 		"password": "password"
 * 	}
 * }).router);
 *
 */
var path = require('path');
var fs = require('fs');

var express = require('express');
var bodyParser = require('body-parser');
var log = require('smart-tracer');

var tmp = path.join(__dirname, 'tmp');
if(!fs.existsSync('tmp'))
	fs.mkdirSync('tmp');

var servers = {};
var mapping = {
	server: 'server',
	file: 'file',
	folder: 'folder',

	justChildren: 'justChildren',

	output: 'output',
	uploadTo: 'uploadTo',
	archiveTo: 'archiveTo',

	exts: 'exts',
	column: 'column',
	delim: 'delim',
	quoteChar: 'quoteChar',
	caseSensitive: 'caseSensitive',
	force: 'force',

	lines: 'lines',
	action: 'action'
};

function setServers(newServers){
	for(var s in servers)
		delete servers[s];
	for(var ns in newServers){
		var server = newServers[ns];
		servers[ns] = server;

		//sftp wants username, ftp wants user. sigh.
		if(server.user)
			server.username = server.user;
		if(server.username)
			server.user = server.username;

		//load key file if exists
		if(server.key){
			server.secureOptions = {
				rejectUnauthorized: false
			};
			server.secure = true;
			server.key = fs.readFileSync(server.key);
		}
	}
}

module.exports = function(servers){
	var browse = {
		'sftp': require('./src/browse_sftp'),
		'ftps': require('./src/browse_ftp'),
		'ftp': require('./src/browse_ftp')
	};

	var router = express.Router();
	router.use(bodyParser.urlencoded({ extended: false }));
	router.use(bodyParser.json());
	router.use(require('connect-busboy')());
	router.use(function(req, res, next){
		if(req.busboy){
			var counter = 1;
			var doNext = function doNext(){
				if(--counter===0) next();
			};
			req.busboy.on('finish', doNext);
			req.file = {};
			req.busboy.on('file', function(fieldName, file, filename, encoding, mimetype){
				counter++;
				var loc = path.join(tmp, filename);
				var ws = fs.createWriteStream(loc);
				ws.on('close', function(){
					req.file[fieldName] = loc;
					doNext();
				});
				file.pipe(ws);
			});
			req.busboy.on('field', function(key, value, keyTrunc, valTrunc){
				req.body[key]=value;
			});
			req.pipe(req.busboy);
		}else
			next();
	});
	router.use(new require('errors').addErrors('browse_ftp', path.join(__dirname, 'errors.ini'), [
		['404-1', /missing (field)|(parameter)/i],
		['404-3', /(ENOENT)|(no such file)|(directory not found)/i],
		['404-5', /invalid server/i],

		['409-1', /(EEXIST)|(already exists)/i],
		['400-1', /file read/i],
		['400-2', /file write/i],

		['400-3', /form/i],
		['400-5', /download/i],
		['400-7', /unzip/i],
		['400-8', /zip/i],
	]).middleware);

	//basics
	router.all('/mkdir', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var folder = req.body[mapping.folder];
		if(!folder) return res.error('missing field', mapping.folder);

		browse[server.protocol].ensureDirectory(server, folder, function(err){
			if(err) return res.error(err, folder);
			res.status(200).send();
		});
	});

	router.all('/', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var folder = req.body[mapping.folder];
		if(!folder) return res.error('missing field', mapping.folder);
		var exts = req.body[mapping.exts];

		browse[server.protocol].getDirectory(server, folder, exts, function(err, data){
			if(err) return res.error(err, folder);
			res.status(200);
			if(!req.body[mapping.justChildren]){
				res.send({
					title: path.basename(folder),
					path: folder,
					folder: true,
					children: data
				});
			}else
				res.send(data);
		});
	});

	router.all('/exists', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var item = req.body[mapping.file] || req.body[mapping.folder];
		if(!item) return res.error('missing field', mapping.file, mapping.folder);

		browse[server.protocol].exists(server, item, function(exists){
			res.status(200).send(exists);
		});
	});

	router.all('/info', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var item = req.body[mapping.file] || req.body[mapping.folder];
		if(!item) return res.error('missing field', mapping.file, mapping.folder);

		browse[server.protocol].getInfo(server, item, function(err, data){
			if(err) return res.error(err, item);
			res.status(200).send(data);
		});
	});

	router.all('/download', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var file = req.body[mapping.file];
		if(!file) return res.error('missing field', mapping.file);

		browse[server.protocol].download(server, file, function(err, stream){
			if(err) return res.error(err, file);
			res.setHeader('content-type' , 'application/zip');
			res.setHeader('content-disposition', 'attachment; filename=' + path.basename(file));
			stream.pipe(res);
		});
	});

	router.all('/upload', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);
		var uploadTo = req.body[mapping.uploadTo];
		if(!uploadTo)
			return res.error('missing field', mapping.uploadTo);
		var file = req.file[mapping.file];
		if(!file)
			return res.error('missing field', mapping.file);

		var newFile = path.join(uploadTo, path.basename(file));
		browse[server.protocol].upload(server, file, newFile, function(err){
			if(err)
				res.error(err, newFile);
			else
				res.status(200).send();
		});
	});

	router.all('/delete', function(req, res){
		var server = req.body[mapping.server];
		if(!server) return res.error('missing field', mapping.server);
		server = servers[server];
		if(!server) return res.error('invalid server', server);

		var file = req.body[mapping.file];
		var folder = req.body[mapping.folder];
		if(!file && !folder) return res.error('missing field', mapping.file, mapping.folder);

		browse[server.protocol].deleteItem(server, file, folder, function(err){
			if(err) return res.error(err, file);
			res.sendStatus(200);
		});
	});
	if(servers)
		setServers(servers);
	return {
		mapping: mapping,
		servers: servers,
		setServers: setServers,
		router: router
	};
};