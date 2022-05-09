/**
 * A small canvas was added above the current one
 * Cause: When the img.onLoad it run, it will take its witfh and heigth and set it to the canvas
 * By doing so it will reduce the current canvas size
 * Fix it: just save the image as the canvas original size
 */

var g = {};
function saveWorkBook(){
    var reader = new FileReader();
    reader.addEventListener("load",function(){
        var img = new Image();
        var canvas = $('#myChart');
        var ctx = canvas.get(0).getContext('2d');

        img.onload = function()
        {
            //Set a maximum size
            //Not needed for now
            var maxWidth = 300;
            var width = img.width;
            var height = img.height;
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        width = canvas.width;
        height = canvas.height;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
        console.log('Here');
        console.log(img);
        g.picSrc = canvas[0].toDataURL("image/png");
        g.picBlob = g.picSrc.split(',')[1];
        save();
        }
    img.src = reader.result;
    }, false);
    $('#myChart').get(0).toBlob(function(data){
        console.log('In here');
        reader.readAsDataURL(data);
        
    });

}
function save(){
         var wb = { SheetNames:[], Sheets:{} };
    wb.SheetNames[0] = 'sheet1';

    var worksheet = XLSX.utils.aoa_to_sheet(table);
    wb.Sheets[wb.SheetNames[0]] = worksheet;
    console.log(g.picBlob);
    wb.SheetNames[1] = 'img';
    wb.Sheets[wb.SheetNames[1]] = {};
    console.log(wb.Sheets[wb.SheetNames[1]]);
    wb.Sheets[wb.SheetNames[0]]['!images'] =
         {
            name:'image1.jpeg',
            data: g.picBlob,
            opts: {base64 : true},
            position:{
                type: 'twoCellAnchor',
                attrs: {editAs:'oneCell'},
                from: { col: 2, row : 2 },
                to: { col: 6, row: 5 }
            }
        };
    console.log(wb.Sheets[wb.SheetNames[1]]);

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
$('document').ready(function(){
	var ctx = $('#myChart').get(0).getContext('2d');
	console.log(ctx.width);
	var data = {
    labels: ["Minor", "Adult", "Senior", "Null","Moose", "Total"], //x-axis
    datasets: [
        {
            label: "C001", //optional
            fillColor: "rgba(220,220,220,0.8)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [44, 15, 2, 0, 4, 65] // y-axis
        },
		{
            label: "C002", //optional
            fillColor: "rgba(220,120,220,0.8)",
            strokeColor: "rgba(220,120,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [13, 2, 0, 1, 0, 16]
        },
        {
            label: "C003", //optional
            fillColor: "rgba(180,60,220,0.8)",
            strokeColor: "rgba(180,60,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [3, 3, 3, 10, 0, 19]
        },{
            label: "Total", //optional
            fillColor: "rgba(150,140,220,0.8)",
            strokeColor: "rgba(150,140,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [60, 20, 5, 11, 4, 100]
        }
    ]
};
	var firstChart = new Chart(ctx).Bar(data);
	$('#exportChart').on('click',function(e){
		e.preventDefault();
		 $('#myChart').get(0).toBlob(function(blob){
		 	saveAs(blob,'export.png');
		 });
	});

    //saveWorkBook();
});
function downloadImage(blob){
	console.log(blob.size);
	var ep = new ExcelPlus();
	ep.createFile("Book1")
	.write({"content":[["A1","B2","Moose"]]})
	.createSheet("Book2")
	.write({"cell":"A1","content": blob})
	.saveAs("test2.xlsx");
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
