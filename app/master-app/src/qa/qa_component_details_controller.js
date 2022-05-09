var db = require('../db/external');
var async = require('async');
var helper = require('../db/external_helper');
var validator = require('./qa_component_validator');
var queries = db.getQueries().qa;
var utilities = require('./utility_methods');

module.exports.getCategories = function(callback){
	helper.executeSingleStatement(queries.selectCategoryNames, callback);
}

/**
 * This method saves a new component in the database.
 *
 * @param  component - the component to be saved
 * @param  callback - Format: (err, validationErrors, component)
 */
module.exports.saveNewComponent = function(component, callback){
	console.log("Validating component");
	validator.validateNew(component, function(err, validationErrors){
		if (err) {
			console.log('An error occured during validation: ' + err);
			callback(err);
		} else if (validationErrors.length != 0) {
			console.log("Validation errors occurred:");
			console.log(validationErrors);

			callback(null, validationErrors);
		} else {
			console.log("Validation passed!")
			save(component, function(err, result){
				if (err) {
					console.log("An error occurred while saving");
					console.log(err);
					callback(err);
				} else {
					console.log(result);
					callback(null, null, result);
				}
			});
		}
	});
}

/**
 * This method updates a component in the database.
 *
 * @param  component - the component to be updated
 * @param  callback - Format: (err, validationErrors, component)
 */
module.exports.updateComponent = function(component, callback){
	// Must parse component id to be an int after the json conversion for request
	component.COMPONENT_ID = parseInt(component.COMPONENT_ID);
	validator.validateUpdate(component, function(err, validationErrors){
		if (err) {
			console.log('An error occured during validation: ' + err);
			callback(err);
		} else if (validationErrors.length != 0) {
			callback(null, validationErrors);
		} else {
			update(component, function(err, result){
				if (err) {
					callback(err)
				} else {
					callback(null, null, result);
				}
			});
		}
	});
}

function save(component, callback){
	helper.openConnectionWithTransaction(function(err, connObj, conn, database, savepoint){
		if (err) {
			callback(err);
		} else {
			console.log("Saving component...");
			console.log(component);
			doSaveTransaction(conn, component, function(err, result){
				if (err) {
					console.log("An error occurred while saving. Rolling back...");
					console.log(err);
					helper.closeConnectionWithRollback(connObj, database, savepoint, err, callback);
				} else {
					console.log("Successfully saved component!");
					helper.closeConnectionWithCommit(connObj, database, savepoint, result, callback);
				}
			});
		}
	});
}

function doSaveTransaction(conn, component, callback){
	console.log("Processing category: " + component.CATEGORY);
	getOrCreateCategory(conn, component.CATEGORY, function(err, category){
		if (err) {
			callback(err);
		} else {
			console.log("Saving and getting component details...");
			saveAndRetrieveComponentDetails(conn, category.CATEGORY_ID, component, function(err, savedComponent){
				if (err) {
					callback(err);
				} else {
					console.log("Saved component: ");
					console.log(savedComponent);
					console.log("Saving tablename...");
					saveComponentTable(conn, savedComponent.COMPONENT_ID, component.TABLE_NAME, function(err, count){
						if (err) {
							callback(err);
						} else if (component.GROUPS) {
							console.log("Saving component groups...");
							saveComponentGroups(conn, savedComponent.COMPONENT_ID, component.GROUPS, function(err, count){
								if (err) {
									callback(err);
								} else {
									console.log("Component saved.");
									callback(null, savedComponent);
								}
							});
						} else {
							callback(null, savedComponent);
						}
					});
				}
			});
		}
	});
}

function getOrCreateCategory(conn, categoryName, callback){
	var name = utilities.stringProperNames(categoryName);
	var placeholders = [{ method : 'setString', value : name }];
	helper.prepareAndExecute(conn, queries.selectCategoryByName, placeholders, function(err, results){
		if (err) {
			callback(err);
		} else if (results.length == 0) {
			console.log('Creating new category: ' + categoryName);
			createAndRetrieveCategory(conn, name, callback);
		} else {
			callback(null, results[0]);
		}
	});
}

