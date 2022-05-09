var db = require('../db/external');

var methods = {
	/**
	 * This method opens a new connection and starts a transaction.
	 *
	 * @author Erika Bourque
	 * @param  callback - Format: (err, connObj, conn, database, savepoint)
	 */
	openConnectionWithTransaction : function(callback){
		db.openConnection(function(err, connObj, conn, database){
			if (err) {
				console.log('An error occured during openConnection: ' + err);
				callback(err);
			} else {
				db.startTransaction(conn, 'TRANSACTION', function(err, savepoint){
					if (err) {
						console.log('An error occured during startTransaction: ' + err);
						closeConnectionWithError(err, connObj, database, callback);
					} else {
						callback(null, connObj, conn, database, savepoint);
					}
				});
			}
		});
	},

	/**
	 * This method closes a connection and returns the results or closeError in the
	 * callback specified.
	 *
	 * @author Erika Bourque
	 * @param  results - The results to be returned
	 * @param  connObj - The connection to be closed
	 * @param  database - The database that is being connected to
	 * @param  callback - Format: (err, results)
	 */
	closeConnectionWithResults : function(results, connObj, database, callback) {
		db.closeConnection(connObj, database, function(closeError){
			if (closeError) {
				console.log('An error occured during close connection: ' + closeError);
				callback(closeError);
			} else {
				callback(null, results);
			}
		});
	},

	/**
	 * This method closes a connection and returns the error, and closeError if it
	 * occurs, in the callback
	 *
	 * @author Erika Bourque
	 * @param  originalError - The original error to be returned
	 * @param  connObj - The connection to be closed
	 * @param  database - The database that is being connected to
	 * @param  callback - Format: (err, results)
	 */
	closeConnectionWithError : function(originalError, connObj, database, callback){
		db.closeConnection(connObj, database, function(closeError){
			if (closeError) {
				console.log('An error occured during close connection: ' + closeError);
				callback(originalError + "; " + closeError);
			} else {
				callback(originalError);
			}
		});
	},

	/**
	 * This method commits the current transaction and closes the connection with
	 * the result give.
	 *
	 * @author Jacob Brooker
	 * @param  connObj - The connection to be closed
	 * @param  database - The database that is being connected to
	 * @param  savepoint - The savepoint created at the time of transaction open
	 * @param  result - The result to be saved
	 * @param  callback - Format: (err, results)
	 */
	closeConnectionWithCommit: function(connObj, database, savepoint, results, callback){
		var helper = this;
		var conn = connObj.conn;
		db.endTransaction(conn, savepoint, function(error){
			if(error){
				console.error("Transaction commit failed: " + error.message);
				// TODO: change to use closeConnectionWithRollback
				db.rollback(conn, savepoint, function(err){
					if(err) {
						console.error("Rollback on transaction failed: " + err.message);
					}
				});
				callback(error);
			}
			else {
				helper.closeConnectionWithResults(results, connObj, database, callback);
			}
		});
	},

	/**
	 * This method rolls back the current database changes and closes the connection
	 * with the error that originally caused the need for a rollback
	 *
	 * @author Jacob Brooker
	 * @param  connObj - The connection to be closed
	 * @param  database - The database that is being connected to
	 * @param  savepoint - The savepoint created at the time of transaction open
	 * @param  error - The error to be sent back
	 * @param  callback - Format: (err, results)
	 */
	closeConnectionWithRollback: function(connObj, database, savepoint, error, callback){
		var helper = this;
		var conn = connObj.conn;
		db.rollback(conn, savepoint, function(err){
			if(err){
				console.error("Rollback after operation failed: " + err.message);
			}
			else {
				helper.closeConnectionWithError(error, connObj, database, callback);
			}
		});
	},

	/**
	 * This method executes a single statement from start to finish.
	 *
	 * @author Jeegna Patel
	 * @param  sql - The query to be executed
	 * @param  callback - Format: (err, results)
	 */
	executeSingleStatement : function(sql, callback) {
		var helper = this;
		db.openConnection(function(err, connObj, conn, database) {
			if (err) {
				callback(err);
			} else {
				db.doExecute(conn, sql, function(err, result) {
					if (err) {
						helper.closeConnectionWithError(err, connObj, database, callback);
					} else {
						helper.closeConnectionWithResults(result, connObj, database, callback);
					}
				});
			}
		});
	},

	/**
	 * This method executes a single update from start to finish.
	 *
	 * @author Jeegna Patel
	 * @param  sql - The query to be executed
	 * @param  callback - Format: (err, results)
	 */
	executeSingleUpdate : function(sql, callback) {
		var helper = this;
		db.openConnection(function(err, connObj, conn, database) {
			if (err) {
				callback(err);
			} else {
				db.doUpdate(conn, sql, function(err, result) {
					if (err) {
						helper.closeConnectionWithError(err, connObj, database, callback);
					} else {
						helper.closeConnectionWithResults(result, connObj, database, callback);
					}
				});
			}
		});
	},

	prepareAndUpdate : function(conn, query, placeholders, callback) {
		db.prepare(conn, query, placeholders, function(err, prepStmt){
			if (err) {
				console.log('An error occured during prepare statement: ' + err);
				callback(err)
			} else {
				db.doPreparedUpdate(prepStmt, callback);
			}
		});
	},

	prepareAndExecute : function(conn, query, placeholders, callback) {
		db.prepare(conn, query, placeholders, function(err, prepStmt){
			if (err) {
				console.log('An error occured during prepare statement: ' + err);
				callback(err)
			} else {
				db.doPreparedExecute(prepStmt, callback);
			}
		});
	},

	executeSinglePreparedStatement : function(query, placeholders, callback){
		var helper = this;
		db.openConnection(function(err, connObj, conn, database){
			if (err) {
				console.log('An error occured during openConnection: ' + err);
				callback(err);
			} else {
				helper.prepareAndExecute(conn, query, placeholders, function(err, results){
					if (err) {
						helper.closeConnectionWithError(err, connObj, database, callback);
					} else {
						helper.closeConnectionWithResults(results, connObj, database, callback);
					}
				});
			}
		});
	},

	updateSinglePreparedStatement : function(query, placeholders, callback){
		var helper = this;
		db.openConnection(function(err, connObj, conn, database){
			if (err) {
				console.log('An error occured during openConnection: ' + err);
				callback(err);
			} else {
				helper.prepareAndUpdate(conn, query, placeholders, function(err, results){
					if (err) {
						helper.closeConnectionWithError(err, connObj, database, callback);
					} else {
						helper.closeConnectionWithResults(results, connObj, database, callback);
					}
				});
			}
		});
	}
};

module.exports = methods;