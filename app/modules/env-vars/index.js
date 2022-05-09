/**
 * Env file: env.ini:
 *
 * ORACLE_BASE=/vm/oracle
 * ORACLE_HOME=/vm/oracle/app/oracle/product/11.2.0/client_2
 *
 * LD_LIBRARY_PATH=+/vm/oracle/app/oracle/product/11.2.0/client_2/lib
 *
 *
 * Use:
 * require('env-var').read('./env.ini');
 * require('env-var').read({
 * 	ORACLE_HOME:'/vm/oracle/app/oracle/product/11.2.0/client_2',
 * 	PATH: '+C:/abc/dewe.exe'
 * });
 * require('env-var').setLog(logger).read('./env.ini');
 * var env = require('env-var').setLog(console.log).read('./env.ini');
 * env.set('PATH', 'C:/YourApp/executable.exe', true); //value, name, append existing
 */
var os = require('os');
var ini = require('node-ini');
var log = require('smart-tracer');
var isWindows = os.type() == 'Windows_NT';

var us = {
	d: isWindows? ';': ':',
	read: function(input){
		if(typeof input == 'string')
			input = ini.parseSync(input);
		var append;
		var value;
		for(var key in input){
			value = input[key];
			append = value.match(/^\+/)? true: false; //starts with +
			us.set(key, append? value.substring(1): value, append);
		}
		return us;
	},
	set: function(name, value, append){
		if(append){
			var originalValue = process.env[name];
			if(originalValue)
				value = originalValue + us.d + value;
		}
		process.env[name] = value;
		log.trace('Set env var '+name+'='+process.env[name]);
		return us;
	}
};
module.exports = us;