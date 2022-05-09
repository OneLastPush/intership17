/**
 * internal database
 *
 * uses tingodb but whenevr i need to use mongodb should be retrofitted to be used by both
 * (I just don't remmeber their API differences)
 *
 * @type {object}
 */
var path = require('path');
var fs = require('fs');

var tingo = require('tingodb');

var Collection = require('./collection');

function Us(dataFolder){
	idb = this;
	if(!dataFolder) dataFolder = path.join(__dirname, 'data');
	idb.dataFolder = dataFolder;
	function _go(cb){
		var Db = tingo({searchInArray: true}).Db;
		idb.db = new Db(idb.dataFolder, {});
		cb();
	}
	idb.go = function(cb){
		fs.exists(idb.dataFolder, function(exist){
			if(!exist)
				fs.mkdir(idb.dataFolder, function(err){
					if(err)
						cb(err);
					else
						_go(cb);
				});
			else
				_go(cb);
		});
	};
	idb.showall = function(cb){
		//TODO
	};
	idb.createCollection = function(name, blueprint, opts, cb){
		fs.exists(path.join(idb.dataFolder, name), function(exists){
			var c = new Collection(idb.db, name, blueprint, opts);
			if(exists)
				return cb(undefined, c);
			c.setDefaults(function(err){ //run defaults if collection obj doesn't exist
				cb(err, c);
			});
		});
	};
}

module.exports = Us;