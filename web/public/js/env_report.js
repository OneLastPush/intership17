/**
* Generates environment report
*
*/
$(window).load(function(){
	var $report = $('#genReport');
	$report.attr('action', hostServer + '/env/report');
	$report.attr('method', 'POST');
});