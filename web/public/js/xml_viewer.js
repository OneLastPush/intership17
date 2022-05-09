/**
* Loads XML file & displays it with XMLTree plugin.
* 
* Requires:
*	formHelpers.js for decoding URL GET data.
* 
* @author Ganna Shmatova
* @version 2.1.0
**/

/**
* Gets file contents from the backend server and displays the results in
* the XMLTree plugin.
* 
* @param eleIdentifier Form JQuery identifier. Form will be serialized and sent to server.
* @param eleIdentifier2 div JQuery Identifier. Div will be cleared and the XML tree will be made inside of it.
*/
function readXML(eleIdentifier, eleIdentifier2){
	var submitBtn = $(eleIdentifier + ' input[type="submit"]');
	submitBtn.button('loading');
	$.ajax({
		url : hostServer + '/browse/download',
		data : $(eleIdentifier).serialize(),
		dataType: 'text',
		success: function(data){
			$(eleIdentifier2).off().empty(); //clear old data, if any
			new XMLTree({ //run xml tree to create
				xml: data,
				container: eleIdentifier2
			});
		},
		complete: function(){
			submitBtn.button('reset');
		}
	});
}

/**
* Sets up form (with validated filePath and makes sure it's .xml).
* Autofills form values from GET in URL. Runs form if autofilled.
*/
$(window).load(function(){
	var form = '#xmlViewer';

	$(form).submit(function(event){
		event.preventDefault();
		if(isRequiredFilled(form) && validate($(form + ' input[name="filePath"]'), function(){
			return !$(this).val().match(/\.xml$/i); //file ends in .xml
		})){
			readXML(form, '#XMLdiv');
		}
	});

	//autofills fields
	var query = queryString.parse(window.location.search);
	var path = query.path;
	if(path){
		$('#path').val(path);
		$(form).submit();
	}
});