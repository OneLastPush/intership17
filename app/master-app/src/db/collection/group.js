var path = require('path');
var escape = require('escape-string-regexp');
var async = require('async');
var log = require('smart-tracer');
var fpath = require('fix-path');

function makeFSPerm(fsPath, rank, download, upload, archive, canDelete, subfolders, cb){
	fpath(fsPath, false, function(err, newPath){
		if(err)
			return cb(err);
		cb(undefined, {
			Path: newPath,
			Rank: rank,
			'Can download': (download? true: false),
			'Can upload': (upload? true: false),
			'Can archive': (archive? true: false),
			'Can delete': (canDelete? true: false),
			'Propogate to subfolders': (subfolders? true: false)
		});
	});
}

module.exports = function(db, permissions, cb){
	db.createCollection('group', {
		Name: '',
		Users: [],
		Permissions: [],
		'Viewable file types': [],
		'File system permissions':[]
	}, {
		indexes: [{fields: {Name: 1}, opts: {unique: true}}],
		setDefaults: function(cb){
			var that = this;
			var index = 2;
			function done(err){
				if(err)
					cb(err);
				if(--index===0)
					cb();
			}
			this.insert({
				Name: 'Basic',
				Users: ['Admin'],
				Permissions: [],
				'Viewable file types': ['ses',
					'log',
					'cat', 'xml',
					'txt',
					'dat', 'dct', 'csv',
					'doc', 'docx'],
				'File system permissions': []
			}, done);
			makeFSPerm('/', 0, true, true, true, true, true, function(err, perm){
				that.insert({
					Name: 'Administrator',
					Users: ['Admin'],
					Permissions: permissions,
					'Viewable file types': ['*'],
					'File system permissions': [perm]
				}, done);
			});
		},
		preUpdate: function(what, data, cb){
			var fsPerms = data['File system permissions'];
			if(fsPerms){
				async.map(fsPerms, function(fsPerm, cb){
					for(var f in fsPerm){
						if(f == 'Path')
							continue;
						if(f == 'Rank')
							fsPerm[f] = parseInt(fsPerm[f]);
						else
							fsPerm[f] = fsPerm[f] === 'true' || fsPerm[f] === true? true: false; //autoboxing doesnt actually work for booleans...
					}
					fpath(fsPerm.Path, false, function(err, newPath){
						if(err) return cb(err);
						fsPerm.Path = newPath;
						cb();
					});
				}, function(err, res){
					cb(err, data);
				});
			}
		}
	}, function(err, group){
		if(err)
			return cb(err);
		group.attachUsers = function(user){
			this.user = user;
		};
		group.makeFSPerm = makeFSPerm;
		group.getPermission = function(username, permission, cb){
			this.getProp({
				Users: new RegExp('^'+escape(username)+'$', 'i'),
				//TODO raised issue about regex and / characters here: https://github.com/sergeyksv/tingodb/issues/113
				Permissions: permission
			}, 'Permissions', cb);
		};
		// gets permissions
		group.getPermissions = function(username, cb){
			this.getProp({
				Users: new RegExp('^'+escape(username)+'$', 'i'),
				Permissions: {'$exists': true, '$ne': ''}
			}, 'Permissions', cb);
		};
		group.getPathPermissions = function(username, specPath, cb){
			this.getProp({
				Users: new RegExp('^'+escape(username)+'$', 'i'),
				'File system permissions': {'$exists': true, '$ne': ''}
			}, 'File system permissions', function(err, paths){
				if(err || !specPath)
					return cb(err, paths);
				function consolidatePermissions(from, to){
					for(var key in from){
						if(key === 'Path')
							continue;
						to[key] = from[key] || to[key];
					}
				}
				fpath(specPath, false, function(err, newPath){
					if(err)
						return cb(err);
					makeFSPerm(newPath, 0, false, false, false, false, false, function(err, reqPerm){
						paths.forEach(function(existPerm){
							if(reqPerm.Path === existPerm.Path || //same as an existing permission or is a subfolder of a propogating permission
								(existPerm['Propogate to subfolders'] && path.relative(reqPerm.Path, existPerm.Path).match(/[\/\\.]*/)))
								consolidatePermissions(existPerm, reqPerm);
						});
						cb(undefined, reqPerm);
					});
				});
			});
		};
		group.getFiletypes = function(username, cb){
			this.getProp({
				Users: new RegExp('^'+escape(username)+'$', 'i'),
				'Viewable file types': {'$exists': true, '$ne': ''}
			}, 'Viewable file types', cb);
		};
		// get user(s)' info
		group.getGroups = function(username, cb){
			this.getProp({
				Users: new RegExp('^'+escape(username)+'$', 'i'),
				Name: {'$exists': true, '$ne': ''}
			}, 'Name', cb);
		};
		group.getGroupUsers = function(group, cb){
			this.getProp({
				Name: group,
				Users: {'$exists': true, '$ne': ''}
			}, 'Users', cb);
		};
		group.getGroupEmails = function(group, cb){
			var that = this;
			this.getGroupUsers(group, function(err, users){
				if(err)
					return cb(err);
				that.user.getSpecificEmails(users, cb);
			});
		};
		// sets & removes
		group.addUser = function(group, username, cb){
			this.db.collection(this.name).update({
				Name: group
			},{
				$push: {Users: username}
			}, {w:1}, cb);
		};
		group.removeUser = function(group, username, cb){
			var what = {};
			what.Users = new RegExp('^'+escape(username)+'$', 'i');
			if(group)
				what.Name = group;
			this.db.collection(this.name).update(what, {
				$pull: {Users: new RegExp('^'+escape(username)+'$', 'i')}
			}, {w: 1, multi: group? false: true}, cb);
		};
		group.setUserGroups = function(username, groups, cb){
			//group names must be exact, regex not working, see: https://github.com/sergeyksv/tingodb/issues/102
			this.db.collection(this.name).update({
				Name: {$in: groups}
			},{
				$addToSet: {Users: username}
			}, {w: 1, multi: true}, cb);
		};
		group.renameUser = function(usernameSearch, newUsername, cb){
			this.db.collection(this.name).update({
				Users: usernameSearch
			},{
				$pull: {Users: usernameSearch},
				$addToSet: {Users: newUsername}
			}, {w: 1, multi: true}, cb);
		};

		//gets
		group.getAllGroups = function(cb){
			this.getProp({
				Name: {'$exists': true, '$ne': ''}
			}, 'Name', cb);
		};

		cb(err, group);
	});
};