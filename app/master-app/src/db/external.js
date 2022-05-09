var jdbc = require('jdbc');
var jinst = require('jdbc/lib/jinst');
var async = require('async');

/**
 * This function opens a new connection to the database, and returns
 * the entire connection object with its UUID.
 *
 * @param  callback - Format (err, connObj, conn, db)
 */
module.exports.openConnection = function(callback){
	if (!jinst.isJvmCreated()) {
	  jinst.addOption("-Xrs");
	  jinst.setupClasspath(['../../jdbc/ojdbc6.jar']);
	}

	var config = getConfig();
	var db = new jdbc(config);

	db.initialize(function(err){
		if (err){
			console.log('DB Initialize error: ' + err);
			callback(err);
		} else {
			db.reserve(function(err, connObj){
				if (err) {
					console.log('Reserve connection error: ' + err);
					callback(err);
				} else {
					callback(null, connObj, connObj.conn, db);
				}
			});
		}
	});
}

/**
 * Returns the configuration written in the config.json
 * file.
 *
 * @return The config found in the json file
 */
function getConfig(){
	// TODO: Replace this temporary config with real ones

	// Using oracle driver
	var config = {
		url: 'jdbc:oracle:thin:@10.0.2.172:1521:ORCL',
		drivername: 'oracle.jdbc.OracleDriver',
		user: 'QA_Module_2017',
		password: 'cleargoals2017',
		properties: {
			url: 'jdbc:oracle:thin:@10.0.2.172:1521:ORCL',
			drivername: 'oracle.jdbc.OracleDriver',
			user: 'QA_Module_2017',
			password: 'cleargoals2017'
		}
	};

	return config;
}

/**
 * This method releases the connection object to close the connection.
 *
 * @param  connObj - The entire connection object
 * @param  db - The database to release the connection from
 * @param  callback - Format (err)
 */
module.exports.closeConnection = function(connObj, db, callback){
	db.release(connObj, callback);
}

/**
 * This method turns auto-committing to false in order
 * to create one transaction.
 *
 * @param  conn - The connection
 * @param  savepointName - The name to be given to the savepoint
 * @param  callback - Format (err)
 */
module.exports.startTransaction = function(conn, savepointName, callback){
	conn.setAutoCommit(false, function(err){
		if (err) {
			console.log('Set autocommit off error: ' + err);
		} else {
			conn.setSavepoint(function(err, savepoint){
				if (err) {
					console.log('Set save point error: ' + err);
					conn.setAutoCommit(true, callback);
				} else {
					callback(null, savepoint);
				}
			}, savepointName);
		}
	});
}

/**
 * This method commits the transaction and turns
 * auto-committing to true.
 *
 * @param  conn - The connection
 * @param  savepointName - The name of the savepoint to be released
 * @param  callback - Format (err)
 */
module.exports.endTransaction = function(conn, savepoint, callback){
	console.log("Ending transaction " + savepoint);
	conn.commit(function(err){
		if (err) {
			console.log('Commit error: ' + err);
			callback(err);
		} else {
			conn.setAutoCommit(true, callback);
		}
	});
}

/**
 * This method executes a DML SQL statement and returns the
 * results in an array of objects.
 *
 * @param  conn - The connection
 * @param  sql - The SQL statement to be run
 * @param  callback - Format (err, results)
 */
module.exports.doExecute = function(conn, sql, callback){
	console.log("Executing " + sql);
	conn.createStatement(function(err, stmt){
		if (err) {
			console.log('Create statement error: ' + err)
			callback(err);
		} else {
			stmt.executeQuery(sql, function(err, resultset){
				if (err) {
					console.log('Do execute error: ' + err);
					callback(err);
				} else {
					resultset.toObjArray(callback);
				}
			});
		}
	});
}

/**
 * This method executes a SQL DDL statement and returns
 * the count of the rows affected.
 *
 * @param  conn - The connection
 * @param  sql - The SQL statement to be run
 * @param  callback - Format (err, count)
 */
module.exports.doUpdate = function(conn, sql, callback){
	console.log("Executing update " + sql);
	conn.createStatement(function(err, stmt){
		if (err) {
			console.log('Create statement error: ' + err)
			callback(err);
		} else {
			stmt.executeUpdate(sql, callback);
		}
	});
}

/**
 * This method executes a prepared DML SQL statement and
 * returns the results in an array of objects.
 *
 * @param  prepStmt - The prepared statement to be run
 * @param  callback - Format (err, results)
 */
module.exports.doPreparedExecute = function(prepStmt, callback){
	prepStmt.executeQuery(function(err, resultset){
		if (err) {
			console.log('Do prepared execute error: ' + err);
			callback(err);
		} else {
			resultset.toObjArray(callback);
		}
	});
}

/**
 * This method executes a prepared DDL SQL statement and
 * returns the results in an array of objects.
 *
 * @param  prepStmt - The prepared statement to be run
 * @param  callback - Format (err, results)
 */
module.exports.doPreparedUpdate = function(prepStmt, callback){
	prepStmt.executeUpdate(callback);
}

/**
 * This method prepares a statement using the placeholder
 * values given.
 *
 * @param  conn - The connection
 * @param  query - The query that is to be prepared
 * @param  placeholderArray - The array of placeholder values, object format : { method : 'setString', value : 'hello world'}
 * @param  callback - Format (err, preparedStatement)
 */
module.exports.prepare = function(conn, query, placeholderArray, callback){
	conn.prepareStatement(query, function(err, prepStmt){
		if(err){
			callback(err);
		}
		else {
			async.eachOfSeries(placeholderArray, function(item, key, cb){
				// We can use methods in this manner, avoiding a giant switch statement
				prepStmt[item.method](key + 1, item.value, cb);
			}, function(err){
				if (err) {
					callback(err);
				} else {
					callback(null, prepStmt);
				}
			});
		}
	});
}

/**
 * This method rolls back the database to its previous state at
 * the time of the save point.
 *
 * @param  conn - The connection
 * @param  savepointName - The name of the savepoint that will be rolled back to
 * @param  callback - Format (err)
 */
module.exports.rollback = function(conn, savepoint, callback){
	console.log("Rolling back to " + savepoint);
	conn.rollback(callback, savepoint);
}

/**
 * This method checks the configuration to load up the appropriate
 * queries for the driver being used.
 *
 * @return queries - The object containing all the queries
 */
module.exports.getQueries = function(){
	var queries = require('./queries/oracle');
	return queries;
};