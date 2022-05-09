/**
* Functions for starting/stopping the various listeners/servers on the backend machine.
* 
* @author Ganna Shmatova
* @version 2.1.5
**/

var campaign;
var cognos;
var webApp;

/*****************************
* Init. Makes server controllers & auto pings all.
* 
* @author Ganna Shmatova
******************************/
$(window).load(function(){
	var permission = permissions.indexOf('start & stop the environment') != -1;
	if(permission)
		$('#environmentSection').removeClass('hidden');
	//makes servers
	var parent = $('#listeners');

	campaign = new Server(parent, {
		ping: pingCampaign,
		start: permission? startCampaign: null,
		stop: permission? stopCampaign: null,
		forceStop: permission? forceStopCampaign: null,
		onPingSet: permission? cogsCampaignPingEvntDone: null
	},{
		name: 'IBM<sup>®</sup> Campaign Listener',
		connectForm: true,
		progressBar: new Progress()
	});

	parent.append($('<div>',{'class':'row'}));

	new Server(parent, {
		ping: pingOptimize,
		start: permission? startContactOpt: null,
		stop: permission? stopOptimize: null
	},{
		name: 'IBM<sup>®</sup> Contact Optimization Listener',
		connectForm: true,
		progressBar: new Progress()
	});

	cognos = new Server(parent, {
		ping: pingCognos,
		start: permission? startCognos: null,
		stop: permission? stopCognos: null,
		onPingSet: permission? cogsCampaignPingEvntDone: null
	},{
		name: 'IBM<sup>®</sup> Cognos',
		progressBar: new Progress()
	});

	parent.append($('<div>',{'class':'row'}));

	var webApp = {name: 'Not found', mount: 'notfound'};
	$.ajax({
		url: '/apps',
		success: function(apps){
			var webApps = ['IBM WebSphere', 'Oracle WebLogic'];
			apps.forEach(function(app){
				for(var i in webApps){
					if(webApps[i] == app.name)
						webApp = app;
				}
			});
		},
		complete: function(){
			webApp = new Server(parent, {
				ping: pingWebApp(webApp.mount),
				start: permission? startWebApp(webApp.mount): null,
				stop: permission? stopWebApp(webApp.mount): null,
				onPingSet: permission? updateEnvBtns: null
			},{
				name: 'Web Application Server <small>' + webApp.name + '</small>',
				progressBar: new Progress()
			});

			if(permission)
				envBtns(campaign, cognos, webApp); //makes btns

			//auto ping all
			$('#listeners .btn:contains("Ping")').trigger('click');
		}
	})
});

function cogsCampaignPingEvntDone(){
	updateWebServerBtns();
	updateEnvBtns();
}

function updateWebServerBtns(){
	var $dependencies = $('#listeners');
	$dependencies = $dependencies.find(".page-header:contains('Cognos'), .page-header:contains('Campaign Listener')");
	$dependencies = $dependencies.parent().find('.fa-dot-circle-o');

	if($dependencies.not('.red').length > 0){ //green pingers > 0
		if(webApp)
			webApp.disableBtns('You cannot perform this action while Cognos or Campaign Listener are online.');
	}else{
		if(webApp)
			webApp.enableBtns();
	}
}

//env buttons state (shown or not shown?)
function updateEnvBtns(){
	//are campaign, cognos & webapp all installed?
	if(campaign.active && cognos.active && webApp.active){
		var servers = campaign.container.add(cognos.container).add(webApp.container);
		var pingers = servers.find('.fa-dot-circle-o');

		var $btns = $('#envBtns').find('.btn');
		var $start = $('#envStart');
		var $others = $btns.not($start);

		$start.addClass('disabled');
		if(pingers.not('.green').length === 0){ //all green
			$btns.not($start).removeClass('disabled');
		}else if(pingers.not('.red').length === 0){ //all red
			$start.removeClass('disabled');
		}
	}
}

/**
* Environment buttons & their routines, progress keeping, & events.
*/
function envBtns(campaign, cognos, webApp){
	var envProg = new Progress();
	$('#envBtns').parent().append(envProg.container);

	//routines
	function stopAll(nextFn){ //stop campaign > webApp > cognos
		envProg.step('Stopping ' + campaign.name);
		campaign.stop(function(){
			envProg.step('Stopping ' + webApp.name);
			webApp.stop(function(){
				envProg.step('Stopping ' + cognos.name);
				cognos.stop(nextFn);
			});
		});
	}

	function startAll(nextFn){ //start webApp > campaign > cognos
		envProg.step('Starting ' + webApp.name);
		webApp.start(function(){
			envProg.step('Starting ' + campaign.name);
			campaign.start(function(){
				envProg.step('Starting ' + cognos.name);
				cognos.start(nextFn);
			});
		});
	}

	//DOM events
	$('#envBounce').on('click', function(){
		envProg.reset();
		envProg.opts.steps = 7;
		stopAll(function(){ //start
			startAll(function(){
				envProg.reset();
			});
		});
	});

	$('#envStop').on('click', function(){
		envProg.reset();
		envProg.opts.steps = 4;
		stopAll(envProg.reset);
	});
	$('#envStart').on('click', function(){
		envProg.reset();
		envProg.opts.steps = 4;
		startAll(envProg.reset);
	});
}

