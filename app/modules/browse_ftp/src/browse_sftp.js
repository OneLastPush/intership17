var path = require('path');

var ssh = require('ssh2').Client;
var isBinary = require('isbinaryfile');
var log = require('smart-tracer');

function ensureDirectory(conn, dir, cb){
	dir = path.normalize(dir);
	var folders = dir.split(path.sep);

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);

			var counter = 0;
			var cursor = '';

			function ensureNext(){
				if(counter < folders.length){
					var step = folders[counter];
					counter++;
					cursor = cursor.length>0? path.join(cursor, step): step;
					sftp.readdir(cursor, function(err, listing){
						if(err){
							if(err.toString().match(/no such file/i)){
								sftp.mkdir(cursor, function(err){
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
		});
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

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err, data);
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);

			var cwd, listing;
			var count = 2;
			function doBuild(){
				if(--count===0){
					listing.forEach(function(f){
						//if exts not * or f not in the exts
						if(!~exts.indexOf('*') && !(~exts.indexOf(path.extname(f.filename))))
							return;
						var item = {
							title: f.filename,
							path: cwd,
							folder: f.longname.match(/^d/i)? true: false
						};
						if(!item.folder){
							//binaryChecks++;
							var size = f.attrs.size > 2000? 2000: f.attrs.size;
							var absPath = path.posix.join(cwd, f.filename);
							var rs = sftp.createReadStream(absPath, {
								start: 0,
								end: size
							});
							rs.on('error', function(err){
								//log.error(err);
							});
							rs.on('data', function(data){
								//log.debug('chunk read: ' + data);
							});
							rs.on('close', function(){
								//log.debug('closed read stream ' + absPath);
							});
							rs.on('readable', function(){
								//log.debug('readable');
								rs.read();
							});
							//var buffer = rs.read(size-1);
							rs.resume();
							//item.binary = isBinary(buffer, size);
						}
						data.push(item);
					});
					doDone();
				}
			}
			sftp.realpath(dir, function(err, data){
				if(err) return doDone(err);
				cwd = path.posix.join(data, dir);
				doBuild();
			});
			sftp.readdir(dir, function(err, data){
				if(err) return doDone(err);
				listing = data;
				doBuild();
			});
		});
	}).connect(conn);
}

function exists(conn, item, cb){
	getInfo(conn, item, function(err, stat){
		if(err || !stat) return cb(false);
		cb(true);
	});
}

function getInfo(conn, item, cb){
	item = path.normalize(item);
	var info = {};

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err, info);
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);

			var count = 2;
			function doBuild(){
				if(--count===0){
					info.extension = info.extension? info.extension.substring(1): '';
					info.modified = new Date(parseInt(info.modified*1000, 10)).toLocaleString();
					info.accessed = new Date(parseInt(info.accessed*1000, 10)).toLocaleString();
					doDone();
				}
			}
			sftp.realpath('.', function(err, data){
				if(err) return doDone(err);
				var posix = path.posix;
				info.location = posix.resolve(posix.normalize(data), item, '..');
				doBuild();
			});

			sftp.stat(item, function(err, stats){
				if(err) return doDone(err);
				var unixPermissions = '';
				var permString = (stats.mode & parseInt('777', 8)).toString(8);
				var num;
				for(var i=0; i<permString.length; i++){
					num = parseInt(permString.charAt(i), 10);
					unixPermissions += (num -= 4)>=0? 'r': '-';
					unixPermissions += (num -= 2)>=0? 'w': '-';
					unixPermissions += (num -= 1)>=0? 'x': '-';
					unixPermissions += ' ';
				}

				info.name = path.basename(item);
				info.extension = path.extname(item);
				info.size = stats.size;
				info.modified = stats.mtime;
				info.accessed = stats.atime;
				info.permissions = unixPermissions + ' ('+stats.mode+')';
				info.owner = stats.uid;
				info.group = stats.gid;
				doBuild();
			});

		});
	}).connect(conn);
}

function deleteItem(conn, file, folder, cb){
	if(file)
		file = path.normalize(file);
	if(folder)
		folder = path.normalize(folder);

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);
			if(file)
				sftp.unlink(file, doDone);
			else
				sftp.rmdir(folder, doDone);
		});
	}).connect(conn);
}

function upload(conn, currPath, remotePath, cb){
	currPath = path.normalize(currPath);
	remotePath = path.normalize(remotePath);

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			cb(err);
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);
			sftp.stat(remotePath, function(err, stats){
				if(stats)
					return doDone(new Error('EEXIST: file already exists'));
				else{
					sftp.fastPut(currPath, remotePath, doDone);
				}
			});
		});
	}).connect(conn);
}

function download(conn, file, cb){
	file = path.normalize(file);

	var c = new ssh();
	var done = false;
	function doDone(err){
		if(!done){
			done=true;
			c.end();
		}
	}

	c.on('error', doDone).on('ready', function(){
		c.sftp(function(err, sftp){
			if(err) return doDone(err);
			var rs = sftp.createReadStream(file);
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