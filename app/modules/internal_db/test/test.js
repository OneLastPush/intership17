/**
 * mocha
 */
var path = require('path');
var fs = require('fs');

var rimraf = require('rimraf');

var iDB = require('../index');
var testDb = new iDB(path.join(__dirname, 'data'));


function deepEquals(o1, o2){
	var tmp;
	for(var key in o1){
		tmp = o2[key];

		if(tmp === undefined){
			return false;
		}else if(typeof tmp == 'object'){
			if(!deepEquals(o1[key], o2[key]))
				return false;
		}else if(o1[key] !== tmp){
			return false;
		}
	}
	return true;
}

function getCheck(data, expectedData){
	if(!data || data.length !== expectedData.length)
		throw new Error('Did not get expected data. Expected array of '+expectedData.length+', got:\n'+JSON.stringify(data, null, 4));
	expectedData.forEach(function(expectedRecord){
		var found = false;
		data.forEach(function(gottenRecord){
			if(deepEquals(expectedRecord, gottenRecord))
				found = true;
		});
		if(!found)
			throw new Error('Could not find expected recordExpected:\n'+
				JSON.stringify(expectedRecord, null, 4)+'\nGiven:\n'+JSON.stringify(data, null, 4));
	});
}

function sameListValues(expected, gotten){
	expected.forEach(function(value){
		var matched = false;
		for(var i=0; i<gotten.length; i++){
			if(deepEquals(value, gotten[i])){
				matched = true;
				break;
			}
		}
		if(!matched){
			throw new Error('Expected to find a record but did not find it. Record: \n' +
				JSON.stringify(value, null, 4) +
				'\nrecords:\n' +
				JSON.stringify(gotten, null, 4));
		}
	});
}

var collections = [
	{
		name: 'user',
		opts: {
			indexes: [{field: {username: 1}, opts: {unique: true}}],
			setDefaults: function(cb){
				this.insert({username: 'Admin', password: 'password'}, cb);
			},
	 		preUpdate: function(what, data, cb){
				if(data && data.password)
	 				data.password = 'iamtotallysalty';
	 			cb(undefined, data);
	 		},
	 		postGet: function(err, data, cb){
	 			if(err) return cb(err);
	 			data.forEach(function(record){
	 				if(record.password)
	 					record.password = '******';
	 			});
	 			cb(err, data);
	 		},
	 		postRemove: function(data, cb){
	 			data.removed = true;
	 			cb(undefined, data);
	 		},
	 		getBlueprint: function(data){
	 			if(data && data.username == 'Admin'){
	 				return {};
	 			}
	 			return this.blueprint;
	 		}
		},
		blueprint: {
			username: '',
			password: 'password',
			bookmarks: [{
				key: 'Name',
				value: 'URL'
			}],
			permissions: []
		},
		testBlueprint: {
			username: '',
			password: 'password',
			bookmarks: [{
				key: 'Name',
				value: 'URL'
			}],
			permissions: []
		},

		insert: { username: 'User1', password: 'password1' },
		insertedWhat: { username: 'User1' },
		insert2: { username: 'User2', password: 'password2' },
		duplicateInsert: { username: 'User1' },
		duplicateShouldBeOkay: false,

		getInsert: [{
			username: 'User1',
			password: '******',
			bookmarks: [],
			permissions: []
		}],
		getInsert2: [{
			username: 'User2',
			password: '******',
			bookmarks: [],
			permissions: []
		}],

		changeWhat: { username: 'User1' },
		change: { password: 'abc123123' },
		changed: [{ username: 'User1', password: '******' }],
		findAfterChange: { username: 'User1' },

		recordField: 'username',
		recordQualifiers: ['User2'],
		syncField: 'permissions',
		syncValues: ['Write', 'View'],

		remove: { username: 'User1' },
		removed: true,

		getProp: 'username',
		expectProp: ['Admin', 'User2'],

		finalState: [{
			username: 'Admin',
			password: '******'
		},{
			username: 'User2',
			password: '******',
			bookmarks: [],
			permissions: ['Write', 'View']
		}]
	}, {
		name: 'permission',
		blueprint: { permission: '', users: [] },
		testBlueprint: { permission: '', users: [] },

		insert: { permission: 'View' },
		insertedWhat: { permission: 'View' },
		insert2: { permission: 'Write' },
		duplicateInsert: { permission: 'View' },
		duplicateShouldBeOkay: true,

		getInsert: [{
			permission: 'View',
			users: []
		},{
			permission: 'View',
			users: []
		}],
		getInsert2: [{
			permission: 'Write',
			users: []
		}],

		changeWhat: { permission: 'View' },
		change: { permission: 'Omnipotent' },
		changed: [{ permission: 'Omnipotent' }],
		findAfterChange: { permission: 'Omnipotent' },

		recordField: 'permission',
		recordQualifiers: ['Omnipotent', 'Write'],
		syncField: 'users',
		syncValues: ['User2'],

		remove: { permission: 'Write' },

		getProp: 'permission',
		expectProp: ['Omnipotent'],

		finalState: [{
			permission: 'Omnipotent',
			users: ['User2']
		},{
			permission: 'Omnipotent',
			users: ['User2']
		}]
	}
];


