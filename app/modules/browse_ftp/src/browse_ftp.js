var path = require('path');

var ftp = require('ftp');
var isBinary = require('isbinaryfile');
var log = require('smart-tracer');

function ensureDirectory(conn, dir, cb){
	dir = path.normalize(dir);
	var folders = dir.split(path.sep);

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		var counter = 0;
		var cursor = '';

		function ensureNext(){
			if(counter < folders.length){
				var step = folders[counter];
				counter++;
				cursor = cursor.length>0? path.join(cursor, step): step;
				c.list(cursor, function(err, listing){
					if(err){
						if(err.toString().match(/not found/i)){
							c.mkdir(cursor, function(err){
								if(err) return doDone(err);
								ensureNext();
							});
						}else return doDone(err);
					}else
						ensureNext();
				});
			}else if(counter === folders.length)
				doDone();
		}
		ensureNext();
	}).connect(conn);
}

function getDirectory(conn, dir, exts, cb){
	if(!exts)
		exts = ['*'];
	else{
		exts.forEach(function(v, i, a){ //adds . to extension if missing
			if(v.charAt(0) != '.')
				a[i] = '.'+v;
		});
	}
	var data = [];

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err, data);
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		var listing, cwd;
		var count = 2;
		function doBuild(){
			if(--count===0){
				listing.forEach(function(f){
					//if exts not * or f not in the exts
					if(!~exts.indexOf('*') && !(~exts.indexOf(path.extname(f.filename))))
						return;
					var item = {
						title: f.name,
						path: cwd,
						folder: f.type=='d'? true: false
					};
					if(!item.folder){
						//binary check
					}
					data.push(item);
				});
				doDone();
			}
		}
		c.pwd(function(err, data){
			if(err) return doDone(err);
			cwd = data;
			doBuild();
		});
		c.list(dir, function(err, data){
			if(err) return doDone(err);
			listing = data;
			doBuild();
		});
	}).connect(conn);
}

function exists(conn, item, cb){
	item = path.normalize(item);
	var itemName = path.basename(item);
	var above = path.join(item, '..');

	var c = new ftp();
	var done = false;
	function doDone(){
		if(!done){
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		c.list(above, function(err, list){
			list.forEach(function(i){
				if(i.name==itemName){
					cb(true);
					doDone();
				}
			});
			if(!done){
				cb(false);
				doDone();
			}
		});
	}).connect(conn);
}

function getInfo(conn, item, cb){
	item = path.normalize(item);
	var itemName = path.basename(item);
	var above = path.join(item, '..');

	var cwd, listing;
	var info = {};

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err, info);
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		var count = 2;
		function doBuild(){
			if(--count===0){
				listing.forEach(function(i){
					if(i.name==itemName){
						info.name = i.name;
						info.extension = path.extname(i.name);
						info.extension = info.extension? info.extension.substring(1): '';
						info.size = i.size;
						info.modified = i.date;
						var rightsToPerms = function rightsToPerms(right){
							var perms = '';
							function checkRight(val, letter){
								return val.indexOf(letter) >= 0? letter: '-';
							}
							perms += checkRight(right, 'r');
							perms += checkRight(right, 'w');
							perms += checkRight(right, 'x');
							return perms;
						};
						info.permissions = rightsToPerms(i.rights.user)+' '+rightsToPerms(i.rights.group)+' '+rightsToPerms(i.rights.other);
						info.owner = i.owner;
						info.group = i.group;
						doDone();
					}
				});
				doDone(new Error('ENOENT'));
			}
		}

		c.pwd(function(err, data){
			if(err) return doDone(err);
			var posix = path.posix;
			info.location = posix.resolve(posix.normalize(data), item, '..');
			doBuild();
		});
		c.list(above, function(err, data){
			if(err) return doDone(err);
			listing = data;
			doBuild();
		});
	}).connect(conn);
}

function deleteItem(conn, file, folder, cb){
	if(file)
		file = path.normalize(file);
	if(folder)
		folder = path.normalize(folder);

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		if(file)
			c['delete'](file, doDone);
		else
			c.rmdir(folder, doDone);
	}).connect(conn);
}

function upload(conn, currPath, remotePath, cb){
	currPath = path.normalize(currPath);
	remotePath = path.normalize(remotePath);

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}
	exists(conn, remotePath, function(exists){
		if(exists){
			doDone(new Error('EEXIST: file already exists'));
		}else{
			c.on('error', doDone).on('ready', function(){
				c.put(currPath, remotePath, doDone);
			}).connect(conn);
		}
	});
}

function download(conn, file, cb){
	file = path.normalize(file);

	var c = new ftp();
	var done = false;
	function doDone(err){
		if(!done){
			done=true;
			c.end();
		}
	}
	c.on('error', doDone).on('ready', function(){
		c.get(file, function(err, rs){
			if(err) return doDone(err);
			rs.on('error', doDone);
			rs.on('close', doDone);
			cb(undefined, rs);
		});
	}).connect(conn);
}

module.exports = {
	ensureDirectory: ensureDirectory,
	getDirectory: getDirectory,
	exists: exists,
	getInfo: getInfo,
	deleteItem: deleteItem,
	upload: upload,
	download: download
};