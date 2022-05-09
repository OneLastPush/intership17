/**
* Gets various system information about the backend server.
*
* Requires:
*	refresher.js
*	Chart.js
*	conversions.js
*
* @author Ganna Shmatova
*/
/**************** init **************/
$(window).load(function() {
	Chart.defaults.global = $.extend(Chart.defaults.global, {
		responsive: true,
		animation: false,

		scaleOverride: true,
		scaleSteps: 5,
		scaleStepWidth: 20,
		scaleStartValue: 0
	});

	var $widget = $('#servers');
	$widget.find('#refreshNow').on('click', function(event) {
		event.stopImmediatePropagation();
		getServers();
	});

	$widget.find('#refreshNow').tooltip({
		title: loc.js.refresh
	});
	$widget.find('#settingsBtn').tooltip({
		title: loc.js.settings
	});

	if(permissions.indexOf('view server stats') != -1){
		getServers(); //load servers. Auto picks first server.
	}
	cookiePersistence();
});

function cookiePersistence(){
	cookieSaves.registerInput($('#refreshRateUptime'), 'server_refreshRateUptime', '1');
	cookieSaves.registerInput($('#refreshRateCPU'), 'server_refreshRateCPU', '5');
	cookieSaves.registerInput($('#refreshRateRAM'), 'server_refreshRateRAM', '30');
	cookieSaves.registerInput($('#refreshRateSwap'), 'server_refreshRateSwap', '0');
}

function getServers(){
	// Get the name of the active server
	var activeServer = $('#serverList li.active a').attr("value");
	var switchEvent = function(){
		getServerInfo($(this).attr('value'));
	};
	$.ajax({
		url: '/config/get',
		data: { item: 'Watched Servers List' },
		dataType: 'json',
		success: function(data){
			var list = $('#serverList');
			list.off().empty();

			var li;
			var a;
			var servers = 0;
			for(var server in data){
				servers++;
				li = $('<li>');
				a = $('<a>',{
					text: server,
					value: data[server],
					href: '#server',
					"role": "tab",
					"data-toggle": "tab"
				});
				a.on('show.bs.tab', switchEvent);
				li.append(a);

				list.append(li);

				if (activeServer === data[server]) {
					li.click();
					li.addClass('active');
				}
			}

			if(servers > 0)
				$('#servers').removeClass('hidden');
			else
				$('#servers').addClass('hidden');

			if (!activeServer)
				list.find('li:first').children().click();
		}
	});
	// Issue with Bootstrap, remove the button focus after click
	$('#servers').find('#refreshNow').blur();
}

var server = {
	statusCode: { //so no popups
		0: function(){},
		400: function(res){},
		404: function(){}
	}
};
//convenience method for jquery requests to get server data
function getServerData(jq, url, customSuccessFn, isJSON){
	var opts = {
		url: url,
		success: function(data){
			jq.off().empty();
			if(customSuccessFn)
				customSuccessFn(data, jq);
			else
				$display(jq, data);
		},
		error: function(res){
			$display(jq, undefined)
		},
		statusCode: server.statusCode
	};

	if(isJSON)
		opts.dataType = 'json';
	$.ajax(opts);
}
function $display($ele, value){
	$ele.off().empty();
	if(value != 0 && value)
		$ele.text(value);
	else
		$ele.text('--');
}

function getServerInfo(_url){
	var $serverData = $('#host, #type, #platform, #release, #arch, #cpuName, #nic, #uptime, #cpus, #ram, #swap, #disks');
	$serverData.empty().off();
	getOS(_url);
	getUptime(_url);

	getCPUUsage(_url);

	var thresholds = {};
	$.ajax({
		url: '/config/get',
		dataType: 'json',
		data: { item: 'User Interface' },
		success: function(data) {
			var ram = parseFloat(data["ram_usage_warning_percent"]);
			var swap = parseFloat(data["swap_usage_warning_percent"]);
			var disk = parseFloat(data["disk_usage_warning_percent"]);

			thresholds = {
				// If any values are undefined set the default to 15
				'RAM': ram? ram: 15,
				'Swap': swap? swap: 15,
				'Disk': disk? disk: 15
			};
		},
		complete: function() { //get charts
			getRAM(_url, thresholds);
			getSwap(_url, thresholds);
			getDisks(_url, thresholds);
		}
	});
}

