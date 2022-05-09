/**
 * Removes node modules folders & reinstalls them
 */
var path = require('path');
var exec = require('child_process').exec;

var rimraf = require('rimraf');

var files = require('./module_finder')(__dirname);

var index = 0;
function next(){
	var curr = index++;

	if(curr < files.length){
		deleteModule(files[curr], function(err){
			if(err){
				console.log(err);
				throw err;
			}else{
				installModule(files[curr], function(err){
					if(err)
						throw err;
					else{
						next();
					}
				});
			}
		});
	}else{
		console.log('DONE');
	}
}

function deleteModule(cwd, cb){
	console.log('removing modules: ' + cwd);
	var modules = path.join(cwd, 'node_modules');
	rimraf(modules, cb);
}

function installModule(cwd, cb){
	console.log('installing modules: ' + cwd);
	exec('npm install', {cwd: cwd}, function(err, stdout, stderr){
		if(err){
			console.log(stdout);
			console.log(stderr);
			cb(err);
		}else{
			console.log(stdout);
			console.log(stderr);
			cb();
		}
	});
}

next();