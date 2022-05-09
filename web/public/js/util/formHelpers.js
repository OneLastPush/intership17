/**
* Reusable utility methods that are helpful in form functions.
* This file has an window.onload. Scroll to the bottom to see what it does.
*
* @author Ganna Shmatova
* @version 2.0.0
*/

/**
* Given an eleIdentifier for a list of dom items (ei, all .varName or all #yourForm :input),
* changes those DOM items' name to end in 0, then 1, then 2... onwards until out of elements.
* This is useful when you have a variable number of elements you want to submit to the backend.
*
* Don't forget to nameDenumerate after to bring your element's names back to the original.
*
* For example, if your javascript can add multiple database sources in a form
* or variable name & value inputs in a form. You could numerate them before serializing the
* form data.
* sameNumCount would be 2 for variable name & value. This is because you have 2 inputs with the
* same count -- varName and varValue would be varName0 and varValue0, then varName1 & varValue1.
* it would increment every 2 elements.
*
* @param list JQuery list of elements to change the name of
* @param sameNumCount optional. How many elements have to be renamed before number increments.
* @author Ganna Shmatova
*/
function nameNumerate(list, sameNumCount){
	if(!sameNumCount)
		sameNumCount = 1;

	for(var i = 0; i<list.length; i++){
		var $item = $(list[i]);
		$item.attr('name', $item.attr('name') + Math.floor(i/sameNumCount));
	}
}

/**
* Deletes the numbers at the end of the name attributes of the provided list of
* JQuery DOM elements.
*
* Built to be used in conjunction with nameNumerate, but does not have to be.
*
* @param list JQuery list of elements to change the name of
* @author Ganna Shmatova
*/
function nameDenumerate(list){
	for(var i = 0; i<list.length; i++){
		var $item = $(list[i]);
		var name = $item.attr('name');
		$item.attr('name', name.substr(0, name.search(/\d+$/)));
	}
}

/**
* Checks that every JQuery object's .required (class required) has a value.
*
* Uses the validate function.
*
* @params string prepend. JQuery selector in string form.
* @return boolean of true if everything has a value, or false.
* @author Ganna Shmatova
*/
function isRequiredFilled(prepend){
	if(typeof prepend == 'string')
		prepend = $(prepend);
	return validate(prepend.find('.required'), function(){
		if($(this).is('.bootstrap-select'))
			return;
		return !this.value;
	});
}

function isValidEmail(jqele){
	if(typeof jqele == 'string')
		jqele = $(jqele);
	return validate(jqele, function(){
		return !this.value.match(/\S+@\S+\.\S+/);
	});
}

/**
* Unsets errors, filters each element by the provided function
* and sets .error-background to all filtered DOM elements that
* return true.
*
* Use example:
* validate( $(prepend + ' .required'), function(){
*	return !this.value;
* });
* 'this' refers to the specific element being tested at that moment.
*
* @param jqEle jquery element with zero, one, or more DOM elements to validate
* @param filterFn function that will decide if this element is valid. Invalid elements return true
* @return boolean true if everything filtered to false.
* @author Ganna Shmatova
*/
function validate(jqEle, filterFn){
	jqEle.removeClass('error-background');
	var invalid = jqEle.filter(filterFn);
	invalid.addClass('error-background');
	return invalid.length === 0;
}

/**
* Gives red * to required labels.
* Required labels are found if they have a .reqLabel class.
* Also adds an on hover event on the asterisk that displays the message
* "Required field".
*
* @author Ganna Shmatova
*/
function doReqLabels(){
	var labels = $('.reqLabel');

	var label;
	for(var i=0; i<labels.length; i++){
		label = $(labels[i]);
		var asterisk = $('<span>', {
			text : "*",
			"data-toggle" : "tooltip",
			"data-placement" : "top",
			"data-trigger" : "hover",
			title : loc.js.reqField,
			"class" : "red medium-padding"
		});
		asterisk.tooltip();
		label.append(asterisk);
	}
}

/**
* On page load/automatically, gives red * to required labels.
* Required labels have the class .reqLabel.
*
* Also activates selectpicker.
*
* @author Ganna Shmatova
*/
$(window).load(function() {
	doReqLabels();
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		$('.selectpicker').selectpicker("mobile");
	} else {
		$('.selectpicker').selectpicker();
	}
});
