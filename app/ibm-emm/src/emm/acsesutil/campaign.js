var admzip = require('adm-zip');
var async = require('async');
var config = require('smart-config');
var log = require('smart-tracer');

var find = require('find');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

var emm = require('../../emm');

function exportCampaignMeta(file, to, username, password, cb){
	var out = path.join(to, path.basename(file).match(/(.+)_/)[1] + '.exp');
	emm.call('unica_acsesutil', ['-s', file, '-h', config.get('IBM Campaign.default_partition'), '-e', out, '-f', 'campaign'], {
		user: username,
		pw: password
	}, function(err, res){
		res.file = out;
		cb(err, res);
	});
}

function exportFlowchart(file, to, username, password, cb){
	var out = path.join(to, path.basename(file, '.ses') + '.exp');
	emm.call('unica_acsesutil', ['-s', file, '-h', config.get('IBM Campaign.default_partition'), '-e', out, '-f', 'flowchart'], {
		user: username,
		pw: password
	}, function(err, res){
		res.file = out;
		cb(err, res);
	});
}

function importCampaignMeta(flowchartSes, campExp, owner, policy, username, password, cb){
	emm.call('unica_acsesutil', ['-s', flowchartSes, '-h', config.get('IBM Campaign.default_partition'), '-i', campExp, '-j', owner, '-K', policy, '-f', 'campaign'], {
		user: username,
		pw: password
	}, cb);
}

function importFlowchart(flowchartSes, flowchartExp, owner, opts, policy, username, password, cb){
	emm.call('unica_acsesutil', ['-s', flowchartSes, '-h', config.get('IBM Campaign.default_partition'), '-i', flowchartExp, '-j', owner, '-K', policy, '-b', opts, '-f', 'flowchart'], {
		user: username,
		pw: password
	}, cb);
}

var us = {
	export: function(exportFile, username, password, cb){
		var code = exportFile.match(/.*_(C\d{9})/);
		if (code)
			code = code[1];
		else
			return cb(new Error('Missing campaign code in ' + exportFile));

		var out = path.join(config.get('General.public_folder'), 'export_' + code);
		async.parallel([
			function(cb){
				fs.exists(out, function(exist){
					if(!exist)
						fs.mkdir(out, cb);
					else
						cb();
				})
			},
			function(cb){
				find.file(new RegExp(".*_"+code+"_.*\\.ses"), path.join(config.get('IBM Campaign._default_partition'), path.dirname(exportFile)), function(files){
					if(files.length === 0)
						return cb(new Error('No flowchart files found'));
					cb(undefined, files);
				});
			}
		], function(err, res){
			if(err) return cb(err);
			var files = res[1];
			async.parallel([
				function(cb){
					exportCampaignMeta(files[0], out, username, password, cb);
				},
				function(cb){
					async.map(files, function(exportFile, cb){
						exportFlowchart(exportFile, out, username, password, function(err, res){
							if(res)
								res.originalFile = exportFile; //.ses file the exported data was generated from
							cb(err, res);
						});
					}, cb);
				}
			], function(err, res){
				if(err) return cb(err);

				var res = { //make response object
					zipFile: out + '.zip',
					data: {
						campaign: res[0],
						flowcharts: res[1]
					}
				};
				//zip export data
				var zip = new admzip();
				zip.addLocalFile(res.data.campaign.file);
				res.data.flowcharts.forEach(function(f){
					zip.addLocalFile(f.originalFile); //original .ses
					zip.addLocalFile(f.file); // generated .exp
				});
				zip.writeZip(res.zipFile); //write zip
				cb(null, res);
				rimraf(out, function(err){ //cleanup tmp files
					if(err)
						log.error(err.stack);
				});
			})
		});
	},
	import: function(zipFile, dest, opts, policy, username, password, cb){
		opts = opts || {};
		if(!opts.conflict)
			opts.conflict = 'abort';
		if(!opts.owner)
			opts.ower = username;
		var exportFiles = {};
		var zip = new admzip(zipFile);
		var zipEntries = zip.getEntries();
		zip.extractAllTo(dest);

		var campaignRegex = /.*_C\d{9}$/i;
		var campaignExp = '';

		zipEntries.forEach(function(zipEntry){
			var ext = path.extname(zipEntry.entryName);
			var name = path.basename(zipEntry.entryName, ext);
			if(name.match(campaignRegex)){ //checks if campaign file
				campaignExp = name + ext;
			}else{ //flowchart file
				if(!exportFiles[name])
					exportFiles[name] = {};
				exportFiles[name][ext] = zipEntry.entryName;
			}
		});

		campaignExp = path.join(dest, campaignExp);
		async.forEachOf(exportFiles, function(v, k, cb){
			var ses = path.join(dest, v['.ses']);
			var exp = path.join(dest, v['.exp']);

			importCampaignMeta(ses, campaignExp, opts.owner, policy, username, password, function(err, out){
				v.campaign = out;
				if(err)
					return cb(err);
				importFlowchart(ses, exp, opts.owner, opts.conflict, policy, username, password, function(err, out){
					v.flowchart = out;
					cb(err);
				});
			});

		}, function(err){
			cb(err, exportFiles);
		});
	}
};
module.exports = us;