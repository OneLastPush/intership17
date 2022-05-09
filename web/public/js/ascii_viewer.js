/**
* ASCII file viewing functionalities.
*
* Requires:
*	partitions.js
*	FormHelpers.js
*	RawFileViewer.js
*		Refresher.js
*		Progress.js
* 
* @author Ganna Shmatova (2014)
* @version 2.0.0
**/

$(window).load(function(){

	var rawFileViewer = new RawFileViewer({
		getHead: {
			url : hostServer + '/file/lines',
			getData: function(){
				return $('#fileSelect').serialize() + '&action=head';
			}
		},
		getTail: {
			url : hostServer + '/file/lines',
			getData: function(){
				return $('#fileSelect').serialize() + '&action=tail';
			}
		},
		getWhole: {
			url : hostServer + '/file/lines',
			getData: function(){
				return $('#fileSelect').serialize() + '&action=whole';
			}
		}
	});

	$('#viewer').append(rawFileViewer.container);
	$('#path').on('change', rawFileViewer.start); //changing values gets file
	
	var query = queryString.parse(window.location.search);
	var path = query.path;
	if(path !== null){ //if file was givne through a GET
		$('#path').val(path); //set as active file
		$('#path').trigger('change');
	}
});