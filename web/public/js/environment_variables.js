/**
* Uses KeyValueTable & ajax for showing & editing
* Campaign environment variables.
* 
* Requires:
*	KeyValueTable.js & KeyValueTable.css
*
* @author Cristan D'Ambrosio
* @author Ganna Shmatova
*/

/**
* Queries server for all the Campaign environmental variables.
* Returns result through successFn as the only parameter
* Return data is an array of Object with name and value fields.
*
* @param successFn called on ajax success and given the data
* @author Ganna Shmatova
*/
function getEnvVars(successFn){
	$.ajax({
		url : '/emm/app/env',
		dataType : 'json',
		success : function(data){
			successFn(data.env);
		}
	});
}

/**
* Sets backend server's variable to this value.
* 
* @param name Variable name to change the value of
* @param value variable's value to change to
* @param successFn direct ajax Success callback function
* @param existed boolena if this variable already exists
* @author Ganna Shmatova
*/
function setEnvVar(name, value, successFn, existed, table){
	function doSet(){
		$.ajax({
			url : '/emm/app/env/set',
			data : {variable: name, value: value},
			success : function(data){
				successFn(data);
			}
		});
	}
	if(existed){
		modal.make({
			"titleText": loc.js.areyousure,
			"msg": loc.js.changevalue1 + name + loc.js.changevalue2,
			btns: [{
				name: loc.js.yes,
				action: doSet
			},{
				name: loc.js.cancel,
				action: table.defaults
			}],
			closeBtn: false
		}, true);
	}else
		doSet();
}

/** init **/
$(window).load(function(){
	var dataOpts = {
		getDataFn: getEnvVars,
		changeDataFn: setEnvVar
	};

	var opts = {
		KeyName: 'Name',
		ValueName: 'Value',
		keyPlaceholder: 'Variable name',
		valuePlaceholder: 'Variable value',
		oneEditRow: true
	};
	var table = new KeyValueTable(dataOpts, opts);
	$('#envTable').append(table.container);
});