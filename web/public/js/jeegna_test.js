var pageHeight = 1056;
var pageWidth = 768;

var gridElements = {};

var grid = {
	grid : [],
	zoom : 100,
	height : 1056,
	width : 768,
	x: 0,
	y: 0,
	widgets : {
		components : [],
		graphics : [],
		textareas : []
	}
}

$(window).ready(function() {

	getElements();

	$('.draggable').draggable({ stack: '.draggable', scroll: true, containment: ".report-builder", grid: [ 20, 20 ] });
	$('.draggable').resizable({ grid: [20, 20] });

	// End drag
	$('.draggable').on('mouseup', draggedComponent);

	// Zooming
	$('#zoom-slider').slider({ slide: zoom, min: 25, max: 200, step: 1, value: 100 });
	$('#zoom-input').on('change paste', zoom);
	$('#zoom-input').val(grid.zoom);
	$('#btn-zoom-reset').on('click', resetZoom);

	$('#btn-run').on('click', displayResults);

	setMockData();

	// Stop the user from reloading accidentally
	// window.onbeforeunload = function() { return ''; }
});

function getElements() {
	// TODO
}

function setMockData() {
	var draggables = $('.draggable');
	for (var i = 0; i < draggables.length; i++) {

		var x = parseInt($(draggables[i]).css('x'));
		var y = parseInt($(draggables[i]).css('y'));
		var width = parseInt($(draggables[i]).css('width'));
		var height = parseInt($(draggables[i]).css('height'));

		x = roundToNearest20(x);
		y = roundToNearest20(y);
		width = roundToNearest20(width);
		height = roundToNearest20(height);

		$(draggables[i]).css('x', x);
		$(draggables[i]).css('y', y);
		$(draggables[i]).css('min-width', width);
		$(draggables[i]).css('height', height);

		if (!grid.widgets.components[i]) {
			grid.widgets.components[i] = {};
		}
		grid.widgets.components[i].x = x;
		grid.widgets.components[i].y = y;
		grid.widgets.components[i].width = width;
		grid.widgets.components[i].height = height;
	}

	grid.widgets.components[1].data = [
		{ ID_FIELD: 1, CELLCODE: 'C001', GROUP: 'Group1' },
		{ ID_FIELD: 2, CELLCODE: 'C002', GROUP: 'Group1' },
		{ ID_FIELD: 3, CELLCODE: 'C003', GROUP: 'Group1' },
		{ ID_FIELD: 4, CELLCODE: 'C004', GROUP: 'Group1' },
		{ ID_FIELD: 5, CELLCODE: 'C005', GROUP: 'Group2' },
		{ ID_FIELD: 6, CELLCODE: 'C006', GROUP: 'Group2' },
		{ ID_FIELD: 7, CELLCODE: 'C007', GROUP: 'Group2' },
		{ ID_FIELD: 8, CELLCODE: 'C008', GROUP: 'Group2' },
		{ ID_FIELD: 9, CELLCODE: 'C009', GROUP: 'Others' },
		{ ID_FIELD: 10, CELLCODE: 'C010', GROUP: 'Others' }
	];
	grid.widgets.components[2].data = [
		{ ID_FIELD: 1, CELLCODE: 'C001' },
		{ ID_FIELD: 2, CELLCODE: 'C002' },
		{ ID_FIELD: 3, CELLCODE: 'C003' },
		{ ID_FIELD: 4, CELLCODE: 'C004' },
		{ ID_FIELD: 5, CELLCODE: 'C005' },
		{ ID_FIELD: 6, CELLCODE: 'C006' },
		{ ID_FIELD: 7, CELLCODE: 'C007' },
		{ ID_FIELD: 8, CELLCODE: 'C008' },
		{ ID_FIELD: 9, CELLCODE: 'C009' },
		{ ID_FIELD: 10, CELLCODE: 'C010' }
	];

	parseComponentWithGroups(grid.widgets.components[1].data);
}

