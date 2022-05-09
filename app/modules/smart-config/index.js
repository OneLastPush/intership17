var eventEmitter = require('events').EventEmitter;
var path = require('path');
var fs = require('fs');

var us = new eventEmitter();
//utils
us._getObj = function(obj, key, make){
	if(!key || !obj)
		return obj;
	var keys = key.split('.');
	var place = obj;
	for(var i=0; i<keys.length; i++){
		var k = keys[i];
		if(place[k] == undefined){
			if(make)
				place[k] = {};
			else
				return undefined;
		}
		place = place[k];
	}
	return place;
};
us._setObj = function(obj, key, value){
	if(!key){
		obj = value;
		return;
	}
	var keys = key.split('.');
	var lastKey, lastObj;
	if(keys.length === 1){
		lastKey = key;
		lastObj = obj;
	}else{
		lastKey = keys.pop();
		lastObj = us._getObj(obj, keys.join('.'), true);
	}
	lastObj[lastKey] = value;
};
us._deepCopy = function(obj1, obj2){
	if(!obj2){
		if(obj1 instanceof Array)
			obj2 = [];
		else
			obj2 = {};
	}
	if(typeof obj1 !== 'object')
		return obj1;

	var val;
	for(var key in obj1){
		val = obj1[key];
		if(typeof val == 'object')
			obj2[key] = us._deepCopy(val);
		else
			obj2[key] = val;
	}

	return obj2;
};
us._flattenObj = function(obj){
	var data = {};
	for(var f in obj){
		if(typeof obj[f] == 'object'){
			if(Object.keys(obj[f]).length == 0){
				data[f] = obj[f];
			}else{
				var flattened = us._flattenObj(obj[f]);
				for(var e in flattened){
					data[f+'.'+e] = flattened[e];
				}
			}
		}else
			data[f] = obj[f]
	}
	return data;
};
us._diff = function(obj1, obj2){
	var diff = {};
	var flat1 = us._flattenObj(obj1);
	var flat2 = us._flattenObj(obj2);
	for(var f1 in flat1){
		if(flat1[f1] != flat2[f1]){
			diff[f1] = {
				orig: flat1[f1],
				value: flat2[f1]
			};
		}
	}
	for(var f2 in flat2){
		if(diff[f2] == undefined && flat2[f2] != flat1[f2]){
			diff[f2] = {
				orig: flat1[f2],
				value: flat2[f2]
			}
		}
	}
	return diff;
};
us.file = './config.json';
us.rawData = undefined;
us.defaults = {};

//PUBLIC METHODS//
us.setFile = function(file, clearDefaults){
	us.rawData = undefined;
	us.file = file;
	if(clearDefaults)
		us.clearDefaults();
	return us;
};
us.load = function(cb){
	fs.readFile(us.file, function(err, data){
		var errs = [];
		if(err)
			errs.push(err);
		try{
			us.rawData = JSON.parse(data);
		}catch(err2){
			errs.push(err);
			us.rawData = {};
		}
		us.emit('postLoad', us.rawData);
		us.syncDefaults();
		us.emit('loaded', us.rawData);
		if(cb)
			cb(errs.shift(), us.rawData);
	});
	return us;
};
us.save = function(cb){
	if(us.rawData == undefined)
		us.rawData = {};
	us.syncDefaults();
	var saveData = us._deepCopy(us.rawData);
	us.emit('preSave', us.rawData, saveData);
	fs.writeFile(us.file, JSON.stringify(saveData, null, 4), cb);
	return us;
};

us.get = function(key){
	return us._getObj(us.rawData, key);
};
us.set = function(key, value, dontSave, cb){
	if(!us.rawData){
		us.rawData = {};
		us.syncDefaults();
	}
	var orig = us._getObj(us.rawData, key);

	//find differences
	var origObj = {};
	origObj[key] = orig;
	var newObj = {};
	newObj[key] = value;
	var diff = us._diff(origObj, newObj);

	if(Object.keys(diff).length > 0){ //if different, set
		var parent = key.split('.')[0];
		var dataOrig = us._deepCopy(us._getObj(us.rawData, parent));

		us._setObj(us.rawData, key, value);
		var dataChanged = us._deepCopy(us._getObj(us.rawData, parent));

		//save, if asked
		if(!dontSave)
			us.save(cb);

		//notify listeners of changes
		var index, path;
		for(var d in diff){ //finds parent elements that changed
			path = d;
			index = d.lastIndexOf('.');
			while(index>0){
				path = path.substring(0, index);
				diff[path] = {
					orig: us._getObj(dataOrig, path.substring(parent.length+1)),
					value: us._getObj(dataChanged, path.substring(parent.length+1))
				}
				index = path.lastIndexOf('.');
			}
		}
		for(var entry in diff)
			us.emit('change.'+entry, diff[entry].value, diff[entry].orig);
	}
	return us;
};
us.default = function(key, value){
	us.defaults[key] = value;
	if(us.rawData != undefined){ //if defaults already loaded
		var orig = us.get(key);
		if(orig == undefined)
			us.set(key, value);
	}
	return us;
};
us.clearDefaults = function(){
	us.defaults = {};
};
us.syncDefaults = function(){
	for(var d in us.defaults){
		if(us._getObj(us.rawData, d) == undefined)
			us._setObj(us.rawData, d, us.defaults[d]);
	}
};
module.exports = us;