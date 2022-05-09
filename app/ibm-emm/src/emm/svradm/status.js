var async = require('async');
var edge = require('edge');
var log = require('smart-tracer');
var fpath = require('fix-path');

var emm = require('../../emm');

var isWindows = require('os').type() == 'Windows_NT';
var us = {};

us.winGetStartTime = edge.func(function(){
	/*
	async(input) => {
		var pid = int.Parse((String)input);
		return System.Diagnostics.Process.GetProcessById(pid).StartTime;
	}
	 */
});
us.getStartTime = function(pid, cb){
	if(isWindows){
		us.winGetStartTime(pid, function(err, res){
			if(err)
				return cb(err);
			if(res)
				return cb(undefined, new Date(res).toLocaleString());
			cb(new Error('Edge did not return result for start time'));
		});
	}else{
		emm.call(['ps', '-p', pid, '-o', 'lstart='], {
			noPath: true
		}, function(err, res){
			if(err) return cb(err);
			cb(undefined, res.stdout.trim());
		});
	}
};
us.winGetCPUUptime = edge.func(function(){
	/*
	async(input) => {
		var pid = int.Parse((String)input);
		return System.Diagnostics.Process.GetProcessById(pid).TotalProcessorTime;
	}
	 */
});
us.getCPUUptime = function(pid, cb){
	if(isWindows){
		us.winGetCPUUptime(pid, function(err, res){
			if(err)
				return cb(err);
			if(res && res.TotalSeconds)
				return cb(undefined, res.TotalSeconds);
			cb(new Error('Edge did not return result or result.TotalSeconds for total processor time'));
		});
	}else{
		emm.call(['ps', '-p', pid, '-o', 'time='], {
			noPath: true
		}, function(err, res){
			if(err) return cb(err);
			cb(undefined, res.stdout.trim());
		});
	}
};
us.addMoreData = function(data, cb){
	async.parallel([
		function(cb){ //for every record, get start time & duration
			async.map(data, function(s, cb){
				s.start_time = '--';
				s.duration = '--';
				if(!s.pid || s.pid == -1) //if no pid can't do anything
					return cb();
				us.getStartTime(s.pid, function(err, res){
					if(err) log.error('Getting start time for pid '+s.pid+' resulted in error: '+err);
					if(res){
						s.start_time = new Date(res);
						s.duration = new Date().getTime() - s.start_time.getTime();
					}
					cb();
				});
			}, cb)
		},
		function(cb){ //for every record, get cpu uptime
			async.map(data, function(s, cb){
				s.cpu_uptime = '--';
				if(!s.pid || s.pid == -1) //if no pid can't do anything
					return cb();
				us.getCPUUptime(s.pid, function(err, res){
					if(err) log.error('Getting cpu uptime for pid '+s.pid+' resulted in error: '+err);
					if(res)
						s.cpu_uptime = res;
					cb();
				});
			}, cb)
		}
	], function(err){
		cb(undefined, data);
	});
}
//does dtaa fixes -- files filename property with fix-path
us.formatData = function(data, cb){
	async.map(data, function(v, cb){
		if(v.filename && v.filename != '<login session>'){
			fpath(v.filename, false, function(err, filename){
				if(err)
					return cb(err);
				v.filename = filename;
				cb();
			});
		}else
			cb();
	}, function(err){
		cb(err, data);
	});
};
us.parse = function parse(str){
	str += '\n***'; //makes it easier on the regex, otherwise won't be able to match last section

	//parse
	var activeData = getSectionData('ACTIVE FLOWCHARTS', 'active', str);
	var suspendedData = getSectionData('SUSPENDED FLOWCHARTS', 'suspended', str);
	var clientData = getSectionData('CLIENTS', 'client', str);

	//consolidate parsed data
	consolidateClients(activeData, clientData);

	var data = [].concat(activeData, suspendedData, clientData);
	return data;
}
us.call = function(username, password, cb){
	emm.call('unica_svradm', ['-x', "status -d -v"], {
		user: username,
		pw: password
	}, cb);
};
us.getFiltered = function(filter, username, password, cb){
	us.call(username, password, function(err, res){
		res.data = us.parse(res.stdout);
		res.filtered = [];

		var match;
		res.data.forEach(function(s){
			match = true;
			for(var key in filter){
				if(!s[key] || !s[key].match(filter[key])){
					match = false;
					break;
				}
			}
			if(match)
				res.filtered.push(s);
		});

		cb(err, res);
	});
};
us.get = function(username, password, cb){
	us.call(username, password, function(err, res){
		if(err || res.stderr)
			return cb(err || res.stderr)
		us.addMoreData(us.parse(res.stdout), function(err, data){
			if(err)
				return cb(err);
			us.formatData(data, function(err){
				res.data = data;
				cb(undefined, res);
			});
		});
	});
};

module.exports = us;

/*****************************************
 * internally used methods for parsing
 *****************************************/
function getSection(name, str){
	var regex = new RegExp("\\*{3} "+name+":([\\s\\S]*?)\\*{3}", 'i')
	var res = str.match(regex);
	return res? res[1].trim(): undefined;
}
function parseSection(section){
	var lines = section.split(/\n/g);
	lines.forEach(function(l, i, a){
		a[i] = l.trim();
	});
	//0 is headers
	//1 is --- which denotes length of data
	//2 is empty
	//3+ is data

	//get lengths. Can't get anything til we know lengths.
	var strLengths = lines[1];
	var lengths = [];
	var matchLengths = strLengths.match(/-+/g);
	matchLengths.forEach(function(l){
		lengths.push(l.length);
	});
	//set last length to something big, because it's not accurately sized....
	lengths[lengths.length-1] = 99999;

	//get headers
	var headers = parseLine(lines[0], lengths);
	headers.forEach(function(h, i, a){
		a[i] = h.toLowerCase().replace(/\s/g, '_');
	});

	//get data
	var data = [];
	var lineDataArray, lineData;
	for(var i=3; i<lines.length; i++){
		if(!lines[i])
			break;
		lineDataArray = parseLine(lines[i], lengths);
		lineData = {}; //make obj with headers as fields
		for(var j=0; j<headers.length; j++){
			lineData[headers[j]] = lineDataArray[j];
		}
		data.push(lineData); //add to returning array
	}
	return data;
}
function parseLine(line, lengths){
	var data = [];
	var lastIndex = 0;
	var index;
	lengths.forEach(function(l){
		index = lastIndex + l + 1; //place + length + 1 padding
		data.push(line.substring(lastIndex, index>line.length? line.length: index).trim());
		lastIndex = index;
	});
	return data;
}
function getSectionData(sectionSearch, sectionName, str){
	var sectionStr;
	var sectionData = [];
	if(sectionStr = getSection(sectionSearch, str))
		sectionData = parseSection(sectionStr);
	sectionData.forEach(function(record){
		record.section = sectionName;
	});
	return sectionData;
}

function consolidateClients(sessions, clients){
	var toRemoveDuplicates = [];
	sessions.forEach(function(s, si){
		if(s.flowchart_name == '<login session>'){
			clients.forEach(function(c){
				if(s.user == c.user && s.svr == c.svr){
					for(var sf in s)
						c[sf] = s[sf];
					c.section = 'client'
					toRemoveDuplicates.push(si);
				}
			});
		}
	});
	for(var i = toRemoveDuplicates.length -1; i>=0; i--)
		sessions.splice(toRemoveDuplicates[i], 1);
}