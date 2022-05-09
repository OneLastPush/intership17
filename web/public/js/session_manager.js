/**
 * Displays campaign login sessions & flowchart sessions
 *
* Requires:
*   campaign/actions.js
* 	campaign/manager.js
* 	DataTables plugin
* 	Refresher.js
 *
 * @version 3.0.0
 * @author Ganna Shmatova
 */
$(window).load(function(){
	var users = manageUsers();
	manageFlowcharts(function(flowcharts){
		setupControllers(flowcharts, users);
	});
});

function manageFlowcharts(cb){
	$.ajax({
		url: '/config/get',
		dataType: 'json',
		data: {item: 'User Interface'},
		success: function(data){
			var warningDuration = parseFloat(data["flowchart_warning_hours"]);
			var manager = new SessionManager({
				pinned: false,
				sessions: true,
				users: false,
				durationWarning: function(data){
					//data is ms, warningDuration is hours
					return data/1000/60/60 > warningDuration;
				}
			});
			$('#manageFlowcharts').append(manager.$container);
			cb(manager);
		}
	});
};
function manageUsers(){
	var manager = new SessionManager({
		pinned: false,
		sessions: false,
		users: true,
		durationWarning: function(data){
			//data is ms, last is hours
			return data/1000/60/60 > 0.5;
		}
	});
	$('#manageUsers').append(manager.$container);
	return manager;
};
function setupControllers(flowcharts, users){
	var $manager = $('#sessionManager');
	var $refresh = $manager.find('#refreshNow');
	var $refreshRate = $manager.find('#refreshRate');

	function refresh(){
		var section = $('#sessionManager li.active span').text().trim();
		if(section == 'Sessions')
			flowcharts.reload();
		else if(section == 'Users')
			users.reload();
	}

	$refresh.tooltip({title: loc.js.refresh});
	$refresh.on('click', refresh);

	$('#sessionManager .settingsBtn').tooltip({title: loc.js.settings});
	new Refresher($refreshRate, refresh);

	cookieSaves.registerInput($refreshRate, 'manager_refreshRate', '30');
};