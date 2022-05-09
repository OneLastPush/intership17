/*
* @param data nothing.
* @param callback(pingState, errorMsg) where pingState is boolean and errorMsg if theres an error
*/
function pingCognos(data, callback){
	$.ajax({
		url: '/cognos/app/ping',
		success: function(res){
			callback(res);
		},
		error: function(res){
			callback(false, res.responseText);
		},
		statusCode: $({404: function(){}}, statusHandler)
	});
}

/*
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function stopCognos(data, onErr, nextFn, prog){
	prog.reset();
	prog.opts.steps = 2;
	nextFn(prog.reset);
	prog.step('Stopping Cognos');
	$.ajax({
		url: '/cognos/app/stop',
		error: function(){
			onErr();
			prog.reset();
		}
	});
}

/*
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function startCognos(data, onErr, nextFn, prog) {
	prog.reset();
	prog.opts.steps = 2;
	nextFn(prog.reset);
	prog.step('Starting Cognos');
	$.ajax({
		url: 'cognos/app/start',
		error: function(){
			onErr();
			prog.reset();
		}
	});
}