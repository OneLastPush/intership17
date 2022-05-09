/**
 * Return master & slave.
 *
 * var master = require('master-slave').instance;
 * // to access already spawned master anywhere within the application
 */
var path = require('path');
var errors = new require('errors');

var slave = require('./src/slave');
var master = require('./src/master');

errors.addErrors('master-slave', path.join(__filename, '..', 'errors.ini'), [
	['401-0', /master-slave authentication key mismatch/i],
	['404-0', /master did not provide Dobby with auth key/i],
	['404-1', /missing (field)|(parameter)/i],
	['404-2', /server not found/i]
]);

var us = {
	instance: null,
	slave: function(config){
		var s = slave(config, function(router){
			router.use(errors.middleware);
		});
		s.errors = errors;
		us.instance = s;
		return s;
	},
	master: function(setup){
		var m = master(function(router){
			router.use(errors.middleware);
			if(setup)
				setup(router);
		});
		m.errors = errors;
		us.instance = m;
		return m;
	}
};

module.exports = us;