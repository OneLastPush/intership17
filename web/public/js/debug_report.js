/**
* Flowchart Debug Report
* 
*/

$(window).load(function(){
	var $form = $('#debugForm');
	var $btn = $form.find('button[type="submit"]');
	var url = hostServer + '/flowchart/debug';

	$form.on('submit', function(){
		$form.attr('action', url);
		$form.attr('method', 'POST');
	});
});