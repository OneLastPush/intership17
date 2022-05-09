/**
 * Persistent logging wrapper throughout an app.
 * Set it once, will be this way everywhere.
 *
 * var log = require('smart-tracer');
 *
 * log.setLevel('debug'); //trace, debug, info, warn, error
 * log.logToFiles(true);
 * log.logToFiles('logs', true);
 * log.logToFiles(false);
 *
 * There's also a bunch of hidden objs in the log,
 * but chances are if you need to use them make a method for it instead and plug it here.
 */
var fs = require('fs');
var path = require('path');
var tracer = require('tracer');
var colors = require('colors');

//**********
// configs
//**********
var log = {};
log._tracer = {}; //keeps track of old tracer

//************
// functions
//************
log.reload = function(){
	var key;
	//cleanup
	for(key in log._tracer)
		delete log[key];
	//reload logger & track for next cleanup
	var tracerConsole = tracer.colorConsole(log._config);
	log._tracer = tracerConsole;
	//set new logger
	for(key in log._tracer)
		log[key] = log._tracer[key];
};
log.setLevel = function(level){
	log._config.level = level;
	log.reload();
};

//*************************
// log writing functions
//*************************
log._logDir = 'logs';

log._transport = {
	console: function (data){ //print to console
		console.log(data.output);
	},
	format: {
		audit: function(data){
			var desc = data.args[0];
			var info = data.args[1];
			info.action = desc;
			if(!info.when)
				info.when = new Date();
			return info;
		}
	},
	log: {
		basic: function(data){
			return data.timestamp + ' ' + data.path+':'+data.line+' ' + data.message;
		},
		error: function(data){
			return data.timestamp + ' ' + data.path+':'+data.line+' ' + data.message + ' ' + data.stack;
		},
		audit: audit = function(data){
			var info = log._transport.format.audit(data);
			var msg = data.timestamp + ' ' + JSON.stringify(info);
			return msg;
		}
	},
	write: {
		log: function(dir, data){
			//data.timestamp
			//data.message constructed message given to logger (so includes args?)
			//data.title (error, etc)
			//data.level (same as title but number)
			//data.args = {} of... 0-5 args?
			//data.file (orginating file)
			//data.pos
			//data.line
			//data.path
			//data.method
			//data.stack
			//data.output (formatted normal line)
			var msg;
			switch(data.title){
				case 'error': msg = log._transport.log.error(data); break;
				case 'audit': return; break;
				default: msg = log._transport.log.basic(data);
			}
			msg += '\n';
			fs.appendFile(path.join(dir, data.title+'.log'), msg, function(err){
				if(err) throw err;
			});
		},
		audit: function(data, info){
			var dir = log._logDir;
			var date = info.when;
			var name = data.title+'_'+date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'.json';
			var filePath = path.join(dir, name);
			fs.appendFile(filePath, JSON.stringify(info)+'\n', function(err){
				if(err)
					log.error(err);
			});
		}
	},
	file: function(data){
		var dir = log._logDir;
		fs.exists(dir, function(exist){
			if(exist)
				log._transport.write.log(dir, data);
			else{
				fs.mkdir(dir, function(err){
					if(err)
						throw err;
					log._transport.write.log(dir, data);
				});
			}
		});
	},
	audit: function(data){
		if(data.title !== 'audit')
			return;
		if(log._audit){
			var info = log._transport.format.audit(data);
			log._audit(data, info);
		}
	}
}

// logToFiles([logDir], [setting]). If logDir omitted expects setting, if setting omitted turns off.
log.logToFiles = function(logDir, setting){
	if(logDir && typeof logDir === 'string')
		log._logDir = logDir;
	else
		setting = logDir;

	var fileLogger = log._config.transport.indexOf(log._transport.file);
	if(fileLogger == -1 && setting) //missing but should be on
		log._config.transport.push(log._transport.file);
	else if(fileLogger > -1 && !setting) //exiss but should be off
		log._config.transport.splice(fileLogger, 1);

	log.reload();
};
// audit(true) uses default, audit(function(data){...}) will use yours, audit(false) will disable.
log.setAudit = function(fn){
	if(fn === true)
		log._audit = log._transport.write.audit;
	else if(typeof fn == 'function')
		log._audit = fn;
	else
		delete log._audit;
};

//**********
// start
//**********
log._config = { //keeps track of our configs that we use when making new tracers
	dateformat : "mm-dd-yyyy HH:MM:ss.L",
	format : [
		"{{timestamp}} {{file}}:{{line}} ({{title}}) {{message}}"
	],
	methods: ['log', 'trace', 'debug', 'info', 'warn', 'error', 'audit'],
	filters: {
		trace: colors.magenta,
		debug: colors.cyan,
		info: colors.green,
		warn: colors.yellow,
		error: [colors.red, colors.bold],
		audit: colors.grey
	},
	transport: [log._transport.console, log._transport.audit]
};
log.reload();
module.exports = log;