//********** server info ***********//
function getOS(url){
	$('#url').text(url);
	$.ajax({
		url: url + '/sys',
		dataType: 'json',
		success: function(data){
			$display($('#host'), data.host_name);
			$display($('#type'), data.type);
			$display($('#platform'), data.platform);
			$display($('#release'), data.release);
			$display($('#arch'), data.architecture);
			displayNIC(data.network);
			$display($('#cpuName'), data.cpus[0].model);
		},
		error: function(res){

		},
		statusCode: server.statusCode
	});
}

function displayNIC(data){
	var nics = data.interfaces;
	var $ele = $('#nic');

	var tr; //reused
	var container;

	var panel = $('<div>',{
		"class": "panel panel-default"
	});
	var table = $('<table>',{
		"class": "table table-bordered table-striped table-condensed responsive-stacked-table",
		"id": "networkTable"
	});
	panel.append(table);

	container = $('<thead>');
	tr = $('<tr>');
	container.append(tr);
	table.append(container);

	tr.append($('<th>',{
		text: loc.js.name
	}));
	tr.append($('<th>',{
		text: 'IPv4'
	}));
	tr.append($('<th>',{
		text: 'IPv6'
	}));

	container = $('<tbody>');
	table.append(container);

	for(var nic in nics){
		tr = $('<tr>');
		container.append(tr);
		tr.append($('<td>', {text: nic, class: 'text-left small'}));

		var v4 = '';
		var v6 = '';
		if(nics[nic][0]){
			if(nics[nic][0].family == 'IPv4')
				v4 = nics[nic][0].address;
			else
				v6 = nics[nic][0].address;
		}
		if(nics[nic][1]){
			if(nics[nic][1].family == 'IPv4')
				v4 = nics[nic][1].address;
			else
				v6 = nics[nic][1].address;
		}

		tr.append($('<td>', {text: v4, class:'small'}));
		tr.append($('<td>', {text: v6, class:'small'}));
	}

	$ele.append(panel);
}

function getUptime(url){
	new Refresher('#refreshRateUptime', null, {
		url: url + '/sys/uptime',
		success: function(data){
			$('#uptime').text(data);
		},
		statusCode: server.statusCode
	}).start();
}

function getCPUUsage(url){
	$('#cpus').off().empty();
	var canvas = $("<canvas id='#chartCPU'>");
	$('#cpus').append(canvas);

	var colors = ['220, 220, 220', '151,187,205', '187,205,151', '205,151,187'];

	canvas = canvas.get(0).getContext('2d');
	var cpuChart;
	$.ajax({
		url: url + '/sys/cpu',
		dataType: 'json',
		success: function(data){
			var datasets = [];
			for(var i=0; i<data.length; i++)
				datasets.push(makeLine([0, data[i]], colors[ (i<colors.length?i:0) ]));

			cpuChart = new Chart(canvas).Line({
				labels: ['',''],
				datasets: datasets,
				maintainAspectRatio: false,
				responsive: true
			});

			//refresher
			new Refresher('#refreshRateCPU', null, {
				url: url + '/sys/cpu',
				dataType: 'json',
				beforeSend: function(){

				},
				success: function(data){
					if(cpuChart.datasets[0].points.length > 20)
						cpuChart.removeData();
					cpuChart.addData(data, '');
				},
				statusCode: server.statusCode
			}).start();
		},
		statusCode: server.statusCode
	});
}

