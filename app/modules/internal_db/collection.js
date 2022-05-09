/**
 * Database - tingodb or mongodb instance
 * Name - name of the collection
 * Blueprint - object representation/schema for this collection. You can effectively put it in in any format provided you override getBlueprint()
 * Opts - { //these are all optional
 * 		indexes: [{field: {username: 1}, opts: {}}],
 * 		setDefaults: function(cb){
 * 			this.insert({username: 'Admin', password: 'password'}, cb);
 * 		},
 * 		preUpdate: function(what, data, cb){
 * 			if(data && data.password){
 * 				data.pasword = salt(data.password);
 * 			}
 * 		},
 * 		postGet: function(err, data, cb){
 * 			if(err) return cb(err);
 * 			data.forEach(function(record){
 * 				if(record.password)
 * 					record.password = '******';
 * 			});
 * 			cb(err, data);
 * 		},
 * 		postRemove: function(record, cb){
 * 			//notify something
 * 			cb(undefined, record);
 * 		},
 * 		getBlueprint: function(data){
 * 			if(data && data.authentication){
 * 				switch(data.authentication){
 * 					case 'LDAP': return blueprint.LDAP;
 * 					case 'software': return blueprint.software;
 * 				}
 * 			}
 * 			return blueprint.original;
 * 		}
 * }
 */
var extend = require('util')._extend;

function Collection(database, name, blueprint, opts){
	var that = this;

	//specifics
	this.db = database;
	this.name = name;
	this.blueprint = blueprint;

	if(opts){
		this._opts = opts;
		if(opts.indexes){
			opts.indexes.forEach(function(index){
				that.db.collection(that.name).createIndex(index.field, index.opts);
			});
		}
		if(opts.setDefaults)
			this.setDefaults = opts.setDefaults;
		if(opts.preUpdate)
			this.preUpdate = opts.preUpdate;
		if(opts.postGet)
			this.postGet = opts.postGet;
		if(opts.postRemove)
			this.postRemove = opts.postRemove;
		if(opts.getBlueprint)
			this.getBlueprint = opts.getBlueprint;
	}
}

//// Overridable functions:
Collection.prototype.setDefaults = function(cb){
	//this.db
	cb();
};
Collection.prototype.preUpdate = function(what, data, cb){
	cb(undefined, data);
};
Collection.prototype.postGet = function(err, data, cb){
	cb(err, data);
};
Collection.prototype.postRemove = function(data, cb){
	cb(undefined, data);
};
Collection.prototype.getBlueprint = function(data){
	return this.blueprint;
};
////

/**
 * [get description]
 * @param  {[type]}   search [{Username:'Admin'} or {Username: new RegExp('^Admin$', 'i'})}]
 * @param  {[type]}   fields [Optional. Only return these fields for your search, ei: {Email:1}]
 * @param  {Function} cb     [err, data as array/[]]
 * @return {[type]}          [description]
 */
Collection.prototype.get = function(search, fields, cb){
	if(typeof fields === 'function'){
		cb = fields;
		fields = {};
	}
	var that = this;
	this.db.collection(this.name).find(search, fields).toArray(function(err, data){
		that.postGet(err, data, cb);
	});
};
/**
 * [getProp Returns array of only that property in the db, and only with unique values]
 * @param  {[type]}   search [search criteria, ei {Username: "Admin"}]
 * @param  {[type]}   field  [field to return, ei 'Status']
 * @param  {Function} cb     [returns err or data [] with just the distinct field values, if the field is an array will return whats in the array together]
 * @return {[type]}          [description]
 */
