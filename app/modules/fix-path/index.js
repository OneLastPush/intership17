/**
 * Makes path persistent between OS
 */
var path = require('path');
var fs = require('fs');
var isWindows = require('os').platform() === 'win32';

var root = path.parse(__dirname).root;

/**
 * Makes paths recognizable on windows and normalized on all OS through this application (USE THIS!)
 * @param  {[type]}   p            [path to normalize]
 * @param  {[type]}   needsToExist [throw err if path is not valid in this system]
 * @param  {Function} cb           [err, new path, array of paths (only for windows, only happens if you specify root, then expected you get all drives)]
 * @return {[type]}                [description]
 */
module.exports = function(p, needsToExist, cb){ //TODO doens't get all drives like suppsoed to yet
	var winRoots;
	if(isWindows){
		if(p.match(/^[\\\/]/)){ //doesn't specify drive but is absolute
			var info = path.parse(p);
			var actualDir = info.dir.substring(root.length); //TODO might break when/if node fixes this issue: https://github.com/nodejs/node/issues/5043
			p = path.join(root, actualDir, info.base);
		}
		p = p.toLowerCase(); //for windows we interpret all paths as lowercase because windows is case insensitive
		if(path.isAbsolute(p))
			p = p.substring(0, 1).toUpperCase() + p.substring(1); //however, drive letter is captilized
	}
	p = path.normalize(p);
	if(needsToExist){
		fs.exists(p, function(exist){
			if(exist)
				cb(undefined, p, winRoots);
			else
				cb(new Error('invalid path'), p, winRoots);
		});
	}else
		cb(undefined, p, winRoots);
};