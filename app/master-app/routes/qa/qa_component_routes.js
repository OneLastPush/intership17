var bodyParser = require('body-parser');
var sqlBuilder = require('../../src/qa/qa_component_sql_builder_controller');
var parseUrlencoded = bodyParser.urlencoded({extended: false});
var controller = require('../../src/qa/qa_component_details_controller');

module.exports.setRoutes = function(app){
	// GET
	app.get('/qa/component/getCategories', getCategories);

	// POST
	app.post('/qa/component/saveNewComponent', saveNewComponent);
	app.post('/qa/component/updateComponent', updateComponent);
	app.post('/qa/component/process_sql', processSQL);
}

// SQL builder routes
function processSQL(request, response) {
	console.log("IN processSQL FUNC");
	var sql = request.body.sql;
	sqlBuilder.processSQL(sql, function(err, result, tablename) {
		if (err) {
			response.status(501).send(err);
		} else {
			result[result.length] = tablename;
			response.send(result);
		}
	});
}

// Component builder/editor
function getCategories(req, res){
	console.log("IN getCategories FUNC");
	controller.getCategories(function(error, results){
		if(error){
			console.log('Error in getCategories: ' + error);
			// TODO: should I send back any server errors?
		} else {
			res.status(200).send(results);
		}
	});
}

function saveNewComponent(req, res){
	console.log("IN saveNewComponent FUNC");
	controller.saveNewComponent(req.body.component, function(error, validationErrors, results){
		if(error){
			console.log('Error in saveNewComponent: ' + error);
			// TODO: should I send back any server errors?
		} else if (validationErrors) {
			res.status(400).send(validationErrors);
		} else {
			res.status(200).send(results);
		}
	});
}

function updateComponent(req, res){
	console.log("IN updateComponent FUNC");
	controller.updateComponent(req.body.component, function(error, validationErrors, results){
		if(error){
			console.log('Error in updateComponent: ' + error);
			// TODO: should I send back any server errors?
		} else if (validationErrors) {
			res.status(400).send(validationErrors);
		} else {
			res.status(200).send(results);
		}
	});
}

// FIXME NOT YET IMPLEMENTED
// Component Viewer routes
function getCategoriesAndComponents(request, response){
	db.getCategoriesWithComponents(function(error, cats){
		if(error){
			response.status(500).send(error);
		}
		else {
			response.status(200).json( {CATEGORIES: cats} );
		}
	})
}

/**
 * Handler function that responds with the complete list of Components.
 * @param {Request}
 * @param {Response}
 */
function getComponentsFromDB(request, response){}

/**
 * Handler function that adds a new Component object from the client
 * to the database, then responds with the newly added object.
 * @param {Request}
 * @param {Response}
 */
function addComponentToDB(response, request){
	// Retrieve the Component Object from the request body.
	var newComponent = request.body.COMPONENT;

	// If the component exists, proceed.
	if(newComponent){
		db.addComponent(newComponent, function(error, comp){
			if(error){
				response.status(500).json(error);
			}
			else {
				response.status(200).json({ COMPONENT: comp });
			}
		});
	}
	// Else, send an error back.as part of a request.
	else {
		response.status(400).send(); // How do I use a request bundle here???
	}
}

/**
 * Handler function that removes a Component from the database
 * indicated by the client with an ID.
 * @param {Request}
 * @param {Response}
 */
function removeComponentFromDB(request, response){
	// Retrieve the component ID from the request body.
	var componentObj = request.body.COMPONENT;

	// If the ID exists, proceed with the operation.
	if(componentObj){
		db.removeComponent(componentObj, function(error, result){
			if(error){
				response.status(500).send(error);
			}
			else {
				response.status(200).send({ COMPONENT: result });
			}
		});
	}
	else {
		response.send(400).end();
	}
}

/**
 * Handler function that responds with the complete list of Categories.
 * @param {Request}
 * @param {Response}
 */
function getCategoriesFromDB(request, response){
	db.getCategories(function(error, categoriesArray){
		if(error){
			response.status(500).send(error).end();
		}
		else {
			response.status(200).json({ CATEGORIES: categoriesArray }).end();
		}
	});
}

/**
 * Handler function that adds a new component Category object from the client
 * to the database, then responds with the newly added object.
 * @param {Request}
 * @param {Response}
 */
function addCategoryToDB(request, response){
	// Retrieve the Component Object from the request body.
	var categoryName = request.body.NAME;
	console.log(categoryName);

	// If the category exists, proceed.
	if(categoryName){
		db.addCategory(categoryName, function(error, cat){
			if(error){
				console.error(error.message);
				response.status(500).send(error).end();
			}
			else {
				response.status(200).json({ CATEGORY: cat }).end();
			}
		});
	}
	// Else, send an error back.as part of a request.
	else {
		response.status(400).end(); // How do I use a request bundle here???
	}
}

/**
 * Handler function that removes a component Category from the database
 * indicated by the client with an ID.
 * @param {Request}
 * @param {Response}
 */
function removeCategoryFromDB(request, response){
	// Retrieve the category ID from the request body.
	var categoryObj = request.body.CATEGORY;

	// If the ID exists, proceed with the operation.
	if(categoryObj){
		db.removeCategory(categoryObj, function(error, result){
			if(error){
				response.status(500).end();
			}
			else {
				response.status(200).send({ CATEGORY: result }).end();
			}
		});
	}
	else {
		response.status(400).end();
	}
}
