/**
 * Displays campaign login sessions & flowchart sessions
 *
 * Requires:
 *	campaign_sessions.js
 * 	Refresher.js
 *
 * @version 2.3.1
 * @author Danijel Livaja
 */
$(window).load(function() {
	console.log("campaign_dashboard_widget entry")

	var dataTable = new CampaignSessions($('#campaignSessions'));
	var $widget = $('#sessionManager');
	$widget.find('#refreshNow').on('click', function() {
		dataTable.refresh();
	});
	new Refresher('#sessionManager #refreshRate', function() {
		dataTable.refresh();
	});

	$widget.find('#refreshNow').tooltip({
			title: loc.js.refresh

	});
	$widget.find('#settingsBtn').tooltip({
		title: loc.js.settings
	});
});
