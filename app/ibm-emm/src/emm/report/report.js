var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var config = require('smart-config');
var log = require('smart-tracer');

var emm = require('../../emm');

var us = {
	doReport: function(flowchart, cell, fields, opts, username, password, cb){
		var data = {
			ses: flowchart,
			opts: opts,
			type: opts.type,
			cell: cell,
			fields: fields,
			username: username,
			password: password
		};
		us.call(data, function(err, res){
			if (err)
				return cb(err);
			fs.readFile(res.out, function(err, report){
				if (err)
					return cb(err);
				res.report = report.toString().trim();
				cb(undefined, res);
			});
		});
	},
	call: function(data, cb){
		data = _.extend({
			ses: '',
			cell: '',
			fields: [],
			records: 100,
			meta: true,
			skipdups: false,

			delimiter: ',',
			includeColNames: false,

			username: '',
			password: ''
		}, data);

		if (!data.opts.partition)
			data.opts.partition = config.get('IBM Campaign.default_partition');

		if (!data.opts.type)
			data.out = path.join(config.get('General.public_folder'), path.basename(data.ses) + '.csv');
		else
			data.out = path.join(config.get('General.public_folder'), path.basename(data.ses, 'ses') + '_' + data.type + '.csv');

		if (!data.opts.type)
			data.opts.type = 'CellList';

		if (!data.bins){
			if (data.opts.type.match(/profile/i))
				data.bins = '25';
			else if (data.opts.type.match(/xtab/i))
				data.bins = '10';
			else
				data.bins = '100';
		}
		var params = [
			'-s', data.ses,
			'-h', data.opts.partition,
			'-r', data.opts.type
		];
		if(data.opts.type.match(/xtab|profile|cellcontent/i)){
			params.push('-p');
			params.push('cell='+data.cell);
		}

		if(data.opts.type.match(/xtab/i)){
			params.push('-p');
			params.push('field1='+data.fields[0]);
			params.push('-p');
			params.push('field2='+data.fields[1]);
		}else{
			data.fields.forEach(function(field){
				params.push('-p');
				params.push('field='+field);
			});
		}

		if(data.opts.type.match(/xtab|profile/i)){
			if(data.bins){
				params.push('-p');
				params.push('bins='+data.bins);
			}
			params.push('-p');
			params.push('meta='+(data.meta? 'TRUE' : 'FALSE'));
		}else if(data.opts.type.match(/cellcontent/i)){
			if(data.records){
				params.push('-p');
				params.push('records='+data.records);
			}
			params.push('-p');
			params.push('skipdups='+(data.skipdups? 'TRUE' : 'FALSE'));
		}

		params.push('-d');
		params.push(data.delimiter);

		if(data.opts.includeColNames)
			params.push('-n');

		params.push('-o');
		params.push(data.out);

		emm.call('unica_acgenrpt', params, {
			user: data.username,
			pw: data.password
		}, function(err, res){
			res.out = data.out;
			cb(err, res);
		});
	}
};
module.exports = us;