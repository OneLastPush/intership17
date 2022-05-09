/**
 * A client JS file responsible for managing the Component Viewer.
 * It sends out requests for the retrieval of lists of Categories and Components
 * and updates them, adding and/or deleting items.
 *
 * @author Jacob Brooker
 * @version 2.0.0 - April 20th, 2017
 */


/*	Example of Categories JSON:
	{ CATEGORIES: [
		CAT1:
			{ ..., COMPONENTS:
				[ COMP1: {}, COMP2: {}, ...]
			} ...
	]}
*/

// Global object responsible for holding information
// for retrieval later.
var cv = {};
// Array of each Category, including child Components
cv.categories = [];
// Array of every Component's Name.
cv.componentNames = [];
// Object for holding all saved DOM elements.
cv.el = {};

var selector = {};


/**
 * Initializes all the features of the Component Viewer.
 */
function init(){
	// Initialize all global variables for elements.
	initializeComponentElementVars();

	// Create a Selector object that will manage and maintain the visuals of the selector area.
	selector = new GroupSelector('#component-viewer', cv.categories, cv.el, cv.componentNames);

	// Add Event for creating a new Component.
	cv.el.newComponentBtn.click(clearForm);

	// Add Events for Deleting Components.
	cv.el.deleteItemBtn.click(deleteComponentRequest);

	// Add Events for Adding/Deleting Categories
	cv.el.addCategoryForm.submit(addComponentCategoryRequest);
	cv.el.addCategoryBtn.click(function(){
		cv.el.addCategoryForm.submit()
	});
	cv.el.deleteCategoryBtn.click(deleteComponentCategoryRequest);

	// Fetch the Components and their Categories.
	getComponentCategoriesRequest();
}


/**
 * Places all important DOM elements that will be
 * manipulated into the object cv.el.
 */
function initializeComponentElementVars(){
	// Delete buttons:
	cv.el.deleteCategoryBtn = $('#cv-delete-category-btn');
	cv.el.deleteItemBtn = $('#cv-delete-component-btn');

	// Search form elements:
	cv.el.searchForm = $('#cv-search-box > form');
	cv.el.searchBtn = $('#cv-search-component-btn');
	cv.el.searchInput = $('#cv-search-component-input');

	// New Component Button:
	cv.el.newComponentBtn = $('#cv-new-component-btn');

	// Add Category elements:
	cv.el.addCategoryForm = $('#cv-add-category-box > form');
	cv.el.addCategoryBtn = $('#cv-add-category-btn');
	cv.el.addCategoryInput = $('#cv-add-category-input');

	// Lists of items:
	cv.el.allComponents = $('.cv-component-item');
	cv.el.allCategories = $('.cv-category-item');

	cv.el.categoryList = $('#cv-category-list');
	cv.el.categoryListBox = $('#cv-category-list-box');

	cv.el.categoryLoadBox = $('#cv-category-list-box-cover');
}


/**
 * Retrieves the list of all Categories, with all their
 * Components, using an AJAX request.
 */
function getComponentCategoriesRequest(){
	selector.showLoading();

	$.ajax({
		url: 'qa_module/component_viewer/categories_and_components',
		method: 'GET',
		success: initializeComponents,
		error: displayErrorDialog
	});
}


/**
 * Creates an element within the category list for each category,
 * and child elements for all its components.
 */
function initializeComponents(json){
	cv.el.categoryList.empty();
	cv.componentNames.splice(0, cv.componentNames.length);
	// Save the array of categories.
	cv.categories = json.CATEGORIES;

	// Add each Category to the DOM's CategoryList
	cv.categories.forEach(function(cat){
		// Create category element.
		var catEl = selector.createCategoryElement(cat.CATEGORY_ID, cat.NAME);
		// Create an element for each child component
		// and append it to the Category.
		var ul = catEl.find('ul').first();
		cat.COMPONENTS.forEach(function(comp){
			var compEl = selector.createItemElement(comp.COMPONENT_ID, comp.CATEGORY_ID, comp.NAME);

			// Display the component in the editor pane when clicked.
			compEl.click(function(e){
				e.stopPropagation();
				displayComponentDetails(findComponentInArray(comp.COMPONENT_ID));
			});

			ul.append(compEl);
			cv.componentNames.push(comp.NAME);
		});

		// Append the catEl to the list.

		catEl.appendTo(cv.el.categoryList);
	});

	selector.showCategories();
}


/**
 * Function that performs the necessary actions for a searched component.
 * @param {DOM Element}
 */
function searchForComponent(compEl){
	// Select the parent category and extend it.
	var category = compEl.closest('.category-item');
	groupSlideDown(category);
	// Select it.
	compEl.click();
	// Scroll to the result, but first wait a fraction of a second.
	setTimeout(function(){
		scrollTo(cv.el.categoryListBox, category);
	}, 400);
}


/**
 * Returns a list item element for a passed category.
 * @param {Object}
 */