describe('internal_db', function(){
	after(function(done){
		rimraf(path.join(testDb.dataFolder, '*'), done);
	});

	it('go', function(done){
		testDb.go(done);
	});

	collections.forEach(function(test){
		describe('collection - ' + test.name, function(){
			it('make', function(done){
				new testDb.createCollection(test.name, test.blueprint, test.opts, function(err, collection){
					test.collection = collection;
					done(err);
				});
			});
			it('name', function(){
				if(test.collection.name !== test.name)
					throw new Error('collection name not accurate. Expected ' + test.name + ' got ' + test.collection.name);
			});
			it('blueprint', function(){
				if(!deepEquals(test.collection.getBlueprint(), test.testBlueprint))
					throw new Error('Blueprint does not match, expect:\n'+JSON.stringify(test.testBlueprint, null, 4) + '\nGot:\n' + JSON.stringify(test.collection.blueprint));
			});
			describe('insert', function(){
				it('insert', function(done){
					test.collection.insert(test.insert, done);
				});
				it('update nothing adds new', function(done){
					test.collection.update(null, test.insert2, done);
				});
				it('insert duplicate', function(done){
					test.collection.insert(test.duplicateInsert, function(err, data){
						if(test.duplicateShouldBeOkay){
							done(err, data);
						}else{
							if(!err)
								done(new Error('duplicate insert was accepted when its field should be unique'));
							else
								done();
						}
					});
				});
			});
			describe('existing records', function(){
				it('get', function(done){
					test.collection.get(test.insertedWhat, function(err, data){
						if(err) return done(err);
						getCheck(data, test.getInsert);
						done();
					});
				});
				it('update', function(done){
					test.collection.update(test.changeWhat, test.change, function(err, updated){
						if(err) return done(err);
						if(updated !== 1)
							throw new Error('Expected to update 1 record, updated: ' + updated);
						test.collection.get(test.findAfterChange, function(err, data){
							if(err) return done(err);
							getCheck(data, test.changed);
							done();
						});
					});
				});
				it('sync', function(done){
					test.collection.sync(test.recordField, test.recordQualifiers, test.syncField, test.syncValues, function(err){
						if(err) return done(err);

						var tilDone = test.recordQualifiers.length;
						var isDone = function isDone(){
							if(--tilDone===0)
								done();
						};
						test.recordQualifiers.forEach(function(syncName){
							var what = {};
							what[test.recordField] = syncName;
							test.collection.get(what, function(err, data){
								if(err)
									return done(err);
								else{
									if(!data || data.length < 1)
										throw new Error('Expected to get synched record, but could not find it in collection');
									var syncedFieldValues = data[0][test.syncField];
									test.syncValues.forEach(function(value){
										if(syncedFieldValues.indexOf(value) < 0)
											throw new Error('Could not find synced value '+value+' inside retrieved record:\n'+JSON.stringify(data[0], null, 4));
									});
									isDone();
								}
							});
						});
					});
				});
				it('remove', function(done){
					test.collection.remove(test.remove, function(err, deleted){
						if(err) return done(err);
						if(!deleted)
							throw new Error('Did not delete anything');
						if(test.removed? deleted.remove === test.removed: deleted.hasOwnProperty('remove'))
							throw new Error("Removed record's removed field value " + deleted.remove + " did not match expected " + test.removed);
						done();
					});
				});
			});
		});
	});

	collections.forEach(function(test){
		describe('instance - '+test.name, function(){
			it('Collection', function(){
				if(test.name !== test.collection.name)
					throw new Error('collection name not accurate. Expected ' + test.name + ' got ' + test.collection.name);
			});
			it('getProp', function(done){
				test.collection.getProp({}, test.getProp, function(err, data){
					if(err) return done(err);
					sameListValues(test.expectProp, data);
					done();
				});
			});
			it('Final state', function(done){
				test.collection.get({}, function(err, data){
					if(err) return done(err);
					sameListValues(test.finalState, data);
					done();
				});
			});
		});
	});
});