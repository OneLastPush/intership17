/**
* Requires:
*	Progress.js
*/

/**
* General function that does ajax requests to the stop listener page on the server.
* The stop listener pages simply interfaces with the svrstop command.
* As of this moment the data you can send to the server is:
* pingserver (any character means yes)
* port
* ssl (any character means yes)
* servername host server (if other than default)
* product (if blank, campaign listener. if Optimize, contact optimizer)
*
* @param data to send to the server, in {} form
* @param successFn function to call on success
* @param errorFn function it calls on error
* @param completeFn fucntion it calls on complete
* @author Ganna Shmatova
*/
function stopCampaign(data, successFn, errorFn, completeFn){
	$.ajax({
		url: '/emm/app/stop',
		data: data,
		success: successFn,
		error: errorFn,
		complete: completeFn
	});
}


/**
* Pings Campaign Listener.
* Data is a {}}  that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when pinging
* @param callback(pingState, errorMsg) where pingState is boolean and errorMsg if theres an error
*/
function pingCampaign(data, callback){
	$.ajax({
		url: '/emm/app/ping',
		data: data,
		success: function(state){
			callback(state);
		},
		error: function(err){
			callback(false, err.responseText);
		},
		statusCode: $({404: function(){}}, statusHandler)
	});
}
/**
* Pings Contact Optimizer Listener.
* Data is a {} that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when pinging
* @param callback(pingState, errorMsg) where pingState is boolean and errorMsg if theres an error
*/
function pingOptimize(data, callback){
	$.ajax({
		url: '/emm/app/listener/optimizer/ping',
		data: data,
		success: function(state){
			callback(state);
		},
		error: function(err){
			callback(false, err.responseText);
		},
		statusCode: $({404: function(){}}, statusHandler)
	});
}

/**
* Calls startListener function on server.
*
* Displays modla box askign if you want to resume sessions.
* If yes, starts Campaign Listener, resumes all sessions, and saves all sessions.
* If starting fails, does not try to resume and save.
* If no, simply starts Campaign Listener.
* If close, nothing happens.
*
* Data is a string query that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start campaign
* @param nextFn callback that's given a callback so you can call it back later to resume & save flowcharts. Yeah.
* @author Ganna Shmatova
*/
function startCampaign(data, onErr, nextFn, prog) {
	modal.make({
		"titleText": loc.js.startStop.campaign.startTitle,
		"msg": loc.js.startStop.campaign.startMsg,
		onCloseBtn: onErr,
		btns: [{
			name: loc.js.startStop.yes,
			action: function(){
				//start, resume -a, save -a

				prog.reset();
				prog.opts.steps = 4;

				nextFn(function(){
					prog.step(loc.js.startStop.campaign.resumingSessions);
					$.ajax({
						url: '/emm/app/process/resume',
						data: {all: true},
						complete: function(){
							prog.step(loc.js.startStop.campaign.savingSessions);
							$.ajax({
								url: '/emm/app/process/save',
								data: {all: true},
								complete: function(){
									prog.reset();
								}
							});
						}
					});
				});

				prog.step(loc.js.startStop.campaign.startingCampaign);
				$.ajax({
					url: '/emm/app/start',
					data: data,
					error: function(){
						onErr();
						prog.reset();
					}
				});
			}
		},{
			name: loc.js.startStop.no,
			action: function(){
				prog.reset();
				prog.opts.steps = 2;
				prog.step(loc.js.startStop.campaign.startingCampaign);
				nextFn(prog.reset);
				$.ajax({
					url: '/emm/app/start',
					data: data,
					error: function(){
						onErr();
						prog.reset();
					}
				});
			}
		}]
	}, true);
}

/**
* Calls start contact optimziation listener function on server.
*
* Data is a {} that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when starting
* @param onErr called if fatal error or user refuses to start
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function startContactOpt(data, onErr, nextFn, prog){
	prog.reset();
	prog.opts.steps = 2;
	nextFn(prog.reset);
	prog.step(loc.js.startStop.campaign.startingOptimizer);
	$.ajax({
		url: '/emm/app/listener/optimizer/start',
		data: data,
		error: function(){
			onErr();
			prog.reset();
		}
	});
}

/***************** friendlier interfaces of the stop ajax ***************/

