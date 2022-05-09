/**
* Makes a .row (div with class row) element.
* Makes text input fields called varName and varValue.
* Also adds an X for deleting the variable
*
* @param eleIdentifier string that JQuery can use to identify an element. ei #id
* @author Ganna Shmatova
*/
function addVariable(eleIdentifier){
	var row = $('<div>',{
		'class': 'panel-body medium-padding'
	});

	var $col1 = $('<div>', {
		"class": "col-xs-5 no-padding"
	});
	var varName = $('<input>', {
		type: 'text',
		name: 'varName',
		placeHolder: 'Name',
		autocomplete: 'off',
		"class": "form-control"
	});
	$col1.append(varName);

	var $col2 = $('<div>', {
		"class": "col-xs-7 no-padding input-group"
	});
	var varValue = $('<input>', {
		type: 'password',
		name: 'varValue',
		placeHolder: 'Value',
		autocomplete: 'off',
		"class": "form-control"
	});

	var deleter = $('<span>', { //span with delete event and x
		"class": "hover-highlight input-group-addon"
	});
	deleter.click(function(){ //delete event action
		row.remove();
	});
	deleter.append($('<span>', { //x icon
		"class": "fa fa-times"
	}));

	$col2.append(varValue);
	$col2.append(deleter);


	//combine all the things
	row.append($col1);
	row.append($col2);
	//row.append(deleter);

	var parent = $(eleIdentifier);
	parent.append(row); //add to DOM
}
