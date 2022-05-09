/*** 
* Information on SheetJs
* You can not use XLSX.writeFile on the client side
* you need require
* More explanation:
* https://github.com/SheetJS/js-xlsx/issues/153
*
*General information
*To initialize a workbook
*var wb = { SheetNames:[], Sheets:{} };
*
*To add a worksheet into a workbook
*-Add a name into the workbook sheetNames[]
*	wb.SheetNames[0] = 'sheet1';
*-Insert the object in the sheets object
*	wb.Sheets[wb.SheetNames[0]] = worksheet;
* 
*Useful function to create a worksheet
*	Output result for all the following scenario
*	XXX| A | B | C | D | E | F | G |
*	---+---+---+---+---+---+---+---+
* 	 1 | S | h | e | e | t | J | S |
* 	 2 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
* 	 3 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
*
*	1.aoa_to_sheet
*		take an array structure like this
*		['S','h','e','e','t','J','S'],
*		[1,2,3,4,5,6,7],
*    	[2,3,4,5,6,7,8]
*	2.table_to_sheet
* 		take a html table
*
* 		Go on to the link below to see example
* 	3.sheet_to_formulae
* 		Still have no idea how that works!
* 		It's about formula
* 		Check example and edit
*
*https://www.npmjs.com/package/xlsx#writing-options
*
* var test = XLSX.writeFile(wb, 'out.xlsx');
* */


$('document').ready(function(){
	$('#ComplexDownload').click(function(e){
        e.preventDefault();
        saveComplexXlsx();
    });
});


function saveComplexXlsx(){
    
    var first_sheet_name = 'Book1';
    var address_of_cell ='A1';
    //How to create a work book
    //easy to understand in the first one you set the name of the sheet
    //The second one is an array of sheets object
    var wb = { SheetNames:[], Sheets:{} };
    wb.SheetNames[0] = 'sheet1';
    
    var worksheet = XLSX.utils.aoa_to_sheet(table);
    wb.Sheets[wb.SheetNames[0]] = worksheet;
    console.log(worksheet);

    var filename = 'defaultFileName.xlsx';
    /* bookType can be 'xlsx' or 'xlsm' or 'xlsb' or 'ods' */
    var workbook_opts = { bookType:'xlsx', bookSST:false, type:'binary' };
    var workbook_out = XLSX.write(wb,workbook_opts);

    function s2ab(s){
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    /* the saveAs call downloads a file on the local machine */
    saveAs(new Blob([s2ab(workbook_out)],{type:"application/octet-stream"}), filename);
}
var table =[
    [' ','C001','C002','c003','Total'],
    ['Minor',5,20,5,30],
    ['Adult',10,0,5,15],
    ['Senio',2,5,5,12],
    ['Null',2,0,5,7],
    ['Moose',1,20,5,26],
    ['Total',20,45,25,90]
];

// [
// 	{'colName' : 'C001', 'colValue' :
// 	[
// 		{'row' : 'Minor', 'value' : 5},
// 		{'row' : 'Adult', 'value' : 10},
// 		{'row' : 'Senior', 'value' : 2},
// 		{'row' : 'Null', 'value' : 2},
// 		{'row' : 'Moose', 'value' : 1},
// 		{'row' : 'Total', 'value' : 20}
// 	]},
// 	{'colName' : 'C002', 'colValue' :
// 	[
// 		{'row' : 'Minor', 'value' : 20},
// 		{'row' : 'Adult', 'value' : 0},
// 		{'row' : 'Senior', 'value' : 5},
// 		{'row' : 'Null', 'value' : 0},
// 		{'row' : 'Moose', 'value' : 20},
// 		{'row' : 'Total', 'value' : 45}
// 	]},
// 	{'colName' : 'C003', 'colValue' :
// 	[
// 		{'row' : 'Minor', 'value' : 8},
// 		{'row' : 'Adult', 'value' : 8},
// 		{'row' : 'Senior', 'value' : 3},
// 		{'row' : 'Null', 'value' : 0},
// 		{'row' : 'Moose', 'value' : 0},
// 		{'row' : 'Total', 'value' : 19}
// 	]},
// 	{'colName' : 'Total', 'colValue' :
// 	[
// 		{'row' : 'Cat', 'value' : 25},
// 		{'row' : 'Dog', 'value' : 25},
// 		{'row' : 'Moose', 'value' : 5},
// 		{'row' : 'Dragon', 'value' : 0},
// 		{'row' : 'Unicorn', 'value' : 1},
// 		{'row' : 'Total', 'value' : 56}
// 	]}
// ];