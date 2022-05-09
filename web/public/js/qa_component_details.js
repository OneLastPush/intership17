// Global variables
var g = {};

// ---- On Ready Function ----
$(document).ready(function(){
	// Setting up variables
	// g.types = [loc.js.static, loc.js.dynamic, loc.js.strategic];
	g.types = [loc.js.static];

	// Placeholder for component, can hold either new(blank) component or current component
	g.component = {};

	populateFields();
	setupEventListeners();
});

/**
 * This function sets up all the event listeners
 * for the component details.
 */
function setupEventListeners(){
	// Form inputs
	$('#comp-name').blur(function(e){
		e.preventDefault();
		var err = validateName();
		if (err){
			 $.growl.error({ message: err });
		}
	});
	$('#comp-description').blur(function(e){
		e.preventDefault();
		var err = validateDescription();
		if (err){
			$.growl.error({ message: err });
		}
	});
	$('#comp-category').blur(function(e){
		e.preventDefault();
		var err = validateCategory();
		if (err){
			$.growl.error({ message: err });
		}
	});
	$('#comp-type').blur(function(e){
		e.preventDefault();
		var err = validateType();
		if (err){
			$.growl.error({ message: err });
		}
	});
}

function populateTypeDropdown(){
	var type = $('#comp-type');
	type.detach();
	$.each(g.types, function(index, value){
		type.append('<option>' + value + '</option>');
	});
	type.insertAfter('#type-label');
}

function populateFields(){
	$('#comp-author').val($.session.get('username'));

	populateTypeDropdown();
	populateCategoryDropdown();
}

function populateCategoryDropdown(){
	sendGetCategoriesRequest(function(responseList){
		var categories = $.map(responseList, function(category, index){
			return category.NAME;
		})
		console.log(categories);
		setUpAutocomplete($('#comp-category'), categories);
	});
}

// ---- Event Handlers ----
function saveDetails(e){
	e.preventDefault();
	console.log('Saving details.')
	// Validating fields before sending request
	if (validateAllDetailFields()){
		if (g.component.COMPONENT_ID){
			sendUpdateRequest();
		} else {
			sendSaveRequest();
		}
	}
}

function showGroupModal(e){
	e.preventDefault();

	// Show group modal
	$('#groupModal').modal({backdrop: 'static', keyboard: false});
}

// ---- Ajax Requests ----
/**
 * Saves the component on the database.
 *
 * Receives saved component for display.
 */
function sendSaveRequest(){
	retrieveComponentData();
	console.log('Sending save request.');
	console.log(g.component);
	$.ajax('/qa/component/saveNewComponent', {
		data : {'component' : g.component },
		success : processResult,
		dataType : 'json',
		method : 'POST',
		error : displayServerErr,
		beforeSend : displayAnimation
	});
}

/**
 * Updates the component on the database.
 *
 * Receives updated component for display.
 */
function sendUpdateRequest(){
	retrieveComponentData();
	console.log('Sending update request.');
	$.ajax('/qa/component/updateComponent', {
		data : {'component' : g.component},
		success : processResult,
		dataType : 'json',
		method : 'post',
		error : displayServerErr,
		beforeSend : displayAnimation
	});
}

function processResult(result){
	getComponentCategoriesRequest();
	displayComponentDetails(result);
}

/**
 * Retrieves list of categories.
 */
function sendGetCategoriesRequest(callback){
	$.get('/qa/component/getCategories', function(response){
		callback(response);
	});
}

// ---- Helper Functions ----
function enableSaveButton(text, clickfn){
	$('#save').off();
	$('#save').html(text);
	$('#save').click(clickfn);
	$('#save').prop('disabled', false);
}

function retrieveComponentData(){
	g.component.NAME = $('#comp-name').val();
	g.component.DESCRIPTION = $('#comp-description').val();
	g.component.CATEGORY = $('#comp-category').val();
	g.component.TYPE = $('#comp-type').val();

	// The field saved will be determined on server side.
	g.component.AUTHOR = $.session.get('username');
	g.component.UPDATED_BY = $.session.get('username');
}

/**
 * This method validates all the fields, and displays an alert containing
 * all error messages if they exist.
 *
 * @return boolean - true if there are no errors
 */
