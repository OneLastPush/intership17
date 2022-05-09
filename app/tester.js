/**
 * Runs all tests
 */
var path = require('path');
var exec = require('child_process').exec;

var files = require('./module_finder')(__dirname);

var log = [];
function Log(cwd, stdout, stderr){
	this._cwd = cwd;
	this._stdout = stdout;
	this._stderr = stderr;

	this.module = path.basename(cwd);

	var resultStart = stdout.length - 50;
	var stdoutResult = stdout;
	if(resultStart > 0)
		stdoutResult = stdout.substring(resultStart);

	var passing = stdoutResult.match(/(\d*) passing/);
	var pending = stdoutResult.match(/(\d*) pending/);
	var failed = stdoutResult.match(/(\d*) failed/);
	this.result = {
		passing: !passing? 0: passing[1],
		pendng: !pending? 0: pending[1],
		failed: !failed? 0: failed[1]
	};
	this.print = function(){
		var s = this.module + ': [ ';
		s += 'passing: '+this.result.passing +', ';
		s += 'pendng: '+this.result.pendng +', ';
		s += 'failed: '+this.result.failed +' ';
		s += ']';

		if(this.result.failed !== 0){
			s += '\n';
			s += this._stdout +'\n';
			s += this._stderr +'\n';
		}

		return s;
	};
}

var index = 0;
function next(){
	var curr = index++;

	if(curr < files.length){
		execTest(files[curr]);
	}else{
		console.log('DONE');
	}
}

function execTest(cwd){
	console.log('testing: ' + cwd);
	exec('npm test', {cwd: cwd}, function(err, stdout, stderr){
		if(err){
			console.log(stdout);
			console.log(stderr);
			throw err;
		}else{
			log.push(new Log(cwd, stdout, stderr));
			console.log(log[log.length-1].print()+'\n');
			next();
		}
	});
}

next();