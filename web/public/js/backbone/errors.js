/**
* Global status handler that handles erorr codes from the server.
*
* Using example:
* $.ajax({
*		type : "POST",
*		url : hostServer + '/someplace',
*		data: $('#formname').serialize(),
*		success : function(data) {
*			doSomething(data);
*		},
*		statusCode : statusHandler
*	});
*
*
* You can override (or add) its responses to status codes:
* statusHandler[401] = function(errRes, status, res){
*	var msg = 'The username or password entered is incorrect.';
*	displayMsg(msg, errRes);
*};
* 	Take note that errRes is the xmlHttpResponse object if the status code is
* 	an error, and res is the xmlHttpResponse object if the code is a success
*
* You can override the way it displays its current messages:
* function displayMsg(msg, res){
*	$('#errorSpace').text( msg );
* }
*
* You can also use multiple instances of the default status handler (+ overrides):
* var custStatuser = {};
* $.extend(custStatuser, statusHandler);
* custStatuser = {
*	200 : function(errRes, status, res){
*		var msg = 'Succesfully changed ownership';
*		displayMsg(msg, res);
*	}
* };
*
* @author Ganna Shmatova
* @version 1.2
*/
var statusHandler = {
	0	: function(errRes, status, res){
		var msg = loc.global.errors.cannotconnectserver;
		var details = '';
		if(!$(window.location).attr('href').search('/login') == -1)
			details += loc.global.errors.acceptedssl1 + hostServer	+ loc.global.errors.acceptedssl2;
		details += loc.global.errors.acceptedssl3 + loc.global.errors.acceptedssl4;
		displayMsg(msg, details, true);
	},


	400 : function(errRes, status, res){
		var msg = loc.global.errors.error;
		displayMsg(msg, errRes.responseText.replace(/\n/g, "<br/>"));
	},
	401 : function(errRes, status, res){
		if(errRes.responseJSON instanceof Array)
			doLogin(loc.global.errors.sessionexpired, loc.global.errors.error + res[0].replace(/\n/g, "<br/>"));
		else
			displayMsg(loc.global.errors.notauthorized, errRes.responseText.replace(/\n/g, "<br/>"));
	},

	403 : function(errRes, status, res){
		var msg = loc.global.errors.accessdenied;
		displayMsg(msg, errRes.responseText.replace(/\n/g, "<br/>"), true);
	},

	404 : function(errRes, status, res){
		var msg = loc.global.errors.notfound;
		displayMsg(msg, errRes.responseText.replace(/\n/g, "<br/>"));
	},

	409 : function(errRes, status, res){
		var msg = loc.global.errors.encounteredconflict;
		displayMsg(msg, errRes.responseText.replace(/\n/g, "<br/>"));
	},

	500 : function(errRes, status, res){
		var msg = loc.global.errors.error;
		displayMsg(msg, errRes.responseText.replace(/\n/g, "<br/>"));
	}
};