function roundToNearest20(num) {
	if (num !== 0 && num % 20 !== 0) {
		num = Math.ceil((num % 10 === 0 ? (num + 1) : (num)) / 20) * 20;
	}
	return num;
}

function zoom(event, ui) {
	grid.zoom = ui ? ui.value : event.target.valueAsNumber;
	if (isNaN(grid.zoom)) {
		grid.zoom = 100;
	}

	var zoom = grid.zoom / 100;

	// Set zoom input fields
	$('#zoom-slider').slider({value : grid.zoom });
	$('#zoom-input').val(grid.zoom);

	$('.grid-area').width(grid.width * zoom);
	$('.grid-area').height(grid.height * zoom);

	var bgSizeWidth = 1600 * zoom + "px";
	var bgSizeHeight = 1000 * zoom + "px";
	$('.grid-area').css('background-size', bgSizeWidth + " " + bgSizeHeight);

	var draggables = $('.draggable');

	var gridSize = 20 * zoom;
	draggables.draggable({ grid: [ gridSize, gridSize ] });
	draggables.resizable({ grid: [ gridSize, gridSize ] });

	for (var i = 0; i < draggables.length; i++) {
		$(draggables[i]).css('width', grid.widgets.components[i].width * zoom);
		$(draggables[i]).css('height', grid.widgets.components[i].height * zoom);
		$(draggables[i]).css('x', grid.widgets.components[i].left * zoom);
		$(draggables[i]).css('y', grid.widgets.components[i].top * zoom);
	}

}

function resetZoom(event) {
	zoom(null, { value: 100});
}

function draggedComponent(event) {
	var component = $(this);

	var id = component.attr('data-id');

	// Get values and remove 'px' ending
	var x = parseInt(component.css('left'));
	var y = parseInt(component.css('top'));
	var height = parseInt(component.css('height'));
	var width = parseInt(component.css('width'));

	if (x < 40) {
		x = 40;
		component.css('left', x);
	}
	if (y < 40) {
		y = 40;
		component.css('top', y);
	}

	// Add widget details to the grid object.
	// { x: , y: , height: , width: , state: has it been run?, hidden : false, data: the results from running  }
	if (!grid.widgets.components[id]) {
		grid.widgets.components[id] = {};
	}

	grid.widgets.components[id].x = x;
	grid.widgets.components[id].y = y;
	grid.widgets.components[id].width = width;
	grid.widgets.components[id].height = height;


	// Check if the size of the grid should be increased
	if ((parseInt(x) + parseInt(width)) > grid.width) {
		increaseWidthRight();
	}
	if ((parseInt(y) + parseInt(height)) > grid.height) {
		increaseHeightDown();
	}
}

function increaseWidthRight() {
	grid.width += pageWidth;
	$('.grid-area').width(grid.width - grid.x);
}

function increaseHeightDown() {
	grid.height += pageHeight;
	$('.grid-area').height(grid.height- grid.y);
}

function displayResults() {
	var draggables = $('.draggable');

	for (var i = 0; i < draggables.length; i++) {
		if (grid.widgets.components[i].data && grid.widgets.components[i].data.length > 0) {
			if (grid.widgets.components[i].data[0].GROUP) {
				displayWithGroups(i, grid.widgets.components[i]);
			} else {
				displayWithoutGroups(i, grid.widgets.components[i]);
			}
		}
	}
}

