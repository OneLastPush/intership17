/*	
 *	Router class for the QA Module
 *	@author Jacob Brooker
 *	@version 1.0 - April 20th, 2017
 */

// Create a router object.
var express = require('express');
var router = express.Router();

// Add the routing for the Component Viewer
var componentRouter = require('./qa_component_router');
router.use('/component_viewer', componentRouter);

// Export the router object.
module.exports = router;