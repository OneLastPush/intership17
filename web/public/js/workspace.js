/**
* Retrieves pinned files. Provides functions for files.
* You can unpin items from this page.
* 
* Requires:
*   campaign/actions.js
* 	campaign/manager.js
* 	DataTables plugin
* 
* @author Ganna Shmatova
*/
$(window).load(function(){
	$.ajax({
		url: '/config/get',
		dataType: 'json',
		data: {item: 'User Interface'},
		success: function(data){
			var warningDuration = parseFloat(data["flowchart_warning_hours"]);
			var manager = new SessionManager({
				pinned: true,
				sessions: true,
				users: false,
				durationWarning: function(data){
					//data is ms, warningDuration is hours
					return data/1000/60/60 > warningDuration;
				}
			});
			$('#workspaceManager').append(manager.$container);

			var $refresh = $('#refreshNow');
			var $refreshRate = $('#refreshRate');
			$refresh.tooltip({title: loc.js.refresh});
			$refresh.on('click', manager.reload);

			$('.settingsBtn').tooltip({title: loc.js.settings});
			new Refresher($refreshRate, manager.reload);

			cookieSaves.registerInput($refreshRate, 'workspace_refreshRate', '30');
		}
	});
});