var https = require('https');
var url = require('url');
var fs = require('fs');

function getAllIssues(agent, owner, repo, access_token, cb){
	var allData = [];
	var index = 1;
	function next(err, data){
		if(err) return cb(err);
		index++;
		allData = allData.concat(data);
		if(data.length == 100)
			getIssues(agent, owner, repo, access_token, index, next);
		else
			cb(undefined, allData);
	}
	getIssues(agent, owner, repo, access_token, index, next);
}
function getIssues(agent, owner, repo, access_token, page, cb){
	var params = {
		per_page: 100,
		page: page,
		state: 'open',
		sort: 'updated',
		filter: 'all'
	};
	if(access_token)
		params.access_token = access_token;

	var query = '?';
	for(var f in params)
		query += f+'='+params[f]+'&';
	if(query > 1)
		query = query.substring(0, query.length-1);

	https.request({
		method: 'GET',
		headers: {
			'User-Agent': agent,
		},
		host: 'api.github.com',
		path: '/repos/'+owner+'/'+repo+'/issues'+(query.length > 1? query: '')
	}, function(res){
		var data = '';
		res.on('data', function(d){
			data += d;
		});
		res.on('error', function(err){
			cb(err);
		});
		res.on('end', function(){
			var body = JSON.parse(data);
			if(body.message)
				return cb(new Error(data));
			cb(undefined, body);
		});
	}).end();
}
function scrape(data){
	var res = {};
	res['Week'] = '';
	res['Priority'] = '';
	res['Milestone'] = data.milestone.title;
	res['Ticket#'] = data.number;
	res['Dev (hr)'] = '';
	res['Code Review (hr)'] = '';
	res['Validation (hr)'] = '';
	res['Assigned To'] = data.assignee? data.assignee.login: '';

	var labels = {};
	data.labels.forEach(function(l){
		labels[l.name] = true;
	});
	var stages = ['Needs More Info', 'Validate & Close', 'Code Review', 'Physical Review'];
	res['Stage'] = ' ';
	for(var i in stages){
		if(labels[stages[i]]){
			res['Stage'] = stages[i];
			break;
		}
	}

	res['Estimates updated on'] = '';
	res['Comment'] = '';

	return res;
}

var cvs = {
	delim: '\t',
	read: function(file, cb){
		fs.readFile(file, function(err, buffer){
			if(err) return cb(err);
			buffer = buffer.toString();
			var lines = buffer.split(/[\n\r]{1,2}/);
			var headers = lines[0].split(cvs.delim);
			lines.shift();
			var data = [];
			lines.forEach(function(r){
				var fields = r.split(cvs.delim);
				var d = {};
				for(var i=0; i<headers.length; i++){
					d[headers[i]] = fields[i];
				}
				data.push(d);
			});
			cb(undefined, data);
		});
	},
	write: function(file, data, cb){
		if(data.length == 0)
			return cb(new Error('Data is empty'));

		var buffer = '';
		var headers = [];
		for(var h in data[0]){
			headers.push(h);
			buffer += '"'+h+'"'+cvs.delim;
		}
		buffer += '\n';
		data.forEach(function(r){
			for(var f in r)
				buffer += '"'+r[f]+'"'+cvs.delim
			buffer += '\n';
		});

		fs.writeFile(file, buffer, cb);
	}
}

var agent = 'ganna-shmatova';
var owner = 'cleargoals';
var repo = 'AdminExtension';
var token = '23cae086336a5472f75c9dfd2aa45186fe19bdd7';
var input = 'git_issue_digest_input.cvs';
var output = 'git_issue_digest.cvs';

console.log('Getting issues for: ' + owner +'/'+repo);
getAllIssues(agent, owner, repo, token, function(err, data){
	if(err) throw err;

	console.log('Scaping issue data');
	var res = {};
	var scraped;
	data.forEach(function(issue){
		if(issue.pull_request)
			return;
		scraped = scrape(issue);
		res[scraped['Ticket#']] = scraped;
	});

	//read old csv
	console.log('Reading old issue csv: ' + input);
	cvs.read(input, function(err, data){
		if(err) throw err;

		var old = {};
		data.forEach(function(d){
			old[d['Ticket#']] = d;
		});

		//consolidate data with currently generated
		//if generated has old ticket & empty field, use old ticket's field value.
		console.log('Consolidating old data and new data');
		for(var i in res){
			if(old[i]){
				for(var f in res[i]){
					if(!res[i][f] || res[i][f].length == 0){
						res[i][f] = old[i][f];
					}
				}
			}
		}

		//turn into array and write to csv file
		var resArray = [];
		for(var i in res){
			resArray.push(res[i]);
		}
		console.log('Writing data to output csv: ' + output);
		cvs.write(output, resArray, function(err){
			if(err) throw err;
			console.log('Succesfully completed');
		});
	});
});