function createAndRetrieveCategory(conn, name, callback){
	var params = [ { method: 'setString', value: name } ];
		helper.prepareAndUpdate(conn, queries.insertCategory, params, function(stmtError, results){
			if(stmtError){
				console.error("New Category Insert Failed: " + stmtError.message);
				callback(stmtError);
			}
			else {
				var selectParams = [ { method: 'setString', value: name } ];
				helper.prepareAndExecute(conn, queries.selectNewestCategory, selectParams, function(selectError, results){
					if(selectError){
						console.log("Statement Execution failed: " + selectError.message);
						callback(selectError);
					}
					else {
						callback(null, results[0]);
					}
				});
			}
		});
}

function getComponentByName(conn, componentName, callback){
	var placeholders = [{ method : 'setString', value : utilities.stringProperNames(componentName) }];
	helper.prepareAndExecute(conn, queries.selectComponentByName, placeholders, function(err, results){
		if (err) {
			callback(err);
		} else {
			callback(null, results[0]);
		}
	});
}

function saveComponentTable(conn, componentId, tableName, callback){
	var placeholders = [{ method : 'setString', value : tableName },
						{ method : 'setInt', value : componentId }];
	helper.prepareAndUpdate(conn, queries.insertComponentTables, placeholders, callback);
}

//
// @author Frank Birikundavyi
//
function saveComponentGroups(conn, componentId, groups, callback) {
	async.forEachOf(groups, function(group, index, asyncCallback) {
		var placeholders = [{ method : 'setString', value : group.value },
							{ method : 'setInt', value : componentId },
							{ method : 'setInt', value : index }];
		helper.prepareAndUpdate(conn, queries.insertGroup, placeholders, asyncCallback);
	}, callback);
}

function saveAndRetrieveComponentDetails(conn, categoryId, component, callback){
	var name = utilities.stringProperNames(component.NAME);
	var currentTime = utilities.buildDateString(new Date(Date.now()));
	var placeholders = [{ method : 'setString', value : name },
						{ method : 'setString', value : 'n/a' }, //status
						{ method : 'setString', value : component.DESCRIPTION },
						{ method : 'setString', value : component.QUERY },
						{ method : 'setString', value : component.TYPE },
						{ method : 'setInt', value : categoryId },
						{ method : 'setString', value : component.AUTHOR },
						{ method : 'setInt', value : 0 }, //schedule
						{ method : 'setString', value : currentTime },// new creation date
						{ method : 'setString', value : currentTime }];
	console.log('Insert details: ' + placeholders);
	helper.prepareAndUpdate(conn, queries.insertComponent, placeholders, function(err, count){
		if (err) {
			callback(err);
		} else {
			// Sending back saved component
			getComponentByName(conn, name, function(err, results){
				if (err) {
					callback(err);
				} else {
					console.log('Retrieving component for display: ');
					getComponentForDisplay(conn, results.COMPONENT_ID, callback);
				}
			});
		}
	});
}

function getComponentById(conn, componentId, callback){
	var placeholders = [{ method : 'setInt', value : componentId }];
	helper.prepareAndExecute(conn, queries.selectComponentById, placeholders, callback);
}

function update(component, callback){
	helper.openConnectionWithTransaction(function(err, connObj, conn, database, savepoint){
		if (err) {
			callback(err);
		} else {
			doUpdateTransaction(conn, component, function(err, result){
				if (err) {
					helper.closeConnectionWithRollback(connObj, database, savepoint, err, callback);
				} else {
					helper.closeConnectionWithCommit(connObj, database, savepoint, result, callback);
				}
			});
		}
	});
}

