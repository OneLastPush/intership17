/**
* Makes 2 .row divs one with the data source input, and an X for deleting both rows.
* The second row is for the username and password.
* Appends these rows to the provided JQuery element.
* 
* @param eleIdentifier string that JQuery can use to identify an element. ei #id
* @author Ganna Shmatova
*/
function addDatabase(eleIdentifier){
	var $container = $('<div>',{
		'class': 'panel-body medium-padding'
	});
	$(eleIdentifier).append($container);


	//rows
	var $igroup = $('<div>',{
		'class': 'input-group'
	});

	//1st row contents
	var src = $('<input>', { //data source
		type: 'text',
		name: 'dataSource',
		placeHolder: 'Database source',
		"class": "form-control"
	});

	var deleter = $('<span>', { //span with delete event and x
		"class": "hover-highlight input-group-addon"
	});
	deleter.click(function(){ //delete event action
		$container.off().remove();
	});
	deleter.append($('<span>', { //x icon
		"class": "fa fa-times"
	}));
	deleter.tooltip({title: loc.remove});

	$igroup.append(src);
	$igroup.append(deleter);

	var $col1 = $('<div>', {
		"class": "col-xs-6 no-padding"
	});
	var user = $('<input>', { //database username
		type: 'text',
		name: 'dbUser',
		placeHolder: 'Database username',
		autocomplete: "off",
		"class": "form-control"
	});
	$col1.append(user);

	var $col2 = $('<div>', {
		"class": "col-xs-6 no-padding"
	});
	var password = $('<input>', { //database password
		type: 'password',
		name: 'dbPassword',
		placeHolder: 'Database password',
		autocomplete: "off",
		"class": "form-control"
	});
	$col2.append(password);

	//add the rows to te given element
	$container.append($igroup);
	$container.append($col1);
	$container.append($col2);
}