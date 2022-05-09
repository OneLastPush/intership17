/**
*
* Requires:
* 	partition.js for populating the partition select box.
*	formHelpers.js for decoding URL GET data & validating.
* 	fileChecker.js for validating if the flowchart file path exists
*	varDatabases.js for database source selection
*	varVariables.js for providing run variables
*	runAjax.js for communicating with backend server
*
* @author Ganna Shmatova
* @version 2.0.0
**/

/**
* Sends to server a serialized run form using ajax.
* Numerates and denuemrates #varList and #dataList inputs for
* serialization purposes.
*
* Makes submit button 'loading' state until it recieves a response.
*
* @param eleIdentifier string that JQuery can use to identify an element. ei #id
* @author Ganna Shmatova
*/
function runFlowchart(eleIdentifier) {
	nameNumerate($(eleIdentifier + ' #varList input'), 2);
	nameNumerate($(eleIdentifier + ' #datasList input'), 3);

	var submitBtn = $(eleIdentifier + ' :submit');

	submitBtn.button('loading');

	run($(eleIdentifier).serialize(), displayLog, function(){
		submitBtn.button('reset');
	});

	nameDenumerate($(eleIdentifier + ' #varList input'));
	nameDenumerate($(eleIdentifier + ' #datasList input'));
}

/**
* Autofills username in #asmUser.
* Adds events to #addVairbale, #removeVariable and #runForm elements.
* Refreshes selectpicker.
*
* @author Ganna Shmatova
*/
$(window).load(function(){
	//autofill
	// populateUserInfo($('#asmUser'), function(){
	// 	$('#asmUser').val(getUsername());
	// }, true);


	//setting events
	$('#addVariable').click(function(){
		addVariable('#variableDetails #varList');
	});

	$('#addDatabase').click(function(){
		addDatabase('#datasourceDetails #datasList');
	});

	var form = 'form#runForm';
	$(form).submit(function(event){
		event.preventDefault();
		if(isRequiredFilled(form)){
			runFlowchart(form);
		}
	});

	var queries = {};
	$.each(document.location.search.substr(1).split('&'), function(c,q){
    		var i = q.split('=');
   		queries[i[0].toString()] = i[1].toString();
	});

	//autofills anything that was sent in through a get
	var filePath = unescape(queries.file);
	var partition = unescape(queries.partition);

	if(filePath !== null) $('#flowchartPathName').val(filePath);
	if(partition !== null) $('#partition').val(partition);
});