function doUpdateTransaction(conn, component, callback){
	// Save current component in history
	saveHistory(conn, component.COMPONENT_ID, function(err, results){
		if (err) {
			callback(err);
		} else {
			console.log('Updating new details...');
			// Update all parts of component
			var functionsToRun = [
				function(asyncCallback){
					updateComponent(conn, component, asyncCallback);
				},
				function(asyncCallback){
					// Will only be set if tests had to be rerun, is already validated
					if (component.TABLE_NAME) {
						updateComponentTables(conn, component, asyncCallback);
					} else {
						asyncCallback();
					}
				},
				function(asyncCallback){
					// Will only be set if tests had to be rerun, is already validated
					if (component.GROUPS) {
						updateComponentGroups(conn, component, asyncCallback);
					} else {
						asyncCallback();
					}
				}];
			// async.parallel's callback returns (err, result) as expected
			async.parallel(functionsToRun, function(err, results){
				if (err) {
					callback(err);
				} else {
					// Sending back updated component
					getComponentForDisplay(conn, component.COMPONENT_ID, callback);
				}
			});
		}
	});
}

function saveHistory(conn, componentId, callback){
	// Saving history details
	moveDetailsHistory(conn, componentId, function(err, results){
		if (err) {
			callback(err);
		} else {
			console.log('Getting the generated component history id...');
			// Retrieving saved history details's ID
			getComponentHistoryId(conn, componentId, function(err, results){
				if (err) {
					callback(err);
				} else {
					var historyId = results[0].COMPONENT_HISTORY_ID;
					var functionsToRun = [
						function(asyncCallback){
							moveGroupsHistory(conn, componentId, historyId, asyncCallback);
						},
						function(asyncCallback){
							moveTablesHistory(conn, componentId, historyId, asyncCallback);
						}];
					async.parallel(functionsToRun, callback);
				}
			});
		}
	});
}

function moveDetailsHistory(conn, oldComponentId, callback){
	// Retrieve all current component details
	getComponentById(conn, oldComponentId, function(err, results){
		if (err) {
			callback(err);
		} else {
			var component = results[0];
			var placeholders = [{ method : 'setInt', value : oldComponentId },
								{ method : 'setString', value : component.NAME },
								{ method : 'setString', value : component.STATUS },
								{ method : 'setString', value : component.DESCRIPTION },
								{ method : 'setString', value : component.QUERY },
								{ method : 'setString', value : component.TYPE },
								{ method : 'setInt', value : component.CATEGORY },
								{ method : 'setString', value : component.CREATION_DATETIME },
								{ method : 'setString', value : component.CREATED_BY },
								{ method : 'setInt', value : component.SCHEDULE },
								{ method : 'setInt', value : component.RUN_PRIORITY },
								{ method : 'setString', value : component.UPDATED_DATETIME },
								{ method : 'setString', value : component.UPDATED_BY }];
			console.log('Moving details history...');
			helper.prepareAndUpdate(conn, queries.insertComponentHistory, placeholders, callback);
		}
	});
}

/**
 * This method retrieves and saves the current data from component_groups
 * into the component_groups_history table.
 *
 * @author Erika Bourque
 * @param  {[type]}   conn           [description]
 * @param  {[type]}   oldComponentId [description]
 * @param  {[type]}   historyId      [description]
 * @param  {Function} callback       [description]
 * @return {[type]}                  [description]
 */
function moveGroupsHistory(conn, oldComponentId, historyId, callback){
	var placeholdersForSelect = [{ method : 'setInt', value : oldComponentId }];
	// Get all current groups
	helper.prepareAndExecute(conn, queries.selectGroupsByComponent, placeholdersForSelect, function(err, currentGroupResults){
		if (err) {
			callback('Move groups history err' + err);
		} else {
			// Verify groups exist, can be none
			if (currentGroupResults) {
				// Insert each group into history
				async.each(currentGroupResults, function(group, asyncCallback){
					var placeholdersForInsert = [{ method : 'setInt', value : historyId },
												{ method : 'setString', value : group.NAME },
												{ method : 'setInt', value : group.ORDER_NUMBER }];
					helper.prepareAndUpdate(conn, queries.insertGroupsHistory, placeholdersForInsert, asyncCallback);
				}, callback);
			} else {
				callback();
			}
		}
	});
}

