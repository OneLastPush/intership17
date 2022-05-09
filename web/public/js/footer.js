// Display information in the footer with year update

$(window).load(function() {
	$('#footer p.navbar-text.hidden-xs').html('© 2012-'+new Date().getFullYear()+' CLEARGOALS Company. All rights reserved.');
	$('#footer p.navbar-text.visible-xs').html('© 2012-'+new Date().getFullYear()+' CLEARGOALS');
});