function createCategoryListElement(category){

	selector.showCategories();

	// Create a list item with the necessary data for future reference.
	var li = $('<li></li>');
	li.attr('data-category-id', category.CATEGORY_ID)
	li.attr('data-selected', false);
	li.addClass('category-item');

	// Title container.
	var titleContainer = $('<div></div>').addClass('category-title');

	// Create the Caret.
	var caret = ('<span class="glyphicon glyphicon-chevron-down caret-drop"></span>');

	// Create a 'p' tag with the name of the component,
	// and make sure it is initially hidden.
	var p = $('<p style="display:inline;"> ' + category.NAME + '<p>');

	// Create an unordered list within the category list item.
	var componentList = $('<ul></ul>').hide();

	// Append the components.
	titleContainer.append(caret).append(p);
	li.append(titleContainer).append(componentList);

	// Add the click event.
	li.click(function(e){
		selectItem(li, '.category-list');
		toggleGroupSlide(li);

		$('#delete-component-btn').hide();
		$('#delete-category-btn').show();
	});

	return li;
}

/**
 * Returns a list item element for a passed component.
 * @param {Object}
 */
function createComponentListElement(component){
	// Hide loading animation
	cv.el.categoryLoadBox.hide();
    cv.el.categoryListBox.show();

	// Create a list item with the necessary data for future reference.
	var li = $('<li></li>');
	li.attr('data-component-id', component.COMPONENT_ID);
	li.attr('data-category-id', component.CATEGORY_ID);
	li.attr('data-selected', false);
	li.addClass('component-item');

	// Create a 'p' tag with the name of the component.
	var p = $('<p>' + component.NAME + '<p>');

	// Append the components.
	p.appendTo(li);

	// Add the appropriate events
	li.click(function(e){
		e.stopPropagation();
		selectItem(li, '.category-list');
		// Call Edit action
		$('#delete-category-btn').hide();
		$('#delete-component-btn').show();

		// Display the component in the editor pane
		var compId = $(this).attr('data-component-id');
		displayComponentDetails(findComponentInArray(compId));
		selector.addCategoryElement(catEl);
	});

	selector.showCategories();
}


/**
 * Saves a component, and adds it into the category list
 * within the list.
 * @param {Object}
 */
function addComponent(json){
	// Retrieve the component object.
	var component = json.COMPONENT;

	// Save the component into the categories array.
	cv.categories.forEach(function(cat){
		if(cat.CATEGORY_ID == component.CATEGORY_ID)
			cat.COMPONENTS.push(component);
	});

	// Add the component to the DOM's Category list
	var compElement = createComponentListElement(component);
	selector.addItemElement(compElement, component.CATEGORY_ID);
}


/**
 * Makes a request to Add a new Category.
 */
function addComponentCategoryRequest(event){
	event.preventDefault();

	// Retrieve the name in the input field.
	var catName = $('#cv-add-category-input').val();

	// Send the request with the name.
	$.ajax({
		url: 'qa_module/component_viewer/category',
		method: 'PUT',
		data: {NAME: catName},
		error: displayErrorDialog,
		success: addComponentCategory
	});
}


/**
 * Saves a category, and adds it to the list.
 * @param {Object}
 */
function addComponentCategory(json){
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
 * Makes a request to Delete a Component.
 */
function deleteComponentRequest(){
	buildConfirmModal(function(confirm){
		if(confirm){
			// Retrieve the selected component.
			var id = selector.getSelectedItemID();
			var component = findComponentInArray(id);

			// If a component is selected...
			if(component){
				$.ajax({
					url: 'qa_module/component_viewer/component',
					method: 'DELETE',
					data: {COMPONENT: component},
					error: displayErrorDialog,
					success: deleteComponent,
				});
			}
		}
	});
}


/**
 * Removes the component found within a JSON from the DOM.
 * @param {Object}
 */
function deleteComponent(json){
	var component = json.COMPONENT;

	// Remove the component from the saved categories.
	cv.categories.forEach(function(cat){
		removeFromArray(component, cat.COMPONENTS); // Removes, if it exists.
	});

	// Remove the component from the DOM.
	selector.removeItemElement(component.COMPONENT_ID);

	// Removes the component from being displayed in the form
	clearForm();
}


/**
 * Makes a request to Delete a Category.
 */
function deleteComponentCategoryRequest(){
	buildConfirmModal(function(confirm){
		if(confirm){
			// Retrieve the selected category.
			var id = selector.getSelectedCategoryID();
			console.log(id);
			var category = findCategoryInArray(id);

			// If a category is selected...
			if(category){
				$.ajax({
					url: 'qa_module/component_viewer/category',
					method: 'DELETE',
					data: {CATEGORY: category},
					error: displayErrorDialog,
					success: deleteComponentCategory,
				});
			}
		}
	});
}

/**
 * Removes the category found within a JSON from the DOM.
 * @param {Object}
 */
function deleteComponentCategory(json){
	var category = json.CATEGORY;
	// Remove the categories from the saved list.
	removeFromArray(category, cv.categories);
	// Remove the component from the DOM.
	selector.removeCategoryElement(category.CATEGORY_ID);
}


/**
 * Returns the category from the categories array with
 * the matching ID passed as a parameter.
 * @param {int}
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
 * Returns the component from the categories array with
 * the matching ID passed as a parameter.
 * @param {int}
 */
function findComponentInArray(id){
	// Return the first matching component.
	var match = null;
	cv.categories.forEach(function(cat){
		console.log(cat);
		cat.COMPONENTS.forEach(function(comp){
			if(comp.COMPONENT_ID === +id)
				match = comp;
		});
	});
	return match;
}


$(document).ready(init);