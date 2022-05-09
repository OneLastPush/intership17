window.onbeforeunload = function(e){
	var unsaveds = $('.tab-pane.active').find('.has-success, .has-error');
	if(unsaveds.length > 0)
		return loc.js.unsavedchanges;
};

$(window).load(function(){
	var users, groups;
	$('a[data-toggle="tab"]:first').tab('show');
	userDisplayer(true, loc.js, function(u){
		users = u;
		$('#accounts').append(users.$container);
	});
	groupDisplayer(true, loc.js, function(g){
		groups = g;
		$('#groups').append(groups.$container);
	});
	$('a[data-toggle="tab"]').click(function(e){
		//checks for unsaved changes before browsing away
		var section = $(this).text().trim();
		var settings;
		if(section == 'Groups')
			settings = users;
		else if(section == 'Accounts')
			settings = groups;
		settings.events.item.unsavedCheck(function(){
			settings.events.item.clear();
			$(e.target).tab('show');
		});
		return false;
	});
	$('a[data-toggle="tab"]').on('show.bs.tab', function(e){
		//reload data when new tab selected
		var section = $(this).text().trim();
		if(section == 'Groups'){
			users.load();
		}else if(section == 'Accounts'){
			groups.load();
		}
	});
});