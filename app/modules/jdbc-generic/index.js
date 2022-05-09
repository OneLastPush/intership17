var jinst = require('jdbc/lib/jinst');
var JDBC = require('jdbc');
var log = require('smart-tracer');

var jdbcTypes =  [{
	type: 'oracle',
	jarMatch: /ojdbc6.jar$/i,
	driver: 'oracle.jdbc.OracleDriver',
	getUrl: function(connOpts){
		return 'jdbc:oracle:thin:'+connOpts.user+'/'+connOpts.password+
			'@'+connOpts.host+':'+connOpts.port+
			':'+(connOpts.sid || connOpts.dbname);
	},
	getVersion: function(db, cb){
		us.query(db, 'select * from v$version', function(err, res){
			if(err)
				return cb(err);
			var v = [];
			res.forEach(function(val){
				v.push(val.BANNER);
			});
			cb(err, v);
		});
	}
},{
	type: 'mysql',
	jarMatch: /mysql-connector/i,
	driver: 'com.mysql.jdbc.Driver',
	getUrl: function(connOpts){
		return 'jdbc:mysql://'+connOpts.host+':'+connOpts.port+
			'/'+(connOpts.sid || connOpts.dbname)+
			'?user='+connOpts.user+'&password='+connOpts.password;
	},
	getVersion: function(db, cb){
		us.query(db, 'show variables like "%version%"', function(err, res){
			if(err)
				return cb(err);
			var v = [];
			res.forEach(function(val){
				v.push(val.VARIABLE_NAME+': '+val.VARIABLE_VALUE);
			});
			cb(err, v);
		});
	}
},{
	type: 'db2',
	jarMatch: /db2jcc/i,
	driver: 'com.ibm.db2.jcc.DB2Driver',
	getUrl: function(connOpts){
		return 'jdbc:db2://'+connOpts.host+':'+connOpts.port+
			'/'+(connOpts.sid || connOpts.dbname)+
			':user='+connOpts.user+';password='+connOpts.password+';';
	},
	getVersion: function(db, cb){
		us.query(db, 'select * from SYSIBMADM.ENV_INST_INFO', function(err, res){
			if(err)
				return cb(err);
			var v = [];
			res = res[0];
			for(var key in res)
				v.push(key+': '+res[key]);
			cb(err, v);
		});
	}
},{
	type: 'mssql',
	jarMatch: /sqljdbc/i,
	driver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
	getUrl: function(connOpts){
		return 'jdbc:sqlserver://'+connOpts.host+':'+connOpts.port+
			';databaseName='+(connOpts.sid || connOpts.dbname)+
			';username='+connOpts.user+';password='+connOpts.password+';';
	},
	getVersion: function(db, cb){
		us.query(db, 'select @@VERSION', function(err, res){
			if(err)
				return cb(err);
			var v = [];
			res = res[0];
			for(var key in res)
				v.push(res[key]);
			cb(err, v);
		});
	}
}];

var us = {
	types: jdbcTypes,
	db: {},
	init: function(jars){
		if(!jinst.isJvmCreated()){
			jinst.addOption('-Xrs'); //some sort of java signal intervention is turned off
			if(!(jars || jars instanceof Array))
				jars = Array.prototype.slice.call(arguments, 0);
			jinst.setupClasspath(jars);
		}
		return us;
	},
	create: function(name, opts, cb){
		var type;
		us.types.forEach(function(t){
			if(opts.jar.match(t.jarMatch))
				type = t;
		});
		if(!type)
			return cb(new Error('Could not find JDBC jar type ' + opts.jar));
		if(!opts.drivername)
			opts.drivername = type.driver;
		if(!opts.minpoolsize)
			opts.minpoolsize = 0;
		if(!opts.maxpoolsize)
			opts.maxpoolsize = 5;
		if(!opts.url_override){
			if(!opts.user)
				opts.user = opts.username;
			if(!opts.properties)
				opts.properties = {};
			opts.url = type.getUrl(opts);
		}
		var db = new JDBC(opts);
		db._type = type;
		db._opts = opts;
		db.initialize(function(err){
			if(err)
				return cb(err);
			us.db[name] = db;
			cb(undefined, db);
		});
		return us;
	},
	release: function(db, con){
		db.release(con, function(err){
			if(err)
				log.error(err);
		});
	},
	query: function(db, query, cb){
		if(typeof db === 'string')
			db = us.db[db];
		var eCon;
		function isError(err){
			if(err){
				cb(err);
				if(eCon)
					us.release(db, eCon);
				return true;
			}
			return false;
		}
		db.reserve(function(err, establishedConnection){
			eCon = establishedConnection;
			if(isError(err))
				return;
			var con = eCon.conn;
			con.createStatement(function(err, statement){
				if(isError(err))
					return;
				statement.executeQuery(query, function(err, set){
					if(isError(err))
						return;
					set.toObjArray(function(err, res){
						if(isError(err))
							return;
						cb(undefined, res);
						us.release(db, eCon);
					});
				});
			});
		});
		return us;
	},
	getVersion: function(db, cb){
		if(typeof db === 'string')
			db = us.db[db];
		db._type.getVersion(db, cb);
	}
};
module.exports = us;