function getRAM(_url, thresholds){
	$('#ram').off().empty();
	var canvas = $('<canvas>');
	$('#ram').append(canvas);
	var ramUrl = _url+ '/sys/ram';

	canvas = canvas.get(0).getContext('2d');

	$.ajax({
		url: ramUrl,
		dataType: 'json',
		success: function(data){
			var total = bytesToReadable(data.total);
			var used = bytesToReadable(data.used, total.multiplier);
			
			var canvasData = makeUsagePie(used.num, (total.num - used.num).toFixed(2), thresholds.RAM);
			var ramChart = new Chart(canvas).Pie(canvasData, {
				animationEasing: "easeOutQuint",
				tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= parseFloat(value).toFixed(2) + ' " + total.symbol + "'%>"
			});
			$('#ram').append("<h5 id='ramFree' class='text-center'>Free:</h5>");
			$('#ram').append("<h5 id='ramUsed' class='text-center'>Used:</h5>");

			new Refresher('#refreshRateRAM', null, {
				url: ramUrl,
				dataType: 'json',
				success: function(data){
					var total = bytesToReadable(data.total);
					var used = bytesToReadable(data.used, total.multiplier);

					ramChart.segments[0].value = parseFloat(used.num);
					ramChart.segments[1].value = parseFloat((total.num - used.num).toFixed(2));

					ramChart.update();
					$('#ramFree').html("<h5 id='ramFree' class='text-center'>Free: " + ramChart.segments[0].value + ' ' + used.symbol +"</h5>");
					$('#ramUsed').html("<h5 id='ramUsed' class='text-center'>Used: " + ramChart.segments[1].value + ' ' + used.symbol +"</h5>");
				},
				statusCode: server.statusCode
			}).start();
		},
		statusCode: server.statusCode
	});
}

function getSwap(url, thresholds){
	$('#swap').off().empty();
	var canvas = $('<canvas>');
	$('#swap').append(canvas);

	canvas = canvas.get(0).getContext('2d');

	$.ajax({
		url: url + '/sys/swap',
		dataType: 'json',
		success: function(data){
			var total = bytesToReadable(data.total);
			var used = bytesToReadable(data.used, total.multiplier);

			var canvasData = makeUsagePie(used.num, (total.num - used.num).toFixed(2), thresholds.Swap);
			var swapChart = new Chart(canvas).Pie(canvasData, {
				animationEasing: "easeOutQuint",
				tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= parseFloat(value).toFixed(2) + ' " + total.symbol + "'%>"
			});
			$('#swap').append("<h5 id='swapFree' class='text-center'>Free:</h5>");
			$('#swap').append("<h5 id='swapUsed' class='text-center'>Used:</h5>");

			new Refresher('#refreshRateSwap', null, {
				url: url + '/sys/swap',
				dataType: 'json',
				success: function(data){
					var total = bytesToReadable(data.total);
					var used = bytesToReadable(data.used, total.multiplier);

					var free = parseFloat((total.num - used.num).toFixed(2));
					var used2 = parseFloat(used.num);

					if(!free && !used2)
						used2 = 0.001;

					swapChart.segments[0].value = used2;
					swapChart.segments[1].value = free;
					swapChart.update();
					$('#swapFree').html("<h5 id='swapFree' class='text-center'>Free: " + free + ' ' + total.symbol + "</h5>");
					$('#swapUsed').html("<h5 id='swapUsed' class='text-center'>Used: " + used2 + ' ' + total.symbol + "</h5>");

				},
				statusCode: server.statusCode
			}).start();
		},
		statusCode: server.statusCode
	});
}

