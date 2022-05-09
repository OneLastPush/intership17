/**
* Populates the select #partition with <option>s of the retrieved partitions from the server.
* Also refreshes .selectpicker so it knows <option>s have been updated
* 
* @author Ganna Shmatova
* @version 2.0.0
*/
function populatePartition(){
	$.ajax({
		url: '/config/get',
		data: { item: 'IBM Campaign.default_partition'},
		dataType: 'text',
		success: function(data){
			data = [data];
			//populates #partition with <option>s
			var $partitions = $('#partition');
			for(var i=0; i<data.length; i++){
				$partitions.append($('<option>', {
					text: data[i],
					value: data[i]
				}));
			}

			//refreshes select pickers
			$('.selectpicker').selectpicker('refresh');
			//triggers any events
			$partitions.trigger('change');
		}
	});
}

/**
* Automatically populates #partition on page load.
*/
$(window).load(function(){
	populatePartition();
});