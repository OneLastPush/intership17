/**
 * @author Cristan D'Ambrosio
 * @version 2.0.0
 */

// Run when page has finished loading
$(window).load(function () {
	displaySystemVersions();
	displayDatabaseVersions();
	displayInfrastructureInformation();
});

function displaySystemVersions() { //product version information
	var $display = $('#systemVersions');
	$.ajax({
		url: '/apps',
		dataType: "json",
		success: function(data){
			data.forEach(function(app){
				console.log(app);
				$.ajax({
					url: app.mount+'/app/version',
					dataType: 'text',
					success: function(v){
						display($display, app.name, v);
					},
					error: function(){
						display($display, app.name, '--');
					},
					statusCode: {404: function(){}}
				});
			});
		}
	});
}

function displayDatabaseVersions(){
	$.ajax({
		url: 'emm/app/db/version',
		dataType: "json",
		success: function(data){
			var $db = $('#databaseVersions');
			var $label ;
			for(var db in data){
				$label = $('<span>',{
					class: 'label label-default',
					text: db
				});
				$db.append($label);
				$db.append('<br>');
				data[db].forEach(function(v){
					$db.append(v+'<br>');
				});
			}
		}
	});
}

function displayInfrastructureInformation(){
	var $display = $('#infrastructureInfo');
	var complexDisplay = {
		ram: function(ram){
			display($display, 'RAM', ram.free + ' / ' + ram.total);
		},
		cpus: function(cpus){
			display($display, 'CPU', cpus[0].model);
		},
		disk_usage: function(disks){

		},
		swap: function(swap){

		},
		network: function(network){

		}
	}
	$.ajax({
		url: "/sys",
		dataType: "json",
		success: function(data){
			for(var key in data){
				if(complexDisplay[key]){
					complexDisplay[key](data[key]);
				}else{
					display($display, toProperCase(key.replace('_', ' ')), data[key]);
				}
			}
		}
	});
}

function display($parent, key, value){
	$parent.append(key+': '+value+'<br>');
}