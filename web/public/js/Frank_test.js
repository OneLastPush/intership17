$('document').ready(function(){
	setMockData();
    generateExcelPreview(grid.widgets);

	//Create an excel like table
	var width = 100;
	var height = 200;
	var rowCtr = 0;
	var colCtr = 0;
	var table = $('#previewTable');
	var row;
	var tempTable = $('<table></table>');
	var col = $('<td></td>');
	for(rowCtr = 0; rowCtr < width; rowCtr++){
		row = $('<tr>');
		for(colCtr = 0; colCtr < height; colCtr++){
			row.append($("<td></td>"));
		}
		row.append($('</tr>'));
		tempTable.append(row);
	}
	table.append(tempTable.find('tr'));
	console.log(tempTable.find('tr'));

});
function generateExcelPreview(widgets){
	//This will return the order which each component will be drawn 
	//to the screen. 
	//It is order by the closest element to the point 0,0 to the furthest
	//
	//Not Implemented yet
	//Note: Maybe set a priority when two elements are at equal distance 
	//For example textarea as priority than component and then graph
	var priorityArray = setPriority(widgets);

}
var grid;
var testArray;
function setTest(){
	testArray = 
	[
	{
		distanceOrigin: 3.0223
	},{
		distanceOrigin: 4.231
	},{
		distanceOrigin: 3.103
	},{
		distanceOrigin: 43.31
	},{
		distanceOrigin: 5.88
	},{
		distanceOrigin: 1.76
	},{
		distanceOrigin: 10.32
	},{
		distanceOrigin: 2.34
	}
	];
}
function setMockData(){
grid = {
	height:'',
	width:'',
	widgets:{
		components:[],
		textareas:[],
		graphics:[]
	}
};

grid.widgets.components[0] = {
	x: 12,
    y: 3,
    height: 10,
    width: 20,
    state: '',
    hidden: false};
grid.widgets.components[1] = { x: 32,
    y: 22,
    height: 10,
    width: 20,
    state: '',
    hidden: false
};
grid.widgets.components[0].data = [
  {
   'rowName' : 'Total',
   'rowValue' :
    [
     {'col' : 'C001', 'value' : 1},
     {'col' : 'C002', 'value' : 2},
     {'col' : 'C003', 'value' : 3},
     {'col' : 'C004', 'value' : 4}
    ]
  }
 ];

 grid.widgets.components[1].data = [
  {
   'rowName' : 'Cat',
   'rowValue' :
    [
     {'col' : 'C001', 'value' : 4},
     {'col' : 'C002', 'value' : 15},
     {'col' : 'C003', 'value' : 1},
     {'col' : 'Total', 'value' : 20}
    ]
  },
  {
   'rowName' : 'Dog',
   'rowValue' :
    [
     {'col' : 'C001', 'value' : 2},
     {'col' : 'C002', 'value' : 3},
     {'col' : 'C003', 'value' : 5},
     {'col' : 'Total', 'value' : 10}
    ]
  },
  {
   'rowName' : 'Total',
   'rowValue' :
    [
     {'col' : 'C001', 'value' : 6},
     {'col' : 'C002', 'value' : 18},
     {'col' : 'C003', 'value' : 6},
     {'col' : 'Total', 'value' : 30}
    ]
  }
 ];
}