function validateAllDetailFields(){
	var checklist = [];
	var errors = [];

	checklist.push(validateName());
	checklist.push(validateDescription());
	checklist.push(validateCategory());
	checklist.push(validateAuthor());
	checklist.push(validateType());

	$.each(checklist, function(index, value){
		if (value){
			errors.push(value);
		}
	});

	if (errors.length != 0){
		console.log(errors);
		displayErrMsgs(errors);
	} else {
		return true;
	}
}

function displayErrMsgs(messageArray){
	messageArray.forEach(function(msg){
		$.growl.error({ message: msg });
	});
}

// Errors will be in an array format
function displayServerErr(request, errorType, errorMessage){

	$('#animation-layer').prop('hidden', true);
	$('#form-layer').prop('hidden', false);

	messages = $.map(errorMessage, function(value, index){
		return loc.js.err[value];
	});
	displayErrMsgs(messages);
}

/**
 * This method saves the given component as the current one
 * and displays its details on the form.
 *
 * @param newComponent - The component to be displayed
 */
function displayComponentDetails(newComponent){
	$('#animation-layer').prop('hidden', true);
	$('#form-layer').prop('hidden', false);
	g.component = newComponent;

	$('#comp-name').val(g.component.NAME);
	$('#comp-description').val(g.component.DESCRIPTION);
	$('#comp-author').val(g.component.CREATED_BY);
	$('#comp-category').val(g.component.CATEGORY);
	$('#comp-type').val(g.component.TYPE);
	// sql builder area
	$('#sql').val(g.component.QUERY);

	// Prevent user from testing sql unless it has changed
	$('#test').prop('disabled', true);
	enableSaveButton(loc.js.save, saveDetails);
}

/**
 * This method empties all the component fields
 * on the form and reinitializes the current component.
 */
function clearForm(){
	g.component = {};

	// Unselect all items in the component viewer
	setUnselectedForAllItems(cv.el.categoryList);
	cv.el.deleteCategoryBtn.hide();
	cv.el.deleteItemBtn.hide();

	// Clean up any error/success messages
	$('#error-panel').html('');

	// Empty the form fields
	$('#comp-name').val('');
	$('#comp-description').val('');
	$('#comp-author').val($.session.get('username'));
	$('#comp-category').val('');
	$('#comp-type').val(g.types[0]);
	// sql builder area
	$('#sql').val('');

	// Make sure buttons are properly enabled / disabled
	$('#test').prop('disabled', false);
	$('#save').prop('disabled', true);

	$('#comp-name').focus();
}

// ---- Validators ----

/**
 * This method validates the name field, and adds any
 * error messages to the error array.
 *
 * @return err - The error to be displayed
 */
function validateName(){
	var name = $('#comp-name').val();

	if (!name){
		return loc.js.err.nullName;
	} else if (name.length > 256) {
		return loc.js.err.nameLength;
	}
}

/**
 * This method validates the description field, and adds any
 * error messages to the error array.
 *
 * @param err - The array of errors to be displayed
 */
function validateDescription(){
	var description = $('#comp-description').val();

	if (!description){
		return loc.js.err.nullDesc;
	} else if (description.length > 256) {
		return loc.js.err.descLength;
	}
}

/**
 * This method validates the author field, and adds any
 * error messages to the error array.
 *
 * @param err - The array of errors to be displayed
 */
function validateAuthor(){
	var author = $('#comp-author').val();

	if (!author){
		return loc.js.err.nullAuthor;
	} else if (author.length > 256) {
		return loc.js.err.authorLength;
	}
}

/**
 * This method validates the category field, and adds any
 * error messages to the error array.
 *
 * @param err - The array of errors to be displayed
 */
function validateCategory(){
	var category = $('#comp-category').val();

	if (!category){
		return loc.js.err.nullCat;
	} else if (category.length > 256) {
		return loc.js.err.catLength;
	}
}

/**
 * This method validates the category field, and adds any
 * error messages to the error array.
 *
 * @param err - The array of errors to be displayed
 */
function validateType(){
	var type = $('#comp-type').val();

	if (!type){
		return loc.js.err.nullType;
	} else if ($.inArray(type, g.types) == -1){
		return loc.js.err.invalidType;
	}
}

function displayAnimation(){
	$('#animation-layer').prop('hidden', false);
	$('#form-layer').prop('hidden', true);
}
