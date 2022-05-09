/*
* Returns:
* @param data nothing.
* @param callback(pingState, errorMsg) where pingState is boolean and errorMsg if theres an error
*/
function pingWebApp(mount){
	return function(data, callback){
		$.ajax({
			url: mount+'/app/ping',
			success: function(res){
				callback(res);
			},
			error: function(res){
				callback(false, res.responseText);
			},
			statusCode: $({404: function(){}}, statusHandler)
		});
	};
}

/*
* Returns:
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function stopWebApp(mount){
	return function(data, onErr, nextFn, prog){
	prog.reset();
		prog.opts.steps = 2;
		nextFn(prog.reset);
		prog.step('Stopping Web Application');
		$.ajax({
			url: '/'+mount+'/app/stop',
			error: function(){
				onErr();
				prog.reset();
			}
		});
	};
}

/*
* Returns:
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function startWebApp(mount){
	return function(data, onErr, nextFn, prog){
		prog.reset();
		prog.opts.steps = 2;
		nextFn(prog.reset);
		prog.step('Starting Web Application');
		$.ajax({
			url: '/'+mount+'/app/start',
			error: function(){
				onErr();
				prog.reset();
			}
		});
	};
}