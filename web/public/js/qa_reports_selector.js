/**
 * JS file responsible for managing the Reports Selector area. It sends out
 * requests for the retrieval of Report Categories and Templates, and updates
 * them, adding and/or deleting items.
 * 
 * @author Jacob Brooker
 * @version 2.0.0 - April 28th, 2017
 */

// Global object for storing all variables.
var rs = {};
// Array for holding all Report Categories.
var rs.categories = [];
// Array for holding all Report Template Names.
var rs.templateNames = [];
// Object for holding all saved DOM Elements.
var rs.el = {};
// Selector object.
var selector = {};


function init(){
	initializeReportElementVars();

	// Create a Selector object that will manage and maintain the visuals of the selector area.
	selector = new GroupSelector('#reports-selector', rs.categories, rs.el, rs.templateNames);

	// Hide the action buttons by default.
	rs.el.deleteCategoryBtn.hide();
	rs.el.deleteItemBtn.hide();

	// Click event for starting a new component.

	// Add Events for Deleting Report Templates.
	rs.el.deleteItemBtn.click(deleteReportTemplateRequest);
	
	// Add Events for Adding/Deleting Report Categories.
	rs.el.addCategoryBtn.click(addReportCategoryRequest);
	rs.el.deleteCategoryBtn.click(deleteReportCategoryRequest);

	// Fetch the Report Templates and their Categories.
	getReportCategoriesRequest();
}



/**
 * Places all important DOM elements that will be
 * manipulated into the object cv.el.
 */
function initializeReportElementVars(){
	// Delete buttons:
	rs.el.deleteCategoryBtn = $('#rs-delete-category-btn');
	rs.el.deleteItemBtn = $('#rs-delete-template-btn');

	// Search form elements:
	rs.el.searchForm = $('#rs-search-box > form');
	rs.el.searchBtn = $('#rs-search-template-btn');
	rs.el.searchInput = $('#rs-search-tempate-input');

	// New Component Button:
	rs.el.newTemplateBtn = $('#rs-new-tempate-btn');

	// Add Category elements:
	rs.el.addCategoryForm = $('#rs-add-category-btn');
	rs.el.addCategoryBtn = $('#rs-add-category-btn');
	rs.el.addCategoryInput = $('#rs-add-category-input');

	// Lists of items:
	rs.el.allItems = $('.rs-template-item');
	rs.el.allCategories = $('.rs-category-item');

	rs.el.categoryList = $('#rs-category-list');
	rs.el.categoryListBox = $('#rs-category-list-box');
}


/**
 * Retrieves the list of all Report Categories, with all their
 * Templates, using an AJAX request.
 */
function getComponentCategoriesRequest(){
	$.ajax({
		url: 'qa_module/reports_selector/categories_and_templates',
		method: 'GET',
		success: initializeTemplates,
		error: displayErrorDialog
	});
}


/**
 * Creates an element within the category list for each category,
 * and child elements for all its Templates.
 */
function initializeTemplates(json){
	// Save the array of categories.
	cv.categories = json.CATEGORIES;
	// Add each Category to the DOM's CategoryList
	cv.categories.forEach(function(cat){
		// Create category element.
		var catEl = selector.createCategoryElement(cat.CATEGORY_ID, cat.NAME);
		// Create an element for each child component
		// and append it to the Category.
		var ul = catEl.find('ul').first();
		cat.COMPONENTS.forEach(function(template){
			var templateEl = selector.createItemElement(
				template.TEMPLATE_ID, template.CATEGORY_ID, template.NAME);
			ul.append(templateEl);
			cv.templateNames.push(template.NAME);
		});
		// Append the catEl to the list.
		selector.addCategoryElement(catEl);
	});
}


/**
 * Saves a Report Template, and adds it into
 * the category list within the list.
 * @param {Object} json
 */
