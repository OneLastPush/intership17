var path = require('path');

var express = require('express');
var iDB = require('internal_db');
var log = require('smart-tracer');

var db;
var collection = {};

module.exports = {
	init: function(dbLoc, cb){
		if(!path.isAbsolute(dbLoc))
			dbLoc = path.join(__dirname, '..', '..', dbLoc);
		db = new iDB(dbLoc);
		db.go(function(){
			var index = 4;
			function done(err){
				if(err)
					return cb(err);
				if(--index===0){ //done
					log.trace('Done making collections. Now linking collections.');
					//give circular dependencies for referencial integrity
					collection.user.attachGroups(collection.group);
					collection.group.attachUsers(collection.user);
					collection.pw_reset.attachUsers(collection.user);
					cb();
				}
			}

			//basic
			require('./collection/user')(db, function(err, c){
				collection.user = c;
				log.trace('User collection initialized');
				done(err);
			});
			require('./collection/permission')(db, function(err, c){
				if(err)
					done(err);
				collection.permission = c;
				log.trace('Permission collection initialized');
				collection.permission.getAll(function(err, permissions){
					if(err)
						done(err);
					require('./collection/group')(db, permissions, function(err, c){
						collection.group = c;
						log.trace('Group collection initialized');
						done(err);
					});
				});
			});
			require('./collection/pw_reset')(db, function(err, c){
				collection.pw_reset = c;
				log.trace('Pw_reset collection initialized');
				done(err);
			});

			//extra
			require('./collection/product_info')(db, function(err, c){
				collection.product_info = c;
				log.trace('Product_info collection initialized');
				done(err);
			});
		});
	},
	login: {
		login: function(username, password, cb){
			collection.user.login(username, password, cb);
		},
		requestReset: function(username, ip, email, cb){
			collection.pw_reset.createToken(username, ip, email, cb);
		},
		reset: function(username, password, token, cb){
			collection.pw_reset.validateToken(username, token, function(err, valid){
				if(valid){
					collection.user.changePassword(username, password, cb);
					collection.pw_reset.remove({
						Token: token
					}, function(err){
						if(err) log.error(err);
					});
				}else
					cb(new Error('username or token not valid'));
			});
		}
	},
	collection: collection
};