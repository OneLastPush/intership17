var fs = require('fs');
var report = require('./report');

var us = {
	getCells: function(flowchart, opts, username, password, cb){
		var data = {
			ses: flowchart,
			opts: opts,
			username: username,
			password: password
		};
		report.call(data, function(err, res){
			if (err)
				return cb(err);
			fs.readFile(res.out, function(err, report){
				if (err)
					return cb(err);
				res.report = report.toString();
				res.cells = [];
				var regex = /^(.*?)\[(.*?)\],(.*?),(.*?),(.*?),(.*?),(.*?),(.*?),(.*)/gm;
				var result;
				while ((result = regex.exec(res.report))){
					// If column name swich is on, should skip the first line
					if(result[1].trim() === 'Cell Name' && result[2] === 'Process'){
						continue;
					}
					res.cells.push({
						name: result[1]+'['+result[2]+']',
						process: result[2],
						id: result[3],
						audience: result[4],
						status: result[5],
						size: result[6],
						code: result[7],
						notes: result[8],
						date: result[9]
					});
				}
				cb(undefined, res);
			});
		});
	}
};
module.exports = us;