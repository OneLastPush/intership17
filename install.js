// this script will update node modules
// and prompt user for information needed for a working app launch

var path = require('path');
var exec = require('child_process').exec;


var steps = 2;
function doDone(){
	if(--steps===0){
		console.log('Modules installed.\n\n\n\n');
		doConfiguration();
	}
}
console.log('Installing modules...');
[
	path.join(__dirname, 'app'),
	path.join(__dirname, 'app', 'system_info')
].forEach(function(cwd){
	var cprocess = exec('npm install', {cwd: cwd}, function(err, stdout, stderr){
		if(err)
			console.log(err.stack);
		console.log(stdout);
		if(stderr)
			console.log(stderr);
		doDone();
	});
	cprocess.stderr.pipe(process.stderr);
});


function doConfiguration(){
	var cli = new prompter();
	cli.queue({
		origin: 'Web origin URL:\n(Optional. For security. Server app will only allow connections from this url)',
		server: 'App server URL/IP: (Including if http or https, port)'
	}, function(responses){
		var webOrigin = responses.origin || '*';
		var appURL = responses.server;

		var counter = 2;
		function done(){
			if(--counter===0){
				console.log('\nApplied configurations.');
				console.log('\n\nInstallation complete.');
			}
		}

		//write config to files
		var fs = require('fs');

		var appConfig = path.join(__dirname, 'app', 'config.json');
		fs.readFile(appConfig, function(err, json){
			var data = JSON.parse(json);

			data.Node.allowed_origins = webOrigin; //origin

			var port = appURL.match(/:(\d+)/); //port
			port = port? port[1]: 80;
			data.Node['*port'] = port;

			data.SSL.active = appURL.match(/^https/i)? true: false; //ssl

			fs.writeFile(appConfig, JSON.stringify(data), function(err){
				if(err) throw err;
				done();
			});
		});

		var webConfig = path.join(__dirname, 'web', 'public', 'js', 'backbone', 'config.js');
		var data = "var hostServer='"+ appURL +"';";
		fs.writeFile(webConfig, data, function(err){
			if(err) throw err;
			done();
		});
	});
}


//utils
function prompter(){
	var that = this;
	process.stdin.setEncoding('utf8');
	this.cb = null;
	process.stdin.on('data', function(res){
		process.stdin.pause();
		if(that.cb){
			//juggles cb around:
			//resets that.cb before calling cb because that.cb
			//would call itself down the line and break things
			var _cb = that.cb;
			that.cb = null;
			_cb(res.trim());
		}
	});

	this.prompt = function(msg, cb){
		that.cb = cb;
		process.stdout.write(msg+'\n');
		process.stdin.resume();
	};
	this.queue = function(prompts, cb){
		var that = this;
		var counter = 0;
		var queue = [];
		for(var key in prompts)
			queue.push(key);
		function done(){
			if(++counter == queue.length){
				if(cb) cb(prompts);
			}
			else{
				doNext();
			}
		}
		function doNext(){
			that.prompt(prompts[queue[counter]], function(res){
				prompts[queue[counter]] = res;
				done();
			});
		}
		doNext();
	};
}