function getDisks(url, thresholds) {
	getServerData($('#singleDisk'), url + '/sys/disk', function(data, jq) {
		var ctr = 0;
		var $row = $("<div class='row'></div>");

		for (var mnt in data) {
			var disk = data[mnt]; //for every disk
			var total = bytesToReadable(disk.total);
			var used = bytesToReadable(disk.total - disk.free, total.multiplier);

			var canvas = $('<canvas>');
			var canvasData = makeUsagePie(used.num, (total.num - used.num).toFixed(2), thresholds.Disk);

			// If it's the first time coming in here add the first disk next to the RAM and Swap
			if (ctr === 0) {
				$('#singleDisk').off().empty();
				$('#singleDisk').append($('<h4>', {
					text: mnt,
					"class": "text-center"
				}));
				$('#singleDisk').append(canvas);
				canvas = canvas.get(0).getContext('2d');

				new Chart(canvas).Pie(canvasData, {
					responsive: true,
					animationEasing: "easeOutQuint",
					tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= parseFloat(value).toFixed(2) + ' " + total.symbol + "'%>"
				});
				$('#singleDisk').append("<h5 class='text-center'>Free: " + (total.num - used.num).toFixed(2) + ' ' + used.symbol +"</h5>");
				$('#singleDisk').append("<h5 class='text-center'>Used: " + used.num + ' ' + used.symbol + "</h5>");
				ctr++;
				continue;
			}

			$('#leftServerPane').append($row);

			var div = $("<div class='col-xs-12 col-sm-4 no-padding well'</div>");
			$row.append(div);
			div.append($('<h4>', {
				text: mnt,
				"class": "text-center"
			}));
			div.append(canvas);

			canvas = canvas.get(0).getContext('2d');

			new Chart(canvas).Pie(canvasData, {
				responsive: true,
				animationEasing: "easeOutQuint",
				tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= parseFloat(value).toFixed(2) + ' " + total.symbol + "'%>"
			});
			div.append("<h5 class='text-center'>Free: " + (total.num - used.num).toFixed(2) + ' ' + used.symbol +"</h5>");
			div.append("<h5 class='text-center'>Used: " + used.num + ' ' + used.symbol + "</h5>");
			// For every 3 disks we need to make a new row
			if ((ctr % 3) === 0) {
				var newRow = $("<div class='row'></div>");
				$row = newRow;
			}
			ctr++;
		}
	}, true);
}
function makeSingleDisk(disk, thresholds) {
	console.log('making single disk');
	console.log(disk);
	$('#singleDisk').off().empty();
	var canvas = $('<canvas>');
	$('#singleDisk').append(canvas);
	canvas = canvas.get(0).getContext('2d');

	var total = bytesToReadable(disk.total);
	var used = bytesToReadable(disk.total - disk.free, total.multiplier);
	canvasData = makeUsagePie(used.num, (total.num - used.num).toFixed(2), thresholds.Disk);

	new Chart(canvas).Pie(canvasData, {
		responsive: true,
		animationEasing: "easeOutQuint",
		tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= parseFloat(value).toFixed(2) + ' " + total.symbol + "'%>"
	});
}

//**** Chart.js convenience methods ****/
function makeUsagePie(used, free, threshold){
	used = parseFloat(used);
	free = parseFloat(free);
	if(!used && !free)
		used = 0.001;

	var red = false;
	// If the amount of free space is less than or equal to
	// a certain percentage of the disk make the chart red
	if(free <= (free+used) * (threshold / 100))
		red = true;

	return [{
		value: used,
		color: red? "#F7464A": "#2f8988",
		highlight: red? "#FF5A5E": "#4f8f8f",
		label: "used"
	},{
		value: free,
		color: red? "#FDB45C": "#46BFBD",
		highlight: red? "#FFC870": "#5AD3D1",
		label: "free"
	}];
}

function makeLine(data, rgbString){
	return {
		fillColor: 'rgba(' + rgbString +',0.2)',
		strokeColor: 'rgba(' + rgbString +', 1)',
		pointColor: 'rgba(' + rgbString +', 1)',
		pointStrokeColor: '#fff',
		pointHighlightFill: '#fff',
		pointHighlightStroke: 'rgba(' + rgbString +',1)',
		data: data
	};
}
