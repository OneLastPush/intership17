/**
* Run command ajax. Handles all known Run command response codes
*
* @param data to send to the server for the run command
* @param custResHandler - How you want to display the successfully ran/cusom error msgs (ei, displayLog, displayMsg)
* @param onComplete function to run after ajax is complete
* @author Ganna Shmatova
*/
function run(data, custResHandler, onComplete){
	var custStatuser = $.extend({
		200 : function(errRes, status, res){
			var msg = 'Successfuly ran flowchart';
			custResHandler(msg, res.responseText.replace(/\n/g, "<br/>"));
		},
		202 : function(obj, status, res){
			var msg = 'Flowchart is already running';
			custResHandler(msg, res.responseText.replace(/\n/g, "<br/>"));
		},
		400 : function(errRes, status, res){
			var msg = 'An error occurred...';
			custResHandler(msg, errRes.responseText.replace(/\n/g, "<br/>"));
		},
		604 : function(errRes, status, res){
			var msg = 'Variable value given not found';
			custResHandler(msg, errRes.responseText.replace(/\n/g, "<br/>"));
		},
		605 : function(errRes, status, res){
			var msg = 'Cannot open file';
			custResHandler(msg, errRes.responseText.replace(/\n/g, "<br/>"));
		}
	}, statusHandler);

	$.ajax({
		url: '/emm/app/process/run',
		data: data,
		complete: onComplete,
		statusCode: custStatuser
	});
}