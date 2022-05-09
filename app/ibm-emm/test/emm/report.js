var config = require('smart-config');
var log = require('smart-tracer');

module.exports = function(d){
	describe('report', function(){
		var cells;
		var fields;
		it('get cells', function(done){
			d.request.post('/'+d.mount+'/app/report/cells')
			.send({
				flowchart: d.validRunnableFlowchartPath,
				username: d.loginCreds.username,
				password: d.loginCreds.password
			})
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				cells = res.body.cells;
				var sucMsg = 'Exported CellList report to delimited file';
				if(res.body.stdout.indexOf(sucMsg) == -1)
					throw new Error('Failed to export celllist report to delimited file.');
				if(cells.length == 0)
					throw new Error('There are no cells exported.');
				done();
			})
		});
		it('get fields', function(done){
			d.request.post('/'+d.mount+'/app/report/fields')
			.send({
				flowchart: d.validRunnableFlowchartPath,
				audience: cells[0].audience,
				username: d.loginCreds.username,
				password: d.loginCreds.password
			})
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				if(!res.body.fields)
					throw new Error('Missing fields.');
				fields = res.body.fields;
				done();
			})
		});
		describe('generate report', function(){
			var reports = [{
				fields: function(){
					return fields.slice(3, 4);
				},
				validate: function(includeColNames, reportData){
					// Fixed column names for Profile report
					if(includeColNames && reportData[0].trim() !== 'Category,Count')
						throw new Error('Incorrect column name.');
					// Fixed two columns for Profile report
					for(var i=0; i < reportData.length-1; i++){
						var dataProf = reportData[i].split(',');
						if(dataProf.length != 2)
							throw new Error('Expected profile data to have 2 columns, instead got ' + dataProf.length);
					}
				},
				opts: {
					type: 'Profile',
					includeColNames: true
				}
			}, {
				fields: function(){
					return fields.slice(0, 2);
				},
				validate: function(includeColNames, reportData){
					var dataFirstLine = reportData[0].split(',');
					var dataLastLine = reportData[reportData.length-1].split(',');
					if(includeColNames && dataFirstLine[dataFirstLine.length-1].trim() != 'NULL')
						throw new Error('The last element of first line should be NULL for XTab report.');
					if(dataLastLine[0].trim() != 'NULL')
						throw new Error('The first element of last line should be NULL for XTab report.');
					if(reportData.length <= 2)
						throw new Error('Report data is empty');
				},
				opts: {
					type: 'XTab',
					includeColNames: true
				}
			}, {
				fields: function(){
					return fields.slice(0,5);
				},
				validate: function(includeColNames, reportData){
					var numCol = this.fields().length;
					// The number of columns is equal to the number of fields plus 1(column #)
					for(var j=0; j < reportData.length-1; j++){
						var data = reportData[j].split(',');
						if((data.length-1) != numCol)
							throw new Error('Expected ' + numCol + ' columns in data, but got ' + (data.length-1));
					}
				},
				opts: {
					type: 'CellContent',
					includeColNames: true
				}
			}];
			reports.forEach(function(report){
				it(report.opts.type, function(done){
					d.request.post('/'+d.mount+'/app/report/generate')
					.send({
						flowchart: d.validRunnableFlowchartPath,
						cell: cells[0].name,
						fields: report.fields(),
						opts: report.opts,
						username: d.loginCreds.username,
						password: d.loginCreds.password
					})
					.expect(200)
					.end(function(err, res){
						if (err)
							throw err;
						var sucMsg = 'Exported ' + report.opts.type + ' report to delimited file';
						if(res.body.stdout.indexOf(sucMsg) == -1)
							throw new Error('Failed to export ' + report.opts.type + ' report to delimited file.');
						if(res.body.report.length == 0)
							throw new Error('Empty ' + report.opts.type + 'report data');

						var reportData = res.body.report.split('\n');
						// Make sure at least one line of data
						if(reportData.length <= 1)
							throw new Error('Report data is empty.');
						report.validate(report.opts.includeColNames, reportData);
						done();
					})
				});
			});
		});
	});
}