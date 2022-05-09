/*
 *	Database functions class for the QA Module's
 *	Component Viewer.
 *	@author Jacob Brooker
 *	@version 1.0 - April 21st, 2017
 */

var access = require('../db/external');
var helper = require('../db/external_helper');
var queries = require('../db/external').getQueries().qa;
var utilities = require('./utility_methods');

// Exported object holding database controller functions.
var component_functions = {

	/**
	 * Helper method that Returns all Categories and its components
	 * through the use of a callback method. If an error is encountered
	 * it is called back also.
	 * @param {Callback} callback
	 */
	getCategoriesWithComponents: function(callback) {
		var myself = this;

		myself.getCategories(function(error, categories){
			if(error){
				callback("errorGetCategoriesAndComponents");
			}
			else {
				myself.getComponents(function(compError, components){
					if(compError){

					}
					else {
						var categoriesWithComps = myself.buildCategoriesFromArray(categories, components);
						callback(null, categoriesWithComps);
					}
				});
			}
		});
	},

	/**
	 * Helper method that Returns adds a Category to the DB,
	 * and returns the added object through the callback.
	 * If an error is encountered, it is called back also.
	 * @param {String} categoryName
	 * @param {Callback} callback
	 */
	addCategory: function(categoryName, callback) {
		var myself = this;
		categoryName = utilities.stringProperNames(categoryName);

		helper.openConnectionWithTransaction(function(connError, connObj, conn, database, savepoint){
			if(connError){
				console.error("Connection to database failed: " + connError.message);
				callback("errorAddCategory");
			}
			else {
				var categoryObj = { NAME: categoryName }; // The object only requires a name for the check.
				myself.checkIfCategoryExists(categoryObj, conn, function(existsError, exists){
					if(existsError) {
						console.error("Error fetching whether OBJ exists: " + existsError.message);
						callback("errorAddCategory");
					}
					// If it does not exist...
					if(!exists) {
						var params = [ { method: 'setString', value: categoryName } ];
						helper.prepareAndUpdate(conn, queries.insertCategory, params, function(stmtError, results){
							if(stmtError){
								console.error("New Category Insert Failed: " + stmtError.message);
								helper.closeConnectionWithRollback(connObj, database, savepoint, "errorAddCategory", callback);
							}
							else {
								var selectParams = [ { method: 'setString', value: categoryName } ];
								helper.prepareAndExecute(conn, queries.selectNewestCategory, selectParams, function(selectError, results){
									if(selectError){
										console.log("Statement Execution failed: " + selectError.message);
										helper.closeConnectionWithRollback(connObj, database, savepoint, "errorAddCategory", callback);
									}
									else {
										console.log(results);
										helper.closeConnectionWithCommit(connObj, database, savepoint, results[0], callback);
									}
								});
							}
						});
					}
					else {
						helper.closeConnectionWithError("categoryAlreadyExists",
							 connObj, database, callback);
					}
				});
			}
		});
	},

	/**
	 * Helper method that Removes a Component from the DB,
	 * and returns the removed object through the callback.
	 * If an error is encountered, it is called back also.
	 * @param {Object} componentObj
	 * @param {Callback} callback
	 */
	removeComponent: function(componentObj, callback) {
		var id = componentObj.COMPONENT_ID;
		var params = [ { method: 'setInt', value: +id } ];
		var myself = this;

		helper.openConnectionWithTransaction(function(connError, connObj, conn, database, savepoint){
			if(connError){
				console.error("Connection to database failed: " + connError.message);
				callback("errorRemoveComponent");
			}
			else {
				// Chech that the component exists.
				myself.checkIfComponentExists(componentObj, conn, function(error, exists){
					if(error) {
						console.error("Error fetching whether OBJ exists: " + error.message);
						helper.closeConnectionWithError("errorRemoveComponent",
							 connObj, database, callback);
					}
					// If it exists...
					if(exists){
						helper.prepareAndUpdate(conn, queries.setRemovedComponent, params, function(stmtError, results){
							if(stmtError){
								console.error("Setting of Category to Deprecated Failed: " + stmtError.message);
								helper.closeConnectionWithRollback(connObj, database, savepoint, "errorRemoveComponent", callback);
							}
							else {
								console.log(results);
								helper.closeConnectionWithCommit(connObj, database, savepoint, componentObj, callback);
							}
						});
					}
					// If it does not...
					else {
						helper.closeConnectionWithError("componentDoesNotExist",
							 connObj, database, callback);
					}
				});
			}
		});
	},

	/**
	 * Helper method that Removes a Category from the DB,
	 * and returns the removed object through the callback.
	 * If an error is encountered, it is called back also.
	 * @param {Object} categoryObj
	 * @param {Callback} callback
	 */
	removeCategory: function(categoryObj, callback) {
		var id = categoryObj.CATEGORY_ID;
		var params = [ { method: 'setInt', value: +id } ];
		var myself = this;

		helper.openConnectionWithTransaction(function(connError, connObj, conn, database, savepoint){
			if(connError){
				console.error("Connection to database failed: " + connError.message);
				callback(connError);
			}
			else {
				// Chech that the component exists.
				myself.checkIfCategoryExists(categoryObj, conn, function(error, exists){
					if(error) {
						console.error("Error fetching whether OBJ exists: " + error.message);
						helper.closeConnectionWithError("errorRemoveCategory",
							 connObj, database, callback);
					}
					// If it exists...
					if(exists){
						helper.prepareAndExecute(conn, queries.selectCategoryComponents, params, function(stmtError, results){
							if(error){
								console.error("Fetching of category's components failed: " + stmtError.message);
								helper.closeConnectionWithRollback(connObj, database, savepoint, "errorRemoveCategory", callback);
							}
							else {
								if(results.length < 1){
									helper.prepareAndUpdate(conn, queries.setRemovedCategory, params, function(stmtError, results){
										if(stmtError){
											console.error("Setting of Category to Deprecated Failed: " + stmtError.message);
											helper.closeConnectionWithRollback(connObj, database, savepoint, "errorRemoveCategory", callback);
										}
										else {
											console.log(results);
											helper.closeConnectionWithCommit(connObj, database, savepoint, categoryObj, callback);
										}
									});
								}
								else {
									helper.closeConnectionWithError("categoryHasComponents",
										connObj, database, callback);
								}
							}
						});
					}
					// If it does not...
					else {
						helper.closeConnectionWithError("categoryDoesNotExist",
							 connObj, database, callback);
					}
				});
			}
		});
	},

	/**
	 * Helper method that Retrieves all Categories.
	 * @param {Callback} callback
	 */
	getCategories: function(callback){
		var myself = this;
		helper.executeSingleStatement(queries.selectCategories, function(error, categoryArray){
			if(error){
				callback("errorGetCategories");
			}
			else {
				callback(null, categoryArray);
			}
		});
	},

	/**
	 * Helper method that Retrieves all Components.
	 * @param {Callback} callback
	 */
	getComponents: function(callback){
		var myself = this;
		helper.executeSingleStatement(queries.selectComponents, function(error, componentArray){
			if(error){
				callback("errorGetComponents");
			}
			else {
				callback(null, componentArray);
			}
		});
	},

	/**
	 * Function that determines whether a category exists in the database.
	 * It is designed to be used by other helper functions, and not called by
	 * any other script directly.
	 * @param {Object} categoryObj
	 * @param {Connection} conn
	 * @param {Callback} callback
	 */
	checkIfCategoryExists: function(categoryObj, conn, callback){
		var myself = this;
			access.doExecute(conn, queries.selectCategories,
				function(error, categories){
					if(error){
						console.log("Statement Execution failed: " + error.message);
					}
					else {
						var matched = false;
						// Attempt to find a match.
						for(var i=0; i < categories.length; i++){
							if(!matched && categories[i].NAME === categoryObj.NAME){
								callback(null, true);
								matched = true;
								break;
							}
						}
						// If there are no matched, return false.
						if(!matched) {
							callback(null, false);
						}
					}
				}
			);
	},

	/**
	 * Function that determines whether a component exists in the database.
	 * It is designed to be used by other helper functions, and not called by
	 * any other script directly.
	 * @param {Object} categoryObj
	 * @param {Connection} conn
	 * @param {Callback} callback
	 */
	checkIfComponentExists: function(componentObj, conn, callback){
		var myself = this;
			access.doExecute(conn, queries.selectComponents,
				function(error, components){
					if(error){
						myself.rollbackAndClose(connObj, db, savepoint, error, callback);
					}
					else {
						var matched = false;
						// Attempt to find a match.
						for(var i=0; i < components.length; i++){
							if(!matched && components[i].NAME === componentObj.NAME){
								callback(null, true);
								matched = true;
								break;
							}
						}
						// If there are no matched, return false.
						if(!matched) {
							callback(null, false);
						}
					}
				}
			);
	},

	/**
	 * Functions that builds the JSON object to return, from a
	 * query of the Components joined with the Categories.
	 * It is designd to be used by helper functions, and no other script.
	 * @param {Array} array
	 */
	buildCategoriesFromArray: function(categories, components){
		// Build Array of Category IDs
		var catIDs = [];
		categories.forEach(function(cat){
			cat.COMPONENTS = [];
			catIDs.push(cat.CATEGORY_ID);
		});

		// Assign every component to an array for a category, and
		// build a list of categories.
		components.forEach(function(component){
			// Find the index of the Component's category.
			var catIndex = catIDs.indexOf(component.CATEGORY);

			// Add the existing Component to the Category,
			// if the Category exists.
			if(catIndex > -1) {
				component.CATEGORY = categories[catIndex].NAME;
				categories[catIndex].COMPONENTS.push(component);
			}
		});

		// Return the results.
		return categories;
	}

};

module.exports = component_functions;