function addReportTemplate(json){
	// Retrieve the component object.
	var template = json.TEMPLATE;
	// Save the component into the categories array.
	cv.categories.forEach(function(cat){
		if(cat.CATEGORY_ID == template.CATEGORY_ID)
			cat.TEMPLATES.push(template);
	});
	// Add the component to the DOM's Category list
	var templateEl = createComponentListElement(template);
	selector.addItemElement(templateEl, template.CATEGORY_ID);
}


/**
 * Makes a request to Add a new Category.
 */
function addReportCategoryRequest(){
	// Retrieve the name in the input field.
	var catName = $('#cv-add-category-input').val();
	
	// Send the request with the name.
	$.ajax({
		url: 'qa_module/reports_selector/category',
		method: 'PUT',
		data: {NAME: catName},
		error: displayErrorDialog,
		success: addReportCategory
	});
}


/**
 * Saves a category, and adds it to the list.
 * @param {Object} json
 */
function addReportCategory(json){
	// Retrieve the Category object.
	var category = json.CATEGORY;
	// Save the category
	cv.categories.push(category);
	// Create an element for it, and append to the list.
	var el = selector.createCategoryElement(category.CATEGORY_ID, category.NAME);
	selector.addCategoryElement(el);
	// Scroll to the bottom of the box.
	scrollContainerTo(cv.el.categoryListBox, el);
}


/**
 * Makes a request to Delete a Report Template.
 */
function deleteReportTemplateRequest(){
	buildConfirmModal(function(confirm){
		if(confirm){
			// Retrieve the selected component.
			var id = selector.getSelectedItemID();
			var component = findComponentInArray(id);
			// If a component is selected...
			if(component){
				$.ajax({
					url: 'qa_module/reports_selector/component',
					method: 'DELETE',
					data: {COMPONENT: component},
					error: displayErrorDialog,
					success: deleteReportComponent,
				});
			}
		}
	});
}


/**
 * Removes the Report Template found within a JSON from the DOM.
 * @param {Object} json
 */
function deleteReportTemplate(json){
	var component = json.COMPONENT;
	// Remove the component from the saved categories.
	cv.categories.forEach(function(cat){
		removeFromArray(component, cat.COMPONENTS); // Removes, if it exists.
	});
	// Remove the component from the DOM.
	selector.removeItemElement(component.COMPONENT_ID);
}


/**
 * Makes a request to Delete a Category.
 */
function deleteReportCategoryRequest(){
	buildConfirmModal(function(confirm){
		if(confirm){
			// Retrieve the selected category.
			var id = selector.getSelectedCategoryID();
			var category = findCategoryInArray(id);
			// If a category is selected...
			if(category){
				$.ajax({
					url: 'qa_module/reports_selector/category',
					method: 'DELETE',
					data: {CATEGORY: category},
					error: displayErrorDialog,
					success: deleteReportCategory,
				});
			}
		}
	});
}

/**
 * Removes the category found within a JSON from the DOM.
 * @param {Object} json
 */
function deleteReportCategory(json){
	var category = json.CATEGORY;
	// Remove the categories from the saved list.
	removeFromArray(category, cv.categories);
	// Remove the component from the DOM.
	selector.removeCategoryElement(category.CATEGORY_ID);
}


/**
 * Returns the category from the categories array with
 * the matching ID passed as a parameter.
 * @param {int} id
 */
function findCategoryInArray(id){
	// Return the first matching category.
	var match = null;
	cv.categories.forEach(function(cat){
		if(cat.CATEGORY_ID === +id)
			match = cat;
	});
	// No Category was found.
	return match;
}


/**
 * Returns the template from the categories array with
 * the matching ID passed as a parameter.
 * @param {int} id
 */
function findTemplateInArray(id){
	// Return the first matching component.
	var match = null;
	cv.categories.forEach(function(cat){
		cat.COMPONENTS.forEach(function(template){
			if(template.TEMPLATE_ID === +id)
				match = template;
		});
	});
	return match;
}


$(document).ready(init);