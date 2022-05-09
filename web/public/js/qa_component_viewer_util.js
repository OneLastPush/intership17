/**
 * A client JS file responsible for providing utility methods for
 * the Reports and Componet Viewers.
 * @author Jacob Brooker
 * @version 1.0.0 - April 27th, 2017
 */


/**
 * Set up function that overwrites the search form submit event
 * to display the searched item within a group/category.
 * @param {DOM Element} form
 * @param {DOM Element} inputEl
 * @param {String} searchable
 * @param {Callable} execFunc
 */
function setUpGroupSearchForm(form, inputEl, searchable, execFunc){
	// Define the search submit event.
	form.submit(function(e){
		e.preventDefault();

		// Get the search key
		var input = inputEl.val();

		// If they inputted anything...
		if(input.length > 0){
			// Retrieve the matching component.
			var searchedElement = $(searchable).filter(function(){
				return $(this).find('p').first().text() === input;
			}).first();

			// If the component exists...
			if(searchedElement){
				execFunc(searchedElement);
			}
		}
	});
}


/**
 * Toggles the sliding of a specified group Element.
 * @param {DOM Element} el
 */
function toggleGroupSlide(el){
	el.find('ul').slideToggle();

	// Toggle the caret
	var chev = el.find('.glyphicon').first();
	chev.toggleClass('glyphicon-chevron-down').toggleClass('glyphicon-chevron-up');
}


/**
 * Toggles the sliding of a specified group Element.
 * @param {DOM Element} el
 */
function groupSlideDown(el){
	el.find('ul').slideDown();

	// Toggle the caret
	var chev = el.find('.glyphicon').first();
	chev.addClass('glyphicon-chevron-up').removeClass('glyphicon-chevron-down');
}


/**
 * Sets up an autocomplete feature for an input element
 * using a specified array of strings.
 * @param {DOM Element} el
 * @param {Array} array
 */
function setUpAutocomplete(el, array){
	$(el).autocomplete({
		source: array,
		delay: 100,
		position: { of : el, my : 'right top', at : 'right bottom'},
		// appendTo : el
	});
}


/**
 * Removes an item from an array.
 * @param {Object} item
 * @param {Array} array
 */
function removeFromArray(item, array){
	var removed = false;

	var index = array.indexOf(item);
	if(index > -1){
		array.splice(index, 1);
		removed = true;
	}

	return removed;
}


/**
 * Returns all elements with the specified value for an attribute.
 * @param {String} selector
 * @param {String} attr
 * @param value
 */
function getElementsWithAttr(selector, attr, value){
	return $(selector).filter(function(){
		return $(this).attr(attr) == value;
	});
}


/**
 * Returns all selected elements.
 * @param {String} selector
 */
function getSelectedElements(selector){
	// Retrieve the ID of the selected category
	return $(selector).filter(function(){
		return $(this).attr('data-selected') === 'true';
	});
}


/**
 * Scrolls a given element to the position of another parent element.
 * @param {DOM Element} scrollable
 * @param {DOM Element} el
 */
function scrollContainerTo(scrollable, el){
	scrollable.scrollTop(el.position().top); // Made need to update.
}


/**
 * Display a message to screen for any given error.
 * @param {Request} request
 * @param {String} status
 * @param {String} errorThrown
 */
function displayErrorDialog(request, status, errorThrown){
	// Display the error message in a pop-up dialog.
	var message = loc.js.err[request.responseText];
	var dialog = buildErrorModal(message);
	dialog.modal();
}


function buildErrorModal(message){
	// Container
	var modal = $('<div id="cv-error-modal"></div>')
		.addClass('modal').addClass('modal-sm').addClass('cv-modal');
	// Content
	var content = $('<div></div>').addClass('modal-content');
	// Header
	var header = $('<div></div>').addClass('modal-header');
	// Body
	var body = $('<div></div>').addClass('modal-body').append('<p>' + message + '</p>');
	// Close button
	var closeBtn = $('<button type="button" class="close" data-dismiss="modal">&times;</button>');
	closeBtn.click(function(){
		$('#cv-error-modal').modal('hide').remove();
	});
	// Append the items.
	header.append(closeBtn).append('<h3>' + loc.js.error + '</h3>');
	content.append(header).append(body);
	modal.append(content);

	return modal;
}

function buildConfirmModal(callback){
	// Container
	var modal = $('<div id="cv-confirm-modal"></div>')
		.addClass('modal').addClass('modal-sm').addClass('cv-modal');
	// Content
	var content = $('<div></div>').addClass('modal-content');
	// Header
	var header = $('<div></div>').addClass('modal-header');
	// Body
	var body = $('<div></div>').addClass('modal-body');
	// Close Button:
	var close = $('<button type="button" class="close" data-dismiss="modal">&times;</button>');
		//.addClass('btn').addClass('btn-default');
	close.click(function(){
		callback(false);
		modal.modal('hide').remove();
	});
	var cancel = $('<button>'+ loc.js.cancel +'</button>').addClass('btn').addClass('btn-default');
	cancel.click(function(){
		callback(false);
		modal.modal('hide').remove();
	});
	// Continue Button:
	var confirm = $('<button>'+ loc.js.confirm +'</button>').addClass('btn').addClass('btn-primary');
	confirm.click(function(){
		callback(true);
		modal.modal('hide').remove();
	});
	// Append the items.
	header.append(close).append('<h3>' + loc.js.areYouSure + '</h3>');
	body.append(confirm).append(cancel);
	content.append(header).append(body);
	modal.append(content);
	$('#topPanel').append(modal);
	// Display the modal.
	modal.modal();
}


/**
 * Selects the one item from all list items in
 * a group of elements within a class.
 * @param {DOM Element} el
 */
function selectItem(el, context){
	var selected = el.attr('data-selected');
	if(selected === 'false'){
		setUnselectedForAllItems(context);
		setSelectedForItem(el);
	}
}

/**
 * Sets a passed Element to 'selected',
 * and un-selects all previously selected elements.
 * @param {DOM Element}
 */
function setSelectedForItem(el){
	// Set the element to be 'selected'.
	el.attr('data-selected', true);
	el.addClass('cv-selected', true);
}


/**
 * Sets all selected elements to unselected.
 */
function setUnselectedForAllItems(context){
	// Unselect all categories and components.
	var listItems = $(context).find('.cv-selected'); // Verify this
	listItems.removeClass('cv-selected');
	listItems.attr('data-selected', false);
}


function ajaxGetRequest(urlStr, dataObj, successCB, errorCB){
	$.ajax({
		url: urlStr,
		method: 'GET',
		data: dataObj,
		success: successCB,
		error: errorCB
	});
}