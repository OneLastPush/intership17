/**
* Campaign File utility for forms.
* 
* Retrieves partitions (select input),
*	sets them to any GET partition value given.
* Retrieves relevant files (select input .campFile -- filter by name (flowchart, session, catalog)),
*	sets them to any GET file value given.
*
* @version 1.0.0
*	- replaces partitions.js & fileChecker.js. Does dropdown for campaign files.
* @author Ganna Shmatova
*/
$(window).load(function(){
	$('.selectpicker').selectpicker('refresh');
	var query = queryString.parse(window.location.search);
	var path = query.file;
	var partition = query.partition;

	function addOptions($select, optsArray){
		optsArray.forEach(function(opt){
			$select.append($('<option>',{
				text: opt
			}));
		});
	}

	function retrieveFiles($select){
		$.ajax({
			url: hostServer + '/campaign/find/' + $select.attr('name'),
			data: {partition: $('#partition').val()},
			dataType: 'json',
			success: function(data){
				addOptions($select, data);
				$select.val(path);
				$select.selectpicker('refresh');
			}
		});
	}

	//partitions
	$.ajax({
		url: hostServer + '/campaign/partitions',
		dataType: 'json',
		success: function(data){
			var $partitions = $('#partition');
			addOptions($partitions, data);
			$partitions.val(partition);
			$partitions.selectpicker('refresh');

			$partitions.on('change', function(){
				$('select.campFile').each(function(i, file){
					retrieveFiles($(file));
				});
			});
			$partitions.trigger('change');
		}
	});
});