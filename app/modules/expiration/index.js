/**
* Expiration module.
* What can ya do.
*
* Validates every 24 hours since launch.
* If error or expired, exits application.
*
* @version 1.0.0
* @author Ganna Shmatova
*/
var crypto = require('crypto');
var moment = require('moment');

var timedCheck = {
	id: undefined,
	license: undefined
};
var us = {
	license: {},
	error: function(err, cb){
		if(cb)
			cb(err);
		else
			throw err;
		process.exit(1);
	},
	generate: function(license, cb){
		var key = [license.name, new Date(license.date).toISOString()].join(',');
		crypto.pbkdf2(key, license.type, 1000, 128, cb);
	},
	validate: function(license, cb){
		timedCheck.license = license;
		if(typeof license == 'string'){ //must be file
			license = require(license); //get object
		}
		us.license = license;

		us.generate(license, function(err, key){
			if(err)
				return us.error(err, cb);

			key = key.toString('hex');
			if(!license.key.match(key))
				return us.error(new Error('Invalid license key'), cb);

			license.daysLeft = - moment().diff(license.date, 'days'); //get days remaining
			if(license.daysLeft < 0)
				us.error(new Error('License key has expired'), cb);
			else
				if(cb) cb(undefined, license);

			if(timedCheck.id !== undefined){
				clearTimeout(timedCheck.id);
				timedCheck.id = undefined;
			}
			timedCheck.id = setTimeout(us.validate, 24*60*60*1000, timedCheck.license); // every 24 hours
		});
	},
	create: function(name, date, cb){
		var license = {
			name: name,
			type: date? 'license': 'trial',
			date: date? new Date(date): new Date(new Date().getTime() + 30/*days*/*24*60*60*1000)
		};
		us.generate(license, function(err, key){
			license.key = key.toString('hex');
			cb(err, license);
		});
	}
};
module.exports = us;