function displayWithGroups(id, component) {
	var data = component.data;

	var table = $(
		'<table class="table table-striped table-responsive table-hover">'
		+'	<thead>'
		+'		<tr class="headers">'
		+'		</tr>'
		+'	</thead>'
		+'	<tbody>'
		+'	</tbody>'
		+'</table>');
	var headerRow = table.find('.headers');
	var tbody = table.find('tbody');

	// Set headers
	var headers = Object.keys(data[0]);
	headerRow.append($('<th>' + headers[2] + '</th>'));

	// Get total frequency of each group
	var prevGroup;
	var total = 0;
	for (var i = 0; i < data.length; i++) {
		// Add cellcode
		headerRow.append($('<th>' + data[i][headers[1]] + '</th>'));
		var group = data[i][headers[2]];

		if (group !== prevGroup) {
			tr = $('<tr></tr>');
			tr.append($('<th>' + prevGroup + '</th>'));
			tr.append($('<td>' + total + '</td>'));
			tbody.append(tr);

			prevGroup = group;
			total = 1;
		} else {
			total += 1;
		}
	}

	headerRow.append($('<th>' + "loc.js.total" + '</th>'));// TODO GET FROM LANGUAGE THING

	$('#grid').find('[data-id=' + id + ']').find('.panel-body').html(table);
}

function displayWithoutGroups(id, component) {
	var data = component.data;

	var table = $(
		'<table class="table table-striped table-responsive table-hover">'
		+'	<thead>'
		+'		<tr class="headers">'
		+'		</tr>'
		+'	</thead>'
		+'	<tbody>'
		+'	</tbody>'
		+'</table>');
	var headerRow = table.find('.headers');
	var tbody = table.find('tbody');

	var headers = Object.keys(data[0]);
	headerRow.append($('<th>' + headers[0] + '</th>'));
	headerRow.append($('<th>' + headers[1] + '</th>'));

	for (var i = 0; i < data.length; i++) {
		tr = $('<tr></tr>');
		tr.append($('<td>' + data[i][headers[0]] + '</td>'));
		tr.append($('<td>' + data[i][headers[1]] + '</td>'));
		tbody.append(tr);
	}

	$('#grid').find('[data-id=' + id + ']').find('.panel-body').html(table);
}

// [
// 		{ ID_FIELD: 1, CELLCODE: 'C001', GROUP: 'Group1' },
// 		{ ID_FIELD: 2, CELLCODE: 'C002', GROUP: 'Group2' },
// 		{ ID_FIELD: 3, CELLCODE: 'C003', GROUP: 'Others' },
// 		{ ID_FIELD: 4, CELLCODE: 'C004', GROUP: 'Others' }
// ]
//
// TO
//
//[
//		{ ID_FIELDS : [1], CELLCODES : [ 'C001' ], GROUP : 'Group1'	},
//		{ ID_FIELDS : [2], CELLCODES : [ 'C002' ], GROUP : 'Group2'	},
//		{ ID_FIELDS : [3, 4], CELLCODES : [ 'C003', 'C004' ], GROUP : 'Group1'	},
//]
function parseComponentWithGroups(component) {
	console.log(component);
	var newComponents = [];
	var newComponent = {};
	newComponent.CELLCODES = [];
	newComponent.ID_FIELDS = [];

	for (var i = 0; i < component.length; i++) {
		var data = component[i];
		var currentGroup = data.GROUP;
		var nextGroup = null;
		if (i < component.length) {
			nextGroup = component[i+1].GROUP;
		}

		console.log(i + ". current group: " + currentGroup);
		console.log(i + ". next group: " + nextGroup);

		if (currentGroup === nextGroup) {
			console.log(i + ". " + currentGroup + " matches " + nextGroup);

			newComponent.CELLCODES[newComponent.CELLCODES.length] = data.CELLCODE;
			newComponent.ID_FIELDS[newComponent.ID_FIELDS.length] = data.ID_FIELD;
			newComponent.GROUP = currentGroup;
		} else if (nextGroup !== null || data.GROUP !== nextGroup) {
			console.log(i + ". " + currentGroup + " does not match " + nextGroup);
			console.log("This is the last one of: " + currentGroup)

			var newComponent = {};
			newComponent.CELLCODES = [];
			newComponent.ID_FIELDS = [];

			// Add new component to list
			newComponents[newComponents.length] = newComponent;
			console.log(i + ". NEW COMPONENT:");
			console.log(newComponent);

			// Reset variables
			cellcodes = [];
			ids = [];
		}
	}
	console.log(newComponents);
	return newComponents;
}