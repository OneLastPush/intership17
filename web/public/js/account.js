window.onbeforeunload = function(e){
	var unsaveds = $('#accountDisplay').find('.has-success .has-error');
	if(unsaveds.length > 0)
		return loc.js.unsavedchanges;
};

$(window).load(function(){
	userDisplayer(false, loc.js, function(settings){
		$('#accountDisplay').append(settings.$container);
	});
});