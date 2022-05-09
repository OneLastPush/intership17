/**
* Requests backend server for a Reports file. Backend
* server generates the file and sends it as a download.
*
* Requires:
* 	partition.js for populating the partition select box.
*	formHelpers.js for decoding URL GET data & validating, checking if required fields are filled.
* 	fileChecker.js for validating if the flowchart file path exists
*
* @author Ganna Shmatova
* @version 2.0.0
**/
var activeChart;
$(window).load(function(){
	fillInputsFromLink();
	initBootstrap();
	addEvents();
});
//autofills things that were sent in through a get
function fillInputsFromLink(){
	var query = queryString.parse(window.location.search);
	var filePath = query.file;
	var partition = query.partition;
	if(filePath !== null) $('#file').val(filePath);
	if(partition !== null) $('#partition').val(partition);
}
//init bootstrap elements
function initBootstrap(){
	$('.selectpicker').selectpicker();
	$('#steps a:first').tab('show');
}
//to forums, input fields
function addEvents(){
	$('#flowchartForm .btn:last').on('click', flowchartSelectEvt);
	$('#reportForm .btn:last').on('click', generateReportEvt);

	$('#cell').on('change', cellSelectEvt);
	$('#type').on('change', reportTypeSelectEvt);

	$('a[data-toggle="tab"][href="#report"]').on('shown.bs.tab', function(e){
		drawReport();
	});
}

//loads next tab & navigates to it
function flowchartSelectEvt(){
	var $form = $(this).parents('form:first');

	if(isRequiredFilled($form)){ //req fields filled
		var $btn = $(this);
		var $cells = $('#cell');

		$btn.button('loading');
		getCells($form.serialize(), $cells, function(){ //fill cells
			$cells.selectpicker('refresh');
			$cells.trigger('change');
			$('#steps a:eq(1)').tab('show'); //next tab
		}, function(){
			$btn.button('reset');
		});
	}
}

//if report type is changed the inputs shown is changed
function reportTypeSelectEvt(){
	var val = $(this).val();

	var $fields = $('#fields');
	var $profiling = $('#profiling');
	var $sampling = $('#sampling');

	$fields.addClass('required');
	$profiling.addClass('hidden');
	$sampling.addClass('hidden');

	if(val == 'profile'){
		$fields.selectpicker({
			'maxOptions': 1
		});
		$fields.val($fields.val().slice(0, 1)); //only let it have 1 field selected, cut off others
		$profiling.removeClass('hidden'); //unhide profiling options
	}else if(val == 'xtab'){
		$fields.selectpicker({
			'maxOptions': 2
		});
		$fields.val($fields.val().slice(0, 2)); //only let it have 2 fields selected, cut off others
		$profiling.removeClass('hidden'); //unhide profiling options
	}else{
		//fields can be empty to designate all fields
		$fields.selectpicker({
			'maxOptions': null //unlimited selection of fields
		});
		$fields.removeClass('required'); //fields not required
		$sampling.removeClass('hidden'); //unhide sampling options
	}
	$fields.selectpicker('refresh'); //refresh bootstrap
}

//when a different cell is selected reloads fields possible for tis audience id
function cellSelectEvt(){
	var $flowchartForm = $('#flowchartForm form');
	if(isRequiredFilled($flowchartForm)){
		var data = $(this).data($(this).val());
		var $fields = $('#fields');
		getFields($flowchartForm.serialize(), data.audience, $fields, function(data){
			$fields.selectpicker('refresh');
		}, function(){

		});
	}
}

//takes all input data & generates report & displays it
function generateReportEvt(){
	var $flowchartForm = $('#flowchartForm form');
	var $reportForm = $(this).parents('form:first');

	if($('#type').val() == 'xtab'){ //not pretty
		var $fields = $('#fields');
		if($fields.val().length != 2){
			$fields.addClass('error-background');
			return;
		}
	}

	if(isRequiredFilled($flowchartForm) && isRequiredFilled($reportForm)){
		var $btn = $(this);
		var formData = $flowchartForm.serialize() + '&' + $reportForm.serialize();

		$btn.button('loading');
		getReport(formData, function(data){
			console.log(data);

			var data2 = [];
			data.split(/\r\n|\r/).forEach(function(line){
				if(line && line.length > 0)
					data2.push(line.split(','));
			});

			var reportDisplay = $('#reportDisplay');
			reportDisplay.data('data', data2);
			reportDisplay.data('parsed', false);

			$('#displayType').text($('#type').val().toUpperCase()+' ');
			$('#displayCell').text($('#cell').val() +' '+ $('#fields').val().toString().replace(/,/g, ' '));

			$('#steps a:eq(2)').tab('show'); //next tab
		}, function(){
			$btn.button('reset');
		});
	}
}

