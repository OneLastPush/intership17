var fs = require('fs');

var async = require('async');
var escape = require('escape-string-regexp');
var log = require('smart-tracer');

var user = require('./internal').collection.user;
var fpath = require('fix-path');

var us = {
	validateAndCorrect: function(username, pins, cb){
		us.validateAndReturn(pins, function(existing){
			//see if any didn't exist & remove from db
			var excluded = [];
			pins.forEach(function(pin){
				if(existing.indexOf(pin) === -1)
					excluded = pin;
			});
			if(excluded.length > 0){
				log.info('Found ' + excluded.length + 'invalid pins. Removing: ', excluded);
				user.db.collection(user.name).update({
					Username: new RegExp('^'+escape(username)+'$','i')
				},{
					$pullAll: {Pinned: excluded}
				}, function(err, updated){
					if(updated === 0)
						log.warn('When trying to remove invalid pins did not update any records');
					cb(err, existing);
				});
			}else{
				cb(undefined, existing);
			}
		});
	},
	validateAndReturn: function(pins, cb){
		async.filter(pins, function(pin, cb){
			fpath(pin, true, function(err, pin){
				cb(err? false: true);
			});
		}, cb);
	}
};

module.exports = us;