/**
 * This method retrieves and saves the current data from component_tables into
 * the component_tables_history table.
 *
 * @author Erika Bourque
 * @param  {[type]}   conn           [description]
 * @param  {[type]}   oldComponentId [description]
 * @param  {[type]}   historyId      [description]
 * @param  {Function} callback       [description]
 */
function moveTablesHistory(conn, oldComponentId, historyId, callback){
	var placeholdersForSelect = [{ method : 'setInt', value : oldComponentId }];
	// Get all current tables
	helper.prepareAndExecute(conn, queries.selectCompTablesByComp, placeholdersForSelect, function(err, currentTablesResults){
		if (err) {
			callback('Move tables history err' + err);
		} else {
			// Insert each table into history
			async.each(currentTablesResults, function(table, asyncCallback){
				var placeholdersForInsert = [{ method : 'setInt', value : historyId },
											{ method : 'setString', value : table.NAME }];
				helper.prepareAndUpdate(conn, queries.insertTablesHistory, placeholdersForInsert, asyncCallback);
			}, callback);
		}
	});
}

function getComponentHistoryId(conn, oldComponentId, callback){
	var placeholders = [{ method : 'setInt', value : oldComponentId },
						{ method : 'setInt', value : oldComponentId }];
	helper.prepareAndExecute(conn, queries.selectLatestCompHistoryDetailsById, placeholders, callback);
}

/**
 * This method updates the component with new details.  It only
 * affects fields that can be changed by the user.
 *
 * @author Erika Bourque
 * @param  {[type]}   conn      [description]
 * @param  {[type]}   component [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
function updateComponent(conn, component, callback){
	// Must retrieve id of category chosen first
	getOrCreateCategory(conn, component.CATEGORY, function(err, results){
		if (err) {
			callback(err);
		} else {
			// Update the component details
			var name = utilities.stringProperNames(component.NAME);
			var currentDate = utilities.buildDateString(new Date(Date.now()));
			var placeholders = [{ method : 'setString', value : name },
								{ method : 'setString', value : component.DESCRIPTION },
								{ method : 'setString', value : component.QUERY },
								{ method : 'setString', value : component.TYPE },
								{ method : 'setInt', value : results.CATEGORY_ID },
								{ method : 'setString', value : component.UPDATED_BY },
								{ method : 'setString', value : currentDate },
								{ method : 'setInt', value : component.COMPONENT_ID },];
			helper.prepareAndUpdate(conn, queries.updateComponent, placeholders, callback);
		}
	})
}

function updateComponentTables(conn, component, callback){
	var deletePlaceholders = [{ method : 'setInt', value : component.COMPONENT_ID }];
	helper.prepareAndUpdate(conn, queries.deleteTables, deletePlaceholders, function(err, results){
		if (err) {
			callback(err);
		} else {
			saveComponentTable(conn, component.COMPONENT_ID, component.TABLE_NAME, callback);
		}
	});
}

function updateComponentGroups(conn, component, callback){
	var deletePlaceholders = [{ method : 'setInt', value : component.COMPONENT_ID }];
	helper.prepareAndUpdate(conn, queries.deleteGroups, deletePlaceholders, function(err, results){
		if (err) {
			callback(err);
		} else {
			saveComponentGroups(conn, component.COMPONENT_ID, component.GROUPS, callback);
		}
	});
}

function getComponentForDisplay(conn, componentId, callback){
	var placeholders = [{ method : 'setInt', value : componentId }];
	helper.prepareAndExecute(conn, queries.selectCompForDisplay, placeholders, function(err, results){
		if (err) {
			callback(err);
		} else {
			callback(null, results[0]);
		}
	});
}