var os = require('os');
var path = require('path');
var fs = require('fs');

var isBinary = require('isbinaryfile');
var admzip = require('adm-zip');
var log = require('smart-tracer');

/**
* Creates folders if directory has missing folders.
* @param dir -- path to directory (will ensure eveyrhting exists up to this)
* @param cb -- returns when done
*/
function ensureDirectory(dir, cb){
	dir = path.normalize(dir);
	var folders = dir.split(path.sep);

	var counter = 0;
	var cursor = '';
	function ensureNext(){
		if(counter < folders.length){
			if(cursor.length>0)
				cursor = path.join(cursor, folders[counter]);
			else
				cursor = folders[counter];
			fs.exists(cursor, function(exists){
				if(exists){
					ensureNext();
				}else{
					fs.mkdir(cursor, function(err){
						if(err)
							log.warn(err);
						ensureNext();
					});
				}
			});
		}else if(counter === folders.length){
			if(cb) cb();
		}
		counter++;
	}
	ensureNext();
}

/**
* Gets one level of files & folders out of the specified directory.
* File obj: {
*		title -- filename only
*		path -- full path from root + filename
* 		binary -- if the file is binary format or ascii (readable by humans)
* 	}
* Folder obj: {
* 		title -- folder name only
*		path -- full path from root + folder name
*		folder -- true to designate it's a folder obj
* 	}
* @param dir - Location to get
* @param filetypeFilter - list of filetypes we're allowing to see. ei, ['.ext', 'cat']. If null, shows all.
* @param cb - Callback that will be given an array of file & folder objects.
*/
function getDirectory(dir, exts, cb){
	if(!exts)
		exts = ['.*'];
	else{
		exts.forEach(function(v, i, a){ //adds . to extension if missing
			if(v.charAt(0) != '.')
				a[i] = '.'+v;
		});
	}
	dir = path.isAbsolute(dir)? dir: path.join(__dirname, '..', dir);
	var data = [];
	fs.readdir(dir, function(err, files){
		if(err) return cb(err);
		if(!files || files.length === 0) return cb(null, data);

		var counter = 0;
		function doDone(){
			if(++counter===files.length)
				cb(null, data);
		}

		files.forEach(function(f){
			var absPath = path.join(dir, f);
			fs.stat(absPath, function(err, stats){
				if(err) log.warn(err);
				if(!stats) return doDone();

				if(stats.isDirectory()){
					data.push({
						title: f,
						path: absPath,
						folder: true
					});
					doDone();
				}else{
					//if exts not * or f not in the exts
					if(!~exts.indexOf('.*') && !(~exts.indexOf(path.extname(f))))
						return doDone();
					data.push({
						title: f,
						path: absPath
					});
					doDone();
				}
			});
		});
	});
}

function getInfo(item, cb){
	item = path.normalize(item);
	fs.lstat(item, function(err, stats){
		if(err) return cb(err);

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

		var uid = stats.uid;
		var gid = stats.gid;
		var counter = 1;
		if(os.type().toLowerCase() == 'linux'){
			counter +=2;
			var cmdU = 'getent passwd ' + stats.uid;
			exec(cmdU, function(err, stdout, stderr){
				if(err) log.warn(err+' '+stderr);
				if(stdout)
					uid = stdout.substring(0, stdout.indexOf(':'))+' ('+uid+')';
				doDone();
			});
			var cmdG = 'getent group ' + stats.gid;
			exec(cmdG, function(err, stdout, stderr){
				if(err) log.warn(err+' '+stderr);
				if(stdout)
					gid = stdout.substring(0, stdout.indexOf(':'))+' ('+gid+')';
				doDone();
			});
		}
		var binary = undefined;
		if(stats.isFile()){
			counter++;
			isBinary(item, function(err, res){
				if(err) log.warn(err);
				binary = res;
				doDone();
			});
		}

		function doDone(){
			if(--counter===0){
				extension = path.extname(item);
				cb(undefined, {
					location: path.isAbsolute(item)? path.join(item, '..'): path.join(__dirname, '..', item, '..'),
					name: path.basename(item),
					extension: extension? extension.substring(1): '',
					binary: binary,
					size: stats.size,
					created: stats.birthtime,
					modified: stats.mtime,
					accessed: stats.atime,

					permissions: unixPermissions + ' ('+stats.mode+')',

					owner: uid,
					group: gid
				});
			}
		}
		doDone();
	});
}

function archiveFile(file, archiveTo, cb){
	var zipName = path.basename(file) +'.zip';
	fs.exists(file, function(exist){
		if(!exist)
			return cb(new Error('ENOENT: ' + file));
		ensureDirectory(archiveTo, function(err){
			if(err) return cb(err);
			fs.readdir(archiveTo, function(err, files){
				if(err) return cb(err);

				var fileNum = 0;
				while(files.indexOf(zipName) > -1)
					zipName = path.basename(file) + '('+(++fileNum)+').zip';

				var zipFile = path.join(archiveTo, zipName);
				var zip = new admzip();
				zip.addFile('loc.txt', new Buffer(file));
				zip.addLocalFile(file);
				zip.writeZip(zipFile);

				fs.unlink(file, function(err){
					if(err) return cb(err);
					cb(undefined, zipFile);
				});
			});
		});
	});
}

module.exports = {
	ensureDirectory: ensureDirectory,
	getDirectory: getDirectory,
	getInfo: getInfo,
	archiveFile: archiveFile
};