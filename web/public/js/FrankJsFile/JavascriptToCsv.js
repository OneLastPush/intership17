$('document').ready(init); 
 
function downloadXlsx(args){
	var ep = new ExcelPlus();
	ep.createFile("Book1")
	.write({"content":[["Made","Frank","Birikundavyi"]]})
	.createSheet("Sheet2")
	.write({"cell":"A1","content": new Date().toString()})
	.saveAs("justSimpleXlsx.xlsx");
}
function init(){
	console.log('This is my table');
	console.log(table);
	$('#ddl').click(function(e){
		console.log('save CSV');
		e.preventDefault();
		console.log();
		downloadCSV({
 	 	'table' : tableCSV
	 	});
	});
	$('#downloadXlsx').click(function(e){
		e.preventDefault();
		downloadXlsx();
	});
}
//////////////////////////////////////////////////////////////////////
///
///This function convert an array to a csv string
///
///@param args  -Data : array to parse into csv string
///				-columnDelimiter : custom delimiter (Default ,)
///				-lineDelimiter: custome delimiter (Default \n)
///
//////////////////////////////////////////////////////////////////////
function convertArrayToCSV(args){
	//Check if a columnDelimiter is set
	var cD = args.columnDelimiter || ',';
    var lD = args.lineDelimiter || '\n';
    var data = args.data;
	//Add the first row (column name)
	var cnr; //Stands for column name row

	//First one is empty
	cnr = cD;
	//console.log(cnr);
	var index, colLen = data.length;
	for(index = 0; index < colLen; index++){
		cnr += data[index].colName + cD;
	}
	//console.log(cnr);
	// At this point the first row is added 
	//Add a line skip
	cnr += lD;//,C001,C002,C003,Total
	//First row finished
console.log(data);
console.log(data[0].colValue);
	//Insert Data
	var rowCtr, colCtr = 0, rowLen = data[0].colValue.length;
	var dataStr = '';
	for(rowCtr = 0; rowCtr < rowLen; rowCtr++){
	//	console.log(rowCtr);
		//console.log(data[colCtr]);
		///Add row name 
		dataStr += data[colCtr].colValue[rowCtr].row + cD;
		//Add all data for this row
		for(colCtr = 0; colCtr < colLen; colCtr++){
			dataStr += data[colCtr].colValue[rowCtr].value + cD;
		}
		colCtr = 0;
		//Skip line
		dataStr += lD;
	//	console.log(dataStr);
	}
	//Add all the string in the result String
	var result = cnr + dataStr;
	return result;
}

function downloadCSV(args){
	var filename,link;
	var csvContent = "data:test/csv;charset=utf-8,";
	var csv = convertArrayToCSV({
		data: args.table
	});
	if(csv == null){
		return;
	}

	filename = args.filename || 'export.csv';
	//console.log(csv);
	if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }

    data = encodeURI(csv);
   // console.log(csv);
    var tag = $('#downloadCSV');
   // console.log(tag);
    tag.attr("href",data);
    tag.attr('download',filename);
    
}
var tableCSV =[
	{'colName' : 'C001', 'colValue' : 
	[
		{'row' : 'Cat', 'value' : 4},
		{'row' : 'Dog', 'value' : 15},
		{'row' : 'Moose', 'value' : 2},
		{'row' : 'Dragon', 'value' : 0},
		{'row' : 'Unicorn', 'value' : 1},
		{'row' : 'Total', 'value' : 22}
	]},
	{'colName' : 'C002', 'colValue' : 
	[
		{'row' : 'Cat', 'value' : 13},
		{'row' : 'Dog', 'value' : 2},
		{'row' : 'Moose', 'value' : 0},
		{'row' : 'Dragon', 'value' : 0},
		{'row' : 'Unicorn', 'value' : 0},
		{'row' : 'Total', 'value' : 15}
	]},
	{'colName' : 'C003', 'colValue' : 
	[
		{'row' : 'Cat', 'value' : 8},
		{'row' : 'Dog', 'value' : 8},
		{'row' : 'Moose', 'value' : 3},
		{'row' : 'Dragon', 'value' : 0},
		{'row' : 'Unicorn', 'value' : 0},
		{'row' : 'Total', 'value' : 19}
	]},
	{'colName' : 'Total', 'colValue' : 
	[
		{'row' : 'Cat', 'value' : 25},
		{'row' : 'Dog', 'value' : 25},
		{'row' : 'Moose', 'value' : 5},
		{'row' : 'Dragon', 'value' : 0},
		{'row' : 'Unicorn', 'value' : 1},
		{'row' : 'Total', 'value' : 56}
	]}
];