var crypto = require('crypto');

var escape = require('escape-string-regexp');
var log = require('smart-tracer');

module.exports = function(db, cb){
	db.createCollection('pw_reset', {
		Username: '',
		Email: '',
		IP: '',
		Token: '',
		'Date': new Date()
	}, {
		indexes: [{fields: {Date: 1}, opts: {}}],
		//TODO add expiry date
		preUpdate: function(what, data, cb){
			if(data? !data.Username || !data.Email || !data.IP || !data.Token || !data.Date: false)
				return cb(new Error('database insertion data missing'));
			this.user.get({Username: new RegExp('^'+escape(data.Username)+'$', 'i')}, function(err, userData){
				if(err)
					return cb(err);
				if(userData.length === 0)
					return cb(new Error('database insertion failed becauser User ' + data.Username + ' does not exist'));
				if(userData[0].Email !== data.Email)
					return cb(new Error('invalid email for a password reset for this user'));
				cb(undefined, data);
			});
		}
	}, function(err, pw_reset){
		if(err)
			return cb(err);
		pw_reset.attachUsers = function(user){
			this.user = user;
		};
		pw_reset.createToken = function(username, ip, email, cb){
			crypto.randomBytes(48, function(err, token){
				pw_reset.insert({
					Username: username,
					Email: email,
					IP: ip,
					Token: token.toString('hex'),
					'Date': new Date()
				}, cb);
			});
		};
		pw_reset.validateToken = function(username, token, cb){
			this.get({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
				Token: token
			}, function(err, data){
				if(err)
					return cb(err);
				if(data.length === 1)
					cb(undefined, true);
				else
					cb(new Error('username or token not valid'));
			});
		};
		cb(err, pw_reset);
	});
};