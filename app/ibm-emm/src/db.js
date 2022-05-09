var jdbc = require('jdbc-generic');
var escape = require('pg-escape'); //closest thing I could find to parametizing jdbc sql
var async = require('async');
var config = require('smart-config');
var log = require('smart-tracer');

//JDBC connections currently cannot be reconfigured, so this is kinda useless
//see https://github.com/CraZySacX/node-jdbc/issues/88
//hopefully will be fixed in future, TODO
// config.on('change.'+database, function(key, value, origValue){
// 		us.init(v);
// }).on('loaded', function(data){
// 		us.init(config.get(database));
// });

var us = {
	jdbc: jdbc,
	init: function(cb){
		var platform = config.get('IBM Platform Database');
		var campaign = config.get('IBM Campaign Database');
		var jars = [];
		if(platform.active)
			jars.push(platform['*JDBC_jar']);
		if(campaign.active)
			jars.push(campaign['*JDBC_jar']);
		jdbc.init(jars);
		async.forEachOf({
			'IBM Platform Database': platform,
			'IBM Campaign Database': campaign
		}, function(config, name, cb){
			if(!jdbc.db[name] && config.active){
				us.create(name, config, cb);
			}else
				cb();
		}, cb);
	},
	create: function(name, opts, cb){
		opts.jar = opts['*JDBC_jar'];
		opts.override_url = opts.use_override_url;
		opts.url = opts.override_url;
		opts.dbname = opts.sid_dbname;
		opts.maxpoolsize = opts.max_pool;
		if(!opts.schema)
			opts.schema = opts.user || opts.username;
		jdbc.create(name, opts, cb);
	},
	getVersions: function(cb){
		var versions = {};
		async.forEachOf(jdbc.db, function(v, k, cb){
			jdbc.getVersion(k, function(err, v){
				if(err)
					log.error(err);
				versions[k] = v || undefined;
				cb();
			});
		}, function(err){
			if(err)
				return cb(err);
			return cb(err, versions);
		});
	},
	getUsers: function(cb){
		var db = jdbc.db['IBM Platform Database'];
		if(!db)
			return cb(new Error('Not configured', 'IBM Platform Database'));
		var query = escape('SELECT ID, NAME, STATUS FROM %s ORDER BY NAME', db._opts.schema+'.USM_USER');
		jdbc.query(db, query, function(err, data){
			if(err)
				return cb(err);
			cb(err, data);
		});
	},
	getPolicies: function(cb){
		var db = jdbc.db['IBM Platform Database'];
		if(!db)
			return cb(new Error('Not configured', 'IBM Platform Database'));
		var query = escape('SELECT ID, NAME, DISPLAY_NAME FROM %s WHERE TYPE=101 OR TYPE=102', db._opts.schema+'.USM_ROLE');
		jdbc.query(db, query, function(err, data){
			if(err)
				return cb(err);
			cb(err, data);
		});
	},
	validateCampaignCode: function(code, cb){
		var db = jdbc.db['IBM Campaign Database'];
		if(!db)
			return cb(new Error('Not configured', 'IBM Campaign Database'));
		var query = escape('SELECT COUNT(*) FROM %s WHERE CAMPAIGNCODE=%L', db._opts.schema+'.UA_CAMPAIGN', code);
		var res = false;
		jdbc.query(db, query, function(err, data){
			if(err)
				return cb(err, res);
			if(data && data[0] && data[0]['COUNT(*)'] >= 1)
				res = true;
			cb(err, res);
		});
	},
	validateFlowchartName: function(name, cb){
		var db = jdbc.db['IBM Campaign Database'];
		if(!db)
			return cb(new Error('Not configured', 'IBM Campaign Database'));
		var query = escape('SELECT COUNT(*) FROM %s WHERE NAME=%L', db._opts.schema+'.UA_FLOWCHART', name);
		var res = false;
		jdbc.query(db, query, function(err, data){
			if(err)
				return cb(err, res);
			if(data && data[0] && data[0]['COUNT(*)'] >= 1)
				res = true;
			cb(err, res);
		});
	}
};
module.exports = us;