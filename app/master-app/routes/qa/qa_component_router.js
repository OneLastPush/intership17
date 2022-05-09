/*	
 *	Router class for the QA Module
 *	@author Jacob Brooker
 *	@version 1.2 - April 17th, 2017
 */

// Create a router object.
var express = require('express');
var router = express.Router();

// Create an instance of the DB Component Functions JS obj.
var db = require('../../src/qa/qa_component_viewer_controller');


/**
 * Routing for Components and their Categories.
 */

// Route for '/categories_with_components'.
router.route('/categories_and_components')
	.get(getCategoriesAndComponents);

/**
 * Handler function that returns a JSON object with
 * a list of all Categories.
 * @param {Request} request
 * @param {Response} response
 */
function getCategoriesAndComponents(request, response){
	db.getCategoriesWithComponents(function(error, cats){
		if(error){
			response.status(422).send(error);
		}
		else {
			response.status(200).json( {CATEGORIES: cats} );
		}
	})
}

/**
 * Routing for Components
 */

// Routes for '/components'
router.route('/components')
	.get(getComponentsFromDB);

// Routes for '/component'
router.route('/component')
	.put(addComponentToDB)
	.delete(removeComponentFromDB);


/**
 * Handler function that responds with the complete list of Components.
 * @param {Request}
 * @param {Response}
 */
function getComponentsFromDB(request, response){
	db.getComponents(function(error, componentsArray){
		if(error){
			response.status(422).send(error).end();
		}
		else {
			response.status(200).json({ COMPONENTS: componentsArray }).end();
		}
	});
}


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
				response.status(422).json(error);
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
				response.status(422).send(error);
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
 * Routing for Categories
 */

// Routes for '/categories'
router.route('/categories')
	.get(getCategoriesFromDB);

// Routes for '/category'
router.route('/category')
	.put(addCategoryToDB)
	.delete(removeCategoryFromDB);

/**
 * Handler function that responds with the complete list of Categories.
 * @param {Request}
 * @param {Response}
 */
function getCategoriesFromDB(request, response){
	db.getCategories(function(error, categoriesArray){
		if(error){
			response.status(422).send(error).end();
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
				console.error(error);
				response.status(422).send(error).end();
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
				response.status(422).send(error).end();
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


// Export the router object.
module.exports = router;