function drawReport(){
	var display = $('#reportDisplay');
	if(!display.data('data')) //only if data to display
		return;

	display.off().empty();
	var type = $('#type').val();

	var data;
	var parsed;
	if(type.match(/profile/i)){
		if(!display.data('parsed')){
			data = display.data('data');
			console.log(JSON.stringify(data));
			data.shift(); //get rid of headers
			parsed = [];
			data.forEach(function(d){
				parsed.push({
					name: d[0],
					value: +d[1] //smart parseInt
				});
			});
			display.data('parsed', parsed);
		}
		parsed = display.data('parsed');
		console.log(JSON.stringify(parsed));
		profileReport(parsed);
	}else if(type.match(/xtab/i)){ //crosstab
		var headers1, headers2;
		if(!display.data('parsed')){
			data = display.data('data');
			console.log(JSON.stringify(data));
			headersX = data.shift();
			headersX.shift(); //get rid of empty header
			headersY = [];
			parsed = [];
			data.forEach(function(d){
				headersY.push(d.shift());
				var d2 = [];
				d.forEach(function(d){
					d2.push({value: +d});
				});
				parsed.push(d2);
			});
			display.data('headersX', headersX);
			display.data('headersY', headersY);
			display.data('parsed', parsed);
		}
		headersX = display.data('headersX');
		headersY = display.data('headersY');
		parsed = display.data('parsed');
		console.log(JSON.stringify(headersX));
		console.log(JSON.stringify(headersY));
		console.log(JSON.stringify(parsed));
		crosstabReport(parsed, headersX, headersY);
	}else{ //sample
		var headers;
		if(!display.data('parsed')){
			data = display.data('data');
			console.log(JSON.stringify(data));
			headers = data.shift();
			parsed = data;
			display.data('headers', headers);
			display.data('parsed', parsed);
		}
		headers = display.data('headers');
		parsed = display.data('parsed');
		console.log(JSON.stringify(headers));
		console.log(JSON.stringify(parsed));
		sampleReport(headers, parsed);
	}
}
var prevWidth;
$(window).resize(function(){ //rebuild chart on x plane resize only
	var nowWidth = $('#reportDisplay').width();
	if(nowWidth != prevWidth){
		if(activeChart)
			activeChart.width(nowWidth).update();
		prevWidth = nowWidth;
	}
});

function profileReport(data){
	var container = d3.select('#reportDisplay');
	activeChart = new d3ChartProfile({
		container: container,
		width: $('#reportDisplay').width()
	}).data(data).update();
}

function crosstabReport(data, headersX, headersY){
	var container = d3.select('#reportDisplay');
	activeChart = new d3ChartXTab({
		container: container,
		width: $('#reportDisplay').width()
	}).data(data)
		.headersX(headersX)
		.headersY(headersY)
		.update();
}

function sampleReport(headers, data){
	activeChart = null;
	var $table = $('<table>',{
		'class': 'table table-striped table-hover responsive no-wrap'
	});
	$table.attr('width', '100%'); //makes table auto-sizable by dataTables
	$('#reportDisplay').append($table);

	var columns = [];
	headers.forEach(function(h){
		columns.push({'title': h});
	});

	var dataTable = $table.DataTable({
		data: data,
		columns: columns
	});
}


//------------ ajax calls ---------------
function getCells(data, $cells, successFn, completeFn){
	$.ajax({
		url: hostServer + '/report/cells',
		data: data,
		dataType: 'json',
		success: function(data){
			if($cells){
				$cells.empty();
				data.forEach(function(cell){
					var value = cell.name + ' [' + cell.process + ']';
					$cells.data(value, cell);
					$cells.append($('<option>',{
						'data-subtext': '['+cell.audience+'] '+cell.date+' ('+cell.code+': '+cell.size+') '+cell.notes,
						text: '['+cell.process+'] '+cell.name,
						value: value,
					}));
				});
			}

			if(successFn) successFn(data);
		},
		complete: completeFn
	});
}
function getFields(data, audience, $fields, successFn, completeFn){
	$fields.empty();
	$.ajax({
		url: hostServer + '/report/fields',
		data: data + '&audience=' + audience,
		dataType: 'json',
		success: function(data){
			if($fields){
				fields = JSON.flatten(data);
				fieldsList = [];
				for(var field in fields)
					fieldsList.push(field);
				fieldsList.sort();
				fieldsList.forEach(function(field){
					$fields.append($('<option>',{
						text: field,
						value: field
					}));
				});
			}

			if(successFn) successFn(data);
		},
		complete: completeFn
	});
}
function getReport(data, successFn, completeFn){
	$.ajax({
		url: hostServer + '/report/generate',
		data: data,
		success: successFn,
		complete: completeFn
	});
}