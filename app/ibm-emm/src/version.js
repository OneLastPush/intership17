var fs = require('fs');
var path = require('path');

var async = require('async');

var config = require('smart-config');
var log = require('smart-tracer');

us = {};
us.products = [ //list all products that could have versions
	'IBM Marketing Platform',
	"IBM Campaign",
	'IBM Contact Optimization',
	"IBM Distributed Marketing",
	"IBM Marketing Operations",
	"IBM Interact",
	"IBM SPSS Modeler Advantage"
];

us.getVersion = function(product, cb){
	var data = config.get(product);
	if(!data)
		return cb(new Error('Product configuration not found: ' + product));
	if(!data.active)
		return cb(new Error('Product not active in configurations: ' + product));
	if(!data.root)
		return cb(new Error('Product does not have root directory set: ' + product));
	fs.readFile(path.join(data.root, 'version.txt'), function(err, data){
		cb(err, data? data.toString().trim(): undefined);
	});
}
us.getVersionNoError = function(product, cb){
	us.getVersion(product, function(err, res){
		if(err){
			log.debug(err);
			cb(undefined, '--');
		}else
			cb(undefined, res);
	});
}
us.getVersions = function(cb){
	var versions = {};
	async.map(us.products, us.getVersionNoError, function(err, res){
		for(var i in us.products){
			versions[us.products[i]] = res[i];
		}
		cb(undefined, versions);
	});
}

module.exports = us;