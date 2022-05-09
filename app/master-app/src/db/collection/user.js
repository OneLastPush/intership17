var extend = require('util')._extend;
var crypto = require('crypto');

var escape = require('escape-string-regexp');
var config = require('smart-config');
var log = require('smart-tracer');

var salt = require('../../salt');
var fpath = require('fix-path');
var pin = require('../pin');

var blueprint = {};
blueprint.internal = {
	Username: '',
	Password: 'password',
	'Authentication Service': 'Internal',
	Language: 'English',
	Email: '',
	Status: 'Active',
	Note: '',
	'IBM Marketing': {
		Username: '',
		Password: ''
	},
	Name: {
		First: '',
		Middle: '',
		Last: ''
	},
	Phone: {
		Office: '',
		Mobile: ''
	},
	Bookmarks: [{
		key: 'Name',
		value: 'URL'
	}]
};
blueprint.external = extend({}, blueprint.internal);
delete blueprint.external.Password;

function encrypt(value, cb){
	crypto.pbkdf2(value, config.get('Node.crypting_keyword'), 10000, 256, function(err, buffer){
		if(err)
			return cb(err);
		cb(err, buffer.toString());
	});
}

module.exports = function(db, cb){
	db.createCollection('user', blueprint, {
		indexes: [{fields: {Username: 1}, opts: {unique: true}}],
		setDefaults: function(cb){
			this.insert({
				Username: 'Admin',
				Password: 'password',
			}, cb);
		},
		preUpdate: function(what, data, cb){
			var index = 1;
			function done(err){
				if(err)
					cb(err);
				if(--index===0)
					cb(err, data);
			}
			if(data){
				//passwords
				if(data.Password){
					index++;
					encrypt(data.Password, function(err, encrypted){
						data.Password = encrypted;
						done(err);
					});
				}
				if(data['IBM Marketing'] && data['IBM Marketing'].Password){
					data['IBM Marketing'].Password = salt.encrypt(data['IBM Marketing'].Password);
				}
				//group referencial integrity
				if(what && what.Username && data.Username && //values exist
					(what.Username instanceof RegExp?
					!what.Username.test(data.Username):
					what.Username !== data.Username)){ //changing username
					index++;
					this.group.renameUser(what.Username, data.Username, done);
				}
				//changing this user's groups
				if(data.Groups){
					index++;
					var groups = data.Groups;
					delete data.Groups;
					this.group.setUserGroups(data.Username, groups, done);
				}
				//pinned items consistency
				if(data.Pinned){
					index++;
					pin.validateAndReturn(data.Pinned, function(existing){
						data.Pinned = existing;
						done();
					});
				}
			}
			done();
		},
		postGet: function(err, data, cb){
			if(err)
				return cb(err);
			index = 1;
			function done(err){
				if(err)
					cb(err);
				if(--index===0)
					cb(err, data);
			}
			data.forEach(function(record){
				//pinned items consistency
				if(data.Pinned){
					index++;
					pin.validateAndCorrect(data.Username, data.Pinned, function(err, existing){
						data.Pinned = existing;
						done(err);
					});
				}
				//passwords
				if(record.Password)
					record.Password = '******';
				if(record['IBM Marketing'] && record['IBM Marketing'].Password){
					record['IBM Marketing'].Password = salt.decrypt(record['IBM Marketing'].Password);
				}
			});
			done();
		},
		postRemove: function(data, cb){
			this.group.removeUser(undefined, data.Username, function(err, updated){
				cb(err, data);
			});
		},
		getBlueprint: function(data){
			var authType = data['Authentication Service'];
			if(authType && authType !== 'Internal')
				return this.blueprint.external;
			return this.blueprint.internal;
		}
	}, function(err, user){
		if(err)
			return cb(err);
		user.attachGroups = function(group){
			this.group = group;
		};

		//auth
		user.login = function(username, password, cb){
			encrypt(password, function(err, encrypted){
				if(err)
					return cb(err);
				user.get({
					Username: new RegExp('^'+escape(username)+'$', 'i'),
					Password: encrypted
				}, function(err, userData){
					if(err)
						return cb(err);
					if(userData.length === 0)
						return cb(new Error('username or password do not match records for user ' + username));
					cb(err, userData[0]);
				});
			});
		};
		user.changePassword = function(username, password, cb){
			this.update({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
			},{
				Password: password
			}, cb);
		};

		//gets
		user.getUser = function(username, cb){
			user.get({Username: new RegExp('^'+escape(username)+'$', 'i')}, function(err, data){
				if(err)
					return cb(err);
				if(data.length === 0)
					return cb(new Error('User not found: ' + username));
				var record = data[0];
				if(record['IBM Marketing'] && record['IBM Marketing'].Password)
					record['IBM Marketing'].Password = '******';
				cb(undefined, record);
			});
		};
		user.getLanguage = function(username, cb){
			this.getProp({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
				Language: {'$exists': true, '$ne': ''}
			}, 'Language', cb);
		};
		user.getBookmarks = function(username, cb){
			this.getProp({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
				Bookmarks: {'$exists': true, '$ne': ''}
			}, 'Bookmarks', cb);
		};
		user.getEmail = function(username, cb){
			this.getProp({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
				Email: {'$exists': true, '$ne': ''}
			}, 'Email', cb);
		};
		user.getPinnedItems = function(username, cb){
			this.getProp({
				Username: new RegExp('^'+escape(username)+'$', 'i'),
				Pinned: {'$exists': true, '$ne': ''}
			}, 'Pinned', function(err, pinned){
				if(err)
					return cb(err);
				pin.validateAndCorrect(username, pinned, cb);
			});
		};
		user.isPinnedItem = function(username, item, cb){
			fpath(item, false, function(err, item){//normalzies & checks if exists in file system
				if(err)
					return cb(err);
				user.getProp({
					Username: new RegExp('^'+escape(username)+'$', 'i'),
					Pinned: item
				}, 'Pinned', function(err, pinned){
					if(err)
						return cb(err);
					cb(undefined, pinned && pinned.length > 0? true: false);
				});
			});
		};

		//editing
		user.addPinnedItem = function(username, item, cb){
			fpath(item, true, function(err, item){//normalzies & checks if exists in file system
				if(err)
					return cb(err);
				user.db.collection(user.name).update({
					Username: new RegExp('^'+escape(username)+'$', 'i')
				},{
					$addToSet: {Pinned: item}
				}, cb);
			});
		};
		user.removePinnedItem = function(username, item, cb){
			fpath(item, false, function(err, item){ //normalizes
				user.db.collection(user.name).update({
					Username: new RegExp('^'+escape(username)+'$', 'i')
				},{
					$pull: {Pinned: item}
				}, cb);
			});
		};

		//agregating
		user.getSpecificEmails = function(usernames, cb){ //usernames must be exact, regex not working, see: https://github.com/sergeyksv/tingodb/issues/102
			this.getProp({
				Username: {$in: usernames},
				Email: {'$exists': true, '$ne': ''}
			}, 'Email', cb);
		};
		user.getAllEmails = function(cb){
			this.getProp({
				Email: {'$exists': true, '$ne': ''}
			}, 'Email', cb);
		};
		user.getAllUsernames = function(cb){
			this.getProp({
				Username: {'$exists': true, '$ne': ''}
			}, 'Username', cb);
		};
		cb(err, user);
	});
};