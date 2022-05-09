var fs = require('fs');
var path = require('path');
var find = require('find');
var config = require('smart-config');
var admzip = require('adm-zip');
var rimraf = require('rimraf');

function zipEntriesToFiles(entries){
	var files = [];
	entries.forEach(function(entry){
		files.push(entry.name);
	});
	return files;
}

function checkFiles(files){
	var toCheck = {};
	var name, ext;
	files.forEach(function(f){
		ext = path.extname(f);
		name = path.basename(f, ext);
		if(!toCheck[name])
			toCheck[name] = {};
		toCheck[name][ext] = true;
	});

	var file;
	for(var f in toCheck){
		file = toCheck[f];
		if(!file['.exp'])
			throw new Error('Found a file without .exp companion ' + f);
		if(!file['.ses'] && !f.match(/.+_C\d{9}$/i))
			throw new Error('Found a non-campaign file without a .ses companion ' + f);
	}
}
module.exports = function(d){
	describe('acsesutil', function(){
		before(function(done){
			fs.exists('test/data', function(exist){
				if(exist)
					done();
				else
					fs.mkdir('test/data', done);
			});
		});
		after(function(done){
			rimraf(path.join(config.get('IBM Campaign._default_partition'), d.importedCamp), function(err){
				if(err)
					log.error(err.stack);
				done();
			});
		});
		after(function(done){
			rimraf('test/data', function(err){
				if (err)
					log.error(err.stack);
				done();
			});
		});
		describe('campaign', function(){
			var exportBy = [{
				desc: 'campaign',
				exportFile: d.validRunnableFlowchartPath.substring(0, d.validRunnableFlowchartPath.lastIndexOf('_'))
			}, {
				desc: 'flowchart',
				exportFile: d.validRunnableFlowchartPath
			}];
			exportBy.forEach(function(eb){
				var downloadTo = 'test/data/export.zip';
				it('export by ' + eb.desc, function(done){
					d.request.post('/'+d.mount+'/app/campaign/export')
					.send({
						exportFile: eb.exportFile,
						username: d.loginCreds.username,
						password: d.loginCreds.password
					})
					.expect(200)
					.on('end', function(err, res){
						if (err) throw err;
						var code = d.validRunnableFlowchartPath.match(/.*_(C\d{9})/i);
						fs.exists(downloadTo, function(exist){
							if(!exist)
								throw new Error('Expectd zip file missing.');
							var zip = new admzip(downloadTo);
							var files = zipEntriesToFiles(zip.getEntries());
							checkFiles(files);
							d.exportedCampaign = downloadTo;
							done();
						});
					}).pipe(fs.createWriteStream(downloadTo));
				});
			});
			it('import', function(done){
				var zipFile = d.exportedCampaign;
				var dest = path.join(config.get('IBM Campaign._default_partition'), d.importedCamp);
				var opts = {conflict: 'replace', owner: d.loginCreds.username};
				d.request.post('/'+d.mount+'/app/campaign/import')
				.send({
					zipFile: zipFile,
					dest: dest,
					opts: opts,
					policy: d.policy,
					username: d.loginCreds.username,
					password: d.loginCreds.password
				})
				.expect(200)
				.end(function(err, res){
					if (err) throw err;
					find.file(dest, function(files){
						checkFiles(files);
					});
					done();
				})
			});
		});
		describe('catalog', function(){
			it('export', function(done){
				var exportedCatalog = path.join(config.get('General.public_folder'), path.basename(d.testCatalogPath, '.cat') + '.xml');
				var downloadTo = 'test/data/catalog.xml';
				d.request.post('/'+d.mount+'/app/catalog/export')
				.send({
					catFile: d.testCatalogPath,
					username: d.loginCreds.username,
					password: d.loginCreds.password
				})
				.expect(200)
				.on('end', function(err, res){
					if (err) throw err;
					fs.exists(downloadTo, function(exist){
						if(!exist)
							throw new Error('Expectd exported catalog file missing.');
						done();
					});
				}).pipe(fs.createWriteStream(downloadTo));
			})
		});
	});
}