/**
 * Use:
 * app.use('/browse*', function(req, res, next){
 * 		if(!req.session.user) return res.error('user not authenticated');
 * 	 	req.body.types = getFileTypes(req.session.user);
 * 	  	next();
 * });
 * app.get('/browse', require('browse_fs')().router);
 *
 */

var path = require('path');
var fs = require('fs');

var express = require('express');
var bodyParser = require('body-parser');
var log = require('smart-tracer');
var find = require('find');
var JSZip = require('jszip');

var reader = require('./src/reader');
var browse = require('./src/browse');
var split = require('./src/split');

var us = {};
us.tmp = path.join(__dirname, 'tmp');
if(!fs.existsSync(us.tmp))
	fs.mkdirSync(us.tmp);

us.mapping = {
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

us.router = express.Router();
us.router.use(bodyParser.urlencoded({ extended: false }));
us.router.use(bodyParser.json());
us.router.use(require('connect-busboy')());
us.router.use(function(req, res, next){
	if(req.busboy){
		var counter = 1;
		var doNext = function doNext(){
			if(--counter===0) next();
		};
		req.busboy.on('finish', doNext);
		req.file = {};
		req.busboy.on('file', function(fieldName, file, filename, encoding, mimetype){
			counter++;
			var loc = path.join(us.tmp, filename);
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
us.router.use(new require('errors').addErrors('browse_fs', path.join(__dirname, 'errors.ini'), [
	['404-1', /missing (field)|(parameter)/i],
	['404-3', /ENOENT/i],

	['409-1', /EEXIST/i],
	['400-1', /file read/i],
	['400-2', /file write/i],

	['400-3', /form/i],
	['400-5', /download/i],
	['400-7', /unzip/i],
	['400-8', /zip/i],
]).middleware);
us.postMiddlewareMiddleware = function(req, res, next){
	next();
};
us.router.use(function(req, res, next){
	us.postMiddlewareMiddleware(req, res, next);
});

us.router.all('/mkdir', function(req, res){
	var folder = req.body[us.mapping.folder];
	if(!folder) return res.error('missing field', us.mapping.folder);

	browse.ensureDirectory(folder, function(err){
		if(err) return res.error(err, folder);
		res.status(200).send();
	});
});

//basics
us.router.all('/', function(req, res){
	var folder = req.body[us.mapping.folder];
	if(!folder) return res.error('missing field', us.mapping.folder);
	var exts = req.body[us.mapping.exts];

	browse.getDirectory(folder, exts, function(err, data){
		if(err) return res.error(err, folder);
		res.status(200);
		if(!req.body[us.mapping.justChildren]){
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

us.router.all('/exists', function(req, res){
	var item = req.body[us.mapping.file] || req.body[us.mapping.folder];
	if(!item) return res.error('missing field', us.mapping.file, us.mapping.folder);
	fs.exists(item ,function(exists){
		res.status(200).send(exists);
	});
});

us.router.all('/info', function(req, res){
	var item = req.body[us.mapping.file] || req.body[us.mapping.folder];
	if(!item) return res.error('missing field', us.mapping.file, us.mapping.folder);
	browse.getInfo(item, function(err, data){
		if(err) return res.error(err, item);
		res.status(200).send(data);
	});
});

us.router.all('/download', function(req, res){
	var file = req.body[us.mapping.file];
	var folder = req.body[us.mapping.folder];
	if(!file && !folder) return res.error('missing field', us.mapping.file, us.mapping.folder);

	function doDownload(name, stream){
		res.setHeader('content-type' , 'application/zip');
		res.setHeader('content-disposition', 'attachment; filename=' + path.basename(name));
		stream.pipe(res);
	}
	if(file)
		doDownload(file, fs.createReadStream(file));
	else if(folder){
		var zip = new JSZip();
		find.file(folder, function(files){
			files.forEach(function(file){
				zip.file(path.relative(folder, file), fs.createReadStream(file));
			});
			doDownload(folder+'.zip', zip.generateNodeStream({type: 'nodebuffer', streamFiles: true}));
		});
	}
});

us.router.all('/upload', function(req, res){
	var uploadTo = req.body[us.mapping.uploadTo];
	if(!uploadTo)
		return res.error('missing field', us.mapping.uploadTo);
	var file = req.file[us.mapping.file];
	if(!file)
		return res.error('missing field', us.mapping.file);
	var force = req.body[us.mapping.force];

	var newFile = path.join(uploadTo, path.basename(file));

	function done(err){
		if(!res.headersSent){
			if(err)
				res.error(err, newFile);
			else
				res.status(200).send();
		}
	}
	function write(){
		var rs = fs.createReadStream(file);
		var ws = fs.createWriteStream(newFile);
		rs.on('error', done);
		ws.on('error', done);
		ws.on('close', done);
		rs.pipe(ws);
	}
	if(!force){
		fs.exists(newFile, function(exists){
			if(exists)
				res.error('EEXIST: file already exists', newFile);
			else
				write();
		});
	}else
		write();
});

us.router.all('/delete', function(req, res){
	var file = req.body[us.mapping.file];
	var folder = req.body[us.mapping.folder];
	if(!file && !folder) return res.error('missing field', us.mapping.file, us.mapping.folder);

	var action = file? fs.unlink: fs.rmdir;
	action(file || folder, function(err){
		if(err) return res.error(err, file);
		res.sendStatus(200);
	});
});

//weird things
us.router.all('/archive', function(req, res){
	var file = req.body[us.mapping.file];
	if(!file) return res.error('missing field', us.mapping.file);
	var archiveTo = req.body[us.mapping.archiveTo];
	if(!archiveTo) return res.error('missing field', us.mapping.archiveTo);

	browse.archiveFile(file, archiveTo, function(err, zipFile){
		if(err)
			res.error(err, file);
		else
			res.status(200).send(zipFile);
	});
});
us.router.all('/split', function(req, res){
	var file = req.body[us.mapping.file];
	if(!file) return res.error('missing field', us.mapping.file);
	var output = req.body[us.mapping.output];
	if(!output) return res.error('missing field', us.mapping.output);

	var opts = {};
	if(req.body[us.mapping.column])
		opts.column = req.body[us.mapping.column];
	if(req.body[us.mapping.delim])
		opts.delim = req.body[us.mapping.delim];
	if(req.body[us.mapping.quoteChar])
		opts.quoteChar = req.body[us.mapping.quoteChar];
	if(req.body[us.mapping.caseSensitive])
		opts.caseSensitive = true;
	if(req.body[us.mapping.force])
		opts.force = true;

	split(file, output, opts, function(err, stdout){
		if(err)
			return res.error(err, file);
		res.status(200).send(output);
	});

});

us.router.all('/file', function(req, res){
	var file = req.body[us.mapping.file];
	if(!file) return res.error('missing field', us.mapping.file);

	var lines = req.body[us.mapping.lines];
	var action = req.body[us.mapping.action];

	if(action){
		if((action=='tail' && lines > 0) || (action=='head' && lines < 0))
			lines = -lines;
		else if(action=='whole')
			lines = 0;
	}

	reader(file, lines, function(err, contents){
		if(err) return res.error(err, file);
		res.status(200).send(contents);
	});
});


module.exports = us;