var db = require('../db/external');
var async = require('async');
var helper = require('../db/external_helper');
var queries = db.getQueries().qa;
var utilities = require('./utility_methods')

var methods = {
	validateNew : function(component, callback){
		var errorList = [];

		if (!component.AUTHOR || component.AUTHOR == '') {
			errorList.push('nullAuthor');
		} else if (component.AUTHOR.length > 256) {
			errorList.push('authorLength');
		}

		if (!component.DESCRIPTION || component.DESCRIPTION == '') {
			errorList.push('nullDesc');
		} else if (component.DESCRIPTION.length > 256) {
			errorList.push('descLength');
		}

		if (!component.CATEGORY || component.CATEGORY == '') {
			errorList.push('nullCat');
		} else if (component.CATEGORY.length > 256) {
			errorList.push('catLength');
		}

		if (!component.TYPE || component.TYPE == '') {
			errorList.push('nullType');
		} else if (this.typeIsValid(component.TYPE)) {
			errorList.push('invalidType');
		}

		console.log("Field validation complete.");

		var validator = this;
		var functionsToRun = [
			function(asyncCallback){
				validator.nameIsValid(component.NAME, asyncCallback);
			},
			function(asyncCallback){
				validator.tableIsValid(component.TABLE_NAME, asyncCallback);
			},
			function(asyncCallback){
				validator.validateSQL(component.QUERY, asyncCallback);
			},
			function(asyncCallback){
				validator.groupsAreValid(component.TABLE_NAME, component.GROUPS, asyncCallback);
			}
		];
		// Will receive an array of error messages or null
		async.parallel(functionsToRun, function(err, results){
			if (err) {
				callback(err);
			} else {
				// Push any error messages into the list
				results.forEach(function(value, index){
					if (value) {
						console.log("An error occurred while checking if fields exists: " + value);
						errorList.push(value);
					}
				});
				console.log("Validation complete!");
				callback(null, errorList);
			}
		});
	},
	validateUpdate : function(component, callback){
		console.log('Validating Updated component');
		var errorList = [];

		if (!component.UPDATED_BY && component.UPDATED_BY != '') {
			errorList.push('nullAuthor');
		} else if (component.AUTHOR.length > 256) {
			errorList.push('authorLength');
		}

		if (!component.DESCRIPTION || component.DESCRIPTION == '') {
			errorList.push('nullDesc');
		} else if (component.DESCRIPTION.length > 256) {
			errorList.push('descLength');
		}

		if (!component.CATEGORY || component.CATEGORY == '') {
			errorList.push('nullCat');
		} else if (component.CATEGORY.length > 256) {
			errorList.push('catLength');
		}

		if (!component.TYPE && component.TYPE != '') {
			errorList.push('nullType');
		} else if (this.typeIsValid(component.TYPE)) {
			errorList.push('invalidType');
		}

		var validator = this;
		var functionsToRun = [
			function(asyncCallback){
				validator.updateNameIsValid(component.COMPONENT_ID, component.NAME, function(err, errMsg){
					if (err) {
						asyncCallback(err);
					} else {
						if (errMsg) {
							errorList.push(errMsg);
						}
						asyncCallback();
					}
				});
			},
			function(asyncCallback){
				validator.updateQueryIsValid(component.COMPONENT_ID, component.QUERY, component.TABLE_NAME, component.GROUPS, function(err, results){
					if (err) {
						asyncCallback(err);
					} else {
						if (results) {
							// Results array only contains error messages
							results.forEach(function(value, index){
								errorList.push(value);
							});
						}
						asyncCallback();
					}
				});
			}
		];
		async.parallel(functionsToRun, function(err, results){
			if (err) {
				callback(err);
			} else {
				callback(null, errorList);
			}
		});
	},
	updateNameIsValid : function(id, name, callback){
		var validator = this;
		var placeholders = [{ method : 'setInt', value : id}];
		helper.executeSinglePreparedStatement(queries.selectComponentById, placeholders, function(err, results){
			if (err) {
				console.log('Cannot get name: ' + err);
				callback(err);
			} else {
				var component = results[0];
				if (name == component.NAME) {
					// Name is identical, no errors possible
					callback();
				} else {
					validator.nameIsValid(name, callback);
				}
			}
		});
	},
	updateQueryIsValid : function(id, query, table, groups, callback){
		var validator = this;
		var placeholders = [{ method : 'setInt', value : id}];
		helper.executeSinglePreparedStatement(queries.selectComponentById, placeholders, function(err, results){
			if (err) {
				callback(err);
			} else {
				var component = results[0];
				if (query == component.QUERY) {
					// Query is identical, no errors possible
					callback();
				} else {
					// Must validate query, table and groups
					var errorList = [];

					var functionsToRun = [
						function(asyncCallback){
							validator.validateSQL(query, asyncCallback);
						},
						function(asyncCallback){
							validator.tableIsValid(table, asyncCallback);
						},
						function(asyncCallback){
							validator.groupsAreValid(table, groups, asyncCallback);
						}];
					async.parallel(functionsToRun, function(err, results){
						if (err) {
							callback(err);
						} else {
							// Push any error messages into the list
							results.forEach(function(value, index){
								if (value) {
									errorList.push(value);
								}
							});
							callback(null, errorList);
						}
					});
				}
			}
		});
	},
	nameIsValid : function(componentName, callback){
		console.log('nameIsValid function.');
		if (componentName && componentName != ''){
			if (componentName.length > 256) {
				callback(null, 'nameLength');
			} else {
				var name = utilities.stringProperNames(componentName);
				var placeholders = [{ method : 'setString', value : name }];
				helper.executeSinglePreparedStatement(queries.selectComponentByName, placeholders, function(err, results){
					if (err) {
						callback(err);
					} else {
						// Must interpret results before sending back.  Result either error msg or null.
						var finalResult;
						if (results.length != 0) {
							finalResult = 'invalidName';
						}
						callback(null, finalResult);
					}
				});
			}
		} else {
			// Name value is not set
			callback(null, 'nullName');
		}
	},
	typeIsValid : function(type) {
		if (type != 'Static' && type != 'Dynamic' && type != 'Strategic'){
			return true;
		} else {
			return false;
		}
	},
	tableIsValid : function(table, callback){
		if (table && table != '') {
			var placeholders = [{ method : 'setString', value : table }];

			helper.executeSinglePreparedStatement(queries.selectAllTablesByName, placeholders, function(err, results){
				if (err) {
					callback(err);
				} else {
					// Must interpret results before sending back.  Result either error msg or null.
					var finalResult;

					if (results.length == 0) {
						finalResult = 'invalidTable';
					}
					callback(null, finalResult);
				}
			});
		} else {
			// Table value is not set
			callback(null, 'nullTable');
		}
	},

	// Check if table has groups
	// Compare groups (none and none, missing some, has no groups set)
	groupsAreValid : function(tablename, groups, callback) {
		var sql_builder = require('./qa_component_sql_builder_controller');

		// Get column count
		sql_builder.determineColumnCount(tablename, function(err, count, groupColumn) {
			if (err) {
				console.log("An error occurred while getting the column count.");
				callback(err);
			} else if (count == 3) {
				sql_builder.getDistinctGroups(tablename, groupColumn, function(err, dbGroups) {
					if (err) {
						console.log("An error occurred while getting the groups.")
						callback(err);
					} else {

						if (dbGroups.length !== groups.length) {
							callback(null, 'invalidGroups');
						} else {
							var groupsArray = [];
							var dbGroupsArray = [];

							// Get only group names so that validation is easier.
							for (var i = 0; i < groups.length; i++) {
								groupsArray[i] = groups[i].value;
								dbGroupsArray[i] = dbGroups[i].group;
							}

							for (var i = 0; i < dbGroupsArray.length; i++) {
								if (groupsArray.indexOf(dbGroupsArray[i]) == -1) {
									return callback(null, 'invalidGroups');
								}
							}
							callback();
						}
					}
				});
			} else if (count == 2) {
				if (groups) {
					// Shouldn't be any groups
					return callback(null, 'noGroups');
				} else {
					callback();
				}
			} else {
				console.log("There were an invalid amount of columns in the table.");
				return callback(null, 'invalidColumns');
			}
		});
	},

	/**
	 * @author Jeegna Patel
	 *
	 * Validates the sql against a list of potentially harmful sql commands.
	 * This function assumes the given sql does not having leading or trailing
	 * whitespaces, or any semicolons.
	 *
	 * @param {String} sql The SQL query that was inputted.
	 * @return {Boolean} True if the SQL is valid, False otherwise. A valid SQL
	 * 						statement is one that does not contain any
	 * 						potentially harmful keywords, or comments.
	 */
	validateSQL : function(sql, callback) {
		console.log("Validating: " + sql);
		// Convert it to lowercase for matching purposes.
		var sql = sql.toLowerCase();

		// Don't continue execution if the SQL statement is empty.
		if (sql && sql != '') {
			// Check these with all types of whitespaces including spaces,
			// newline, and tabs.
			statements = ["delete", "insert", "drop", "alter", "grant", "create",
				"revoke", "show", "into", "declare", "update", "set", "delimiter",
				"if", "begin", "procedure", "trigger", "--", "/*", "*/"
			];

			for (var i = 0; i < statements.length; i++) {
				var statement = statements[i];
				// Escape all regex characters in the statement string.
				regexStatement = utilities.escape(statement);
				// Create a regex string with the statement surrounded by 0 or
				// more whitespaces, but ignoring surrounding quotation marks.
				var regex = new RegExp('[^"]*' + regexStatement + '[^"]', 'g');

				if (sql.match(regex)) {
					return callback("invalidSQL");
				}
			}

			return callback();
		} else {
			callback("nullQuery");
		}
	}
};

module.exports = methods;