/**
* Calls stop campaign listener function on server.
*
* Displays modal box asking if you want to save currently running sessions.
* If yes, displays progress bar as it: saves all, suspends all, stops all sessions.
* then stops the Campaign Listeners. The session functions do not have to be successful
* for the Campaign Listener to be stopped.
* If no, simply stops the Campaign Listener.
* If close, nothing happens.
*
* Data is a {} that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when stopping server
* @param onErr function to call on error
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function stopCampaign(data, onErr, nextFn, prog){
	modal.make({
		"titleText": loc.js.startStop.campaign.shutdownTitle,
		"msg": loc.js.startStop.campaign.shutdownMsg,
		onCloseBtn: onErr,
		btns: [{
			name: loc.js.startStop.yes,
			action: function(){
				prog.reset();
				prog.opts.steps = 5;
				nextFn(prog.reset);

				//save -a, suspend -a, stop -a, stop
				prog.step(loc.js.startStop.campaign.savingSessions);
				$.ajax({
					url: '/emm/app/process/save',
					data: {all: true},
					complete: function(){
						prog.step(loc.js.startStop.campaign.suspendingSessions);
						$.ajax({
							url: '/emm/app/process/suspend',
							data: {all: true},
							complete: function(){
								prog.step(loc.js.startStop.campaign.stoppingSessions);
								$.ajax({
									url: '/emm/app/process/stop',
									data: {all: true},
									complete: function(){
										prog.step(loc.js.startStop.campaign.stoppingCampaign);
										stopCampaign(data, null, function(){
											onErr();
											prog.reset();
										});
									},
									error: onErr
								});
							}
						});
					}
				});
			}
		},{
			name: loc.js.startStop.no,
			action: function(){
				prog.reset();
				prog.opts.steps = 2;
				nextFn(prog.reset);

				prog.step(loc.js.startStop.campaign.stoppingCampaign);
				stopCampaign(data, null, function(){
					onErr();
					prog.reset();
				});
			}
		}]
	}, true);
}

/**
* Calls stop Campaign Listener function on server, but forcefully stops sesisons.
*
* Displays modal of 'Are you sure?' flavor.
* If yes, stops all sessiosn forcefully, and proceeds to stop the Campaign Listener.
* If close, nothing happens.
*
* Data is a {} that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when stopping server
* @param onErr function to call on error
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function forceStopCampaign(data, onErr, nextFn, prog){
	modal.make({
		"titleText": loc.js.startStop.campaign.forceShutdownTitle,
		"msg": loc.js.startStop.campaign.forceShutdownMsg,
		onCloseBtn: onErr,
		btns: [{
			name: loc.js.startStop.yes,
			action: function(){
				//stop -f -a, stop
				prog.reset();
				prog.opts.steps = 3;
				prog.step(loc.js.startStop.campaign.stoppingSessions);
				nextFn(prog.reset);
				$.ajax({
					url: '/emm/app/process/stop',
					data: {all: true, force: true},
					complete: function(){
						prog.step(loc.js.startStop.campaign.stoppingCampaign);
						stopCampaign(data, null, function(){
							onErr();
							prog.reset();
						});
					}
				});
			}
		}]
	}, true);
}

/**
* Calls stop contact optimziation listener function on server.
*
* Data is a string query that accepts:
* 	servername 	- host name
*	port 		- port
* 	ssl 		- ssl - any character means yes
*
* @param data to send to the server when stopping server
* @param onErr function to call on error
* @param nextFn fn with 1 param callback which is called back on desired ping state
* @param prog progressbar from Progress.js
* @author Ganna Shmatova
*/
function stopOptimize(data, onErr, nextFn, prog){
	prog.reset();
	prog.opts.steps = 2;
	prog.step(loc.js.startStop.campaign.stoppingOptimizer);
	$.ajax({
		url: '/emm/app/listener/optimizer/stop',
		error: function(){
			onErr();
			prog.reset();
		}
	});
	nextFn(prog.reset);
}