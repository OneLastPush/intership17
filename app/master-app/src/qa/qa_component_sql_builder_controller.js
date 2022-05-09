var helper = require('../db/external_helper');
var queries = require('../db/external').getQueries().qa;
var validator = require('./qa_component_validator');

/**
 * Processes the given SQL statement. This function will check if the given
 * SQL is valid, if it selects 2 or 3 columns, and if there are 3 columns,
 * it will provide a list of distinct group names in the callback.
 *
 * @param  {[type]} sql The sql statement.
 * @param  {Function} callback The function to execute once a result is
 *                             returned from the server.
 */
module.exports.processSQL = function(sql, callback) {
	console.log("Processing sql...");
	var sql_builder = this;

	// Clean up sql statement so that it is easier to validate, and remove
	// all semicolons.
	sql = sql.trim().split(';').join('');

	validator.validateSQL(sql, function (err) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			getTableName(function(err, tablename) {
				if (err) {
					callback(err);
				} else {
					createTable(sql, tablename, function(err, result) {
						if (err) {
							callback(err);
						} else if (result !== 'undefined') {
							determineColumnCount(tablename, function (err, count, thirdColumn) {
								if (err) {
									dropTempTable(tablename);
									callback(err);
								} else {
									processColumnCount(count, tablename, thirdColumn, callback);
								}
							});
						} else {
							callback("tableNotCreated");
						}
					});
				}
			});
		}
	});
}

/**
 * Gets the tableName variable to the next number in the sequence, padded
 * with at most three 0's appended to "CGQA_TEMP". I.e., the first table
 * would have the value "CGQA_TEMP0001".
 *
 * @param  {Function} callback The function to execute once a result is
 *                             returned from the server.
 */
function getTableName(callback) {
	var select = queries.lastNumberTableNameSequence;

	helper.executeSingleStatement(select, function(err, number) {
		if (err) {
			callback("retrieveTableName");
		} else {
			var num = number[0].nextval;
			var name = 'CGQA_TEMP' + (("0000" + num).slice(-4));
			console.log("Temporary table name: " + name);
			callback(null, name);
		}
	});
}

/**
 * Creates the temporary table with the given SQL select statement.
 *
 * @param {String} sql The select statement.
 * @param {String} tablename The temporary table's name.
 * @param {Function} callback The function to execute once a result is
 *                             returned from the server.
 */
function createTable(sql, tablename, callback) {
	var create = queries.createTempTable;
	create = create.replace('table_name', tablename);
	create = create.replace('?', sql);

	console.log("Creating table with name: " + tablename);
	helper.executeSingleUpdate(create, function(err, count) {
		if (err) {
			callback("tableNotCreated");
		} else {
			return callback(null, count);
		}
	});
}

/**
 * Determines the number of columns the user has in their SQL select
 * statement, and will execute the callback when it is complete.
 *
 * @param {String} sql The SQL query that was inputted
 * @param  {Function} callback The function to execute once a result is
 *                             returned from the server.
 */
var determineColumnCount = function(tablename, callback) {
	var select = queries.selectColumns;
	select = select.replace('table_name', tablename);

	console.log("Determining column count of " + tablename);
	helper.executeSingleStatement(select, function(err, result) {
		if (err) {
			return callback("retrieveColumns");
		} else if (result[0] && result[0] != 'undefined') {
			var columns = Object.keys(result[0]);
			console.log("There are " + columns.length + " column(s).");
			return callback(null, columns.length, columns[2]);
		} else {
			return callback("noData");
		}
	});
}

/**
 * Processes the given column count. If there are two columns, the user does
 * not want groups. If there are three, the user wants groups. If there are
 * less than two, or more than three then an error message will be shown.
 *
 * @param  {int}	  count    The number of columns.
 * @param  {Function} callback The fuunction to execute once a result is
 *                             returned from the server.
 */
function processColumnCount(count, tablename, thirdColumn, callback) {
	console.log("Processing columns of  " + tablename);
	switch (count) {
		case 2 :
			// The user does not want groups.
			console.log("There are no groups to be defined.");
			return callback(null, [], tablename);
			break;
		case 3 :
			// The user wants groups.
			console.log("There are groups to be defined.");
			getDistinctGroups(tablename, thirdColumn, function(err, result) {
				if (err) {
					return callback(err);
				} else if (result.length == 0) {
					// There were no groups defined
					return callback(null, [], tablename);
				} else {
					// There were groups defined
					return callback(null, result, tablename);
				}
			});
			break;
		default :
			// Invalid number of columns.
			console.log("Column count of " + count + " is invalid.");
			dropTempTable(tablename);
			return callback("invalidColumns");
	}
}

/**
 * Gets a unique array of groups from the given temporary table. The result
 * will be an array of objects like:
 * [ { group : "group_name1" }, { group : "group_name2" }, ... ]
 *
 * @param {String} sql The SQL query that was inputted
 * @param  {Function} callback The function to execute once a result is
 *                             returned from the server.
 */
var getDistinctGroups = function(tablename, column, callback) {
	var select = queries.selectDistinctGroups;
	select = select.replace('table_name', tablename);
	select = select.split('column_name').join(column);

	console.log("Getting distinct groups from " + tablename);
	console.log("The column's name is " + column);
	helper.executeSingleStatement(select, function(err, result) {
		if (err) {
			return callback("retrieveGroups");
		} else {
			return callback(null, result);
		}
	});
}

/**
 * Drops the temporary table that was created with the given name. If any
 * exception occurs, it will be ignored.
 *
 * @param  {String} tableName The name of the table
 */
function dropTempTable(tablename) {
	var drop = queries.dropTemporaryTable;
	drop = drop.replace('table_name', tablename);

	console.log("Dropping " + tablename);
	helper.executeSingleUpdate(drop, function(err, count) {});
}

module.exports.determineColumnCount = determineColumnCount;
module.exports.getDistinctGroups = getDistinctGroups;