Collection.prototype.getProp = function(search, field, cb){ //TingoDb doesn't have a distinct function
	var what = {};
	what[field] = 1;
	this.get(search, what, function(err, data){
		if(err)
			return cb(err);
		var list = [];
		data.forEach(function(record){
			if(record[field] instanceof Array){
				record[field].forEach(function(entry){
					if(list.indexOf(entry) === -1) //if unique
					list.push(entry);
				});
			}else{
				if(list.indexOf(record[field]) === -1) //if unique
					list.push(record[field]);
			}
		});
		//in case field couldnt be found, remove any undefiend or null values in the list
		var remove = list.indexOf(undefined);
		if(remove >= 0)
			list.splice(remove, 1);
		remove = list.indexOf(null);
		if(remove >= 0)
			list.splice(remove, 1);
		cb(err, list);
	});
};
Collection.prototype.insert = function(data, cb){
	var that = this;
	if(data) data = extend({}, data); //dont alter original obj
	this.stamp(data);
	this.preUpdate(undefined, data, function(err, data){
		if(err) return cb(err);
		that.db.collection(that.name).insert(data, {w: 1}, cb);
	});
};
/**
 * Updates existing record or adds a new one.
 *
 * If what is an empty object, will select all records. try not to do that, as it's effectively erasing the whole collection.
 *
 * @param  {Object}   what {} to find a record. If empty, will call insert instead.
 * @param  {Object}   data Data of record to insert
 * @param  {Function} cb   callback function that returns error and how many records were updated.
 * @return {[undefined]}        [undefined]
 */
Collection.prototype.update = function(what, data, cb){
	if(!what) //if not existing, insert new
		return this.insert(data, cb);
	var that = this;
	if(data) data = extend({}, data); //dont alter original obj
	this.preUpdate(what, data, function(err, data){
		if(err) return cb(err);
		that.db.collection(that.name).update(what, {$set: data}, {
			w: 1
		}, cb);
	});
};
Collection.prototype.remove = function(what, cb){
	var that = this;
	this.db.collection(this.name).findAndModify(what, {}, {}, {w:1, remove: true}, function(err, record){
		if(err)
			return cb(err);
		that.postRemove(record, cb);
	});
};

/**
 * Makes (an) array field(s) exactly the fieldValues you sent in.
 * Used for referencial integrity.
 * Is probably not terribly performant as it looks through every single record.
 * Helps if your fieldName is indexed.
 *
 * @param  {[String]}   recordFieldName [mongo db field -- so can be 'permission' or whatever]
 * @param  {[Array]}    recordSet       [the field's value to qualify for the sync, in Array format, ie ['Write', 'Read']]
 * @param  {[String]}   syncField       [The field to sync this info to, ie 'users']
 * @param  {[Object]}   syncValues     [the object that contains the Array of fields to sync. Ei, ['user1']]
 * @param  {Function}   cb              [function with error object (error optional)]
 * @return {[type]}                   [description]
 */
Collection.prototype.sync = function(recordFieldName, recordSet, syncField, syncValues, cb){
	if(!recordFieldName)
		return cb(new Error('Record search field name is required'));
	if(!syncField)
		return cb(new Error('Field which to sync is required'));
	if(!syncValues)
		syncValues = [];

	var counter = 2;
	function done(err){
		if(--counter===0 && cb) cb(err);
	}
	var select = {};
	var doWhat = {};
	var opts = {multi: true, w: 1};

	select[recordFieldName] = {'$nin': recordSet};
	doWhat[syncField] = syncValues;
	this.db.collection(this.name).update(select, { '$pullAll': doWhat }, opts, done); //remove if not supposed to be there

	select[recordFieldName] = {'$in': recordSet};
	doWhat = {};
	doWhat[syncField] = { '$each': syncValues };
	this.db.collection(this.name).update(select, { '$addToSet': doWhat }, opts, done); //add if missing
};

/**
 * Consolidates with blueprint
 * @param  {[Object]} obj [object to consolidate]
 * @return {[Object]}     [object with manadtory blueprint variables added]
 */
Collection.prototype.stamp = function(obj){
	obj = getKey(obj, this.getBlueprint(obj));
	return obj;
};

/**
 * Checks if the obj value should be blueprint or the original obj value.
 *
 * Issue that caused this to be made:
 * AJAX doesn't send empty arrays. So it comes out as just null/undefined. But we still want to know what is an array.
 *
 * Other cases where this may be needed:
 * - If blueprint is used in any sort of display format, any unfilled fields will not be displayed. So normalizing data is good.
 *
 * @param {[any]} obj       [value]
 * @param {[any]} blueprint [default value]
 */
function getKey(obj, blueprint){
	if(blueprint instanceof Array){
		obj = obj || [];
	}else if(typeof blueprint == 'object'){
		if(!obj)
			obj = {};
		for(var bKey in blueprint)
			obj[bKey] = getKey(obj[bKey], blueprint[bKey]);
	}else if(!obj){
		obj = blueprint;
	}
	return obj;
}

module.exports = Collection;