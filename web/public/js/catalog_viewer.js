/**
* Reads XML & displays it with XMLTree plugin.
* 
* Requires:
* 	partition.js for populating the partition select box.
*	formHelpers.js for decoding URL GET data.
*	varDatabases.js
* 
* @author Ganna Shmatova
* @version 2.0.0
**/

$(window).load(function(){
	$('#catalogForm').submit(function(e){
		e.preventDefault();
		var $btn = $('#catalogForm :submit');
		$.ajax({
			url: '/emm/app/catalog/export',
			data: {
				catFile: $('#catFile').val(),
				partition: $('#partition').val()
			},
			dataType: 'text',
			success: function(xml){
				var $container = $('#catalogXML');
				$container.empty();
				new XMLTree({
					xml: xml,
					container: $container[0]
				});
			},
			complete: function(){
				$btn.button('reset');
			}
		});
		$btn.button('loading');
	});
	autoFill();
});
function autoFill(){
	var query = queryString.parse(window.location.search);
	var filePath = query.file;
	var partition = query.partition;
	if(filePath !== null && filePath !== undefined){
		$('#catFile').val(filePath);
		$('#partition').val(partition);
		$('#catalogForm').submit();
	}
}