var path = require('path');
var fs = require('fs');
var log = require('smart-tracer');
var config = require('smart-config');

var notAuthorized = 'You are not authorized to access this feature. Contact your system administrator if you think that you should.';
function doBatchTests(d, account, batch){
	batch.forEach(function(t){
		if(t.skip){
			it(t.desc);
		}else{
			it(t.desc, function(done){
				var runTest = function(){
					var r = d.request.post(t.url)
					.send(t.getSend? t.getSend(account): t.send);

					if(t.custom)
						t.custom(r, done);

					var statusCode = t.statusCode? t.statusCode: account.statusCode;
					if(t.expectRes)
						r.expect(statusCode, t.expectRes);
					else if(statusCode == 403)
						r.expect(statusCode, notAuthorized);
					else
						r.expect(statusCode);

					r.end(t.end? function(err, res){
						t.end(err, res, done);
					}: done);

					if(t.customPostEnd) //TODO, needed? was a try for fix download
						t.customPostEnd(r, done);
				}
				if(t.setup)
					t.setup(runTest, account);
				else
					runTest();
			});
		}
	});
}

module.exports = function(d){
	describe('router_permission', function(){
		var accounts = [{
			desc: 'full permissions',
			credentials: d.adminLogin,
			statusCode: 200
		}, {
			desc: 'no permissions',
			credentials: d.externalLogin,
			statusCode: 403
		}];

		var fsTests = [{
			desc: 'list contents', url: '/fs', send: {folder: path.join(__dirname, '..')}, statusCode: 200 /*no perms for this*/,
			end: function(err, res, done){
				if(err) throw err;
				if(!res.body.title || !res.body.path || !res.body.folder || !res.body.children)
					throw new Error('Missing expected data');
				var fileList = ['node_modules', 'src', 'test', 'app.js', 'errors.ini', 'index.js', 'package.json'];
				var expectedChildren = {};
				fileList.forEach(function(f){
					expectedChildren[f] = false;
				});
				res.body.children.forEach(function(child){
					expectedChildren[child.title] = true;
				});
				for(var child in expectedChildren){
					if(!expectedChildren[child])
						throw new Error('Missing expected folder: ' + child);
				}
				done();
			},
		}, {
			desc: 'upload', url: '/fs/upload', reqFile: path.join(__dirname, 'tmp/uploadMe.txt'), delFile: path.join(__dirname, 'tmp2/uploadMe.txt'),
			custom: function(r){
				r.field('uploadTo', path.join(this.delFile, '..'));
				r.attach('file', fs.createReadStream(this.reqFile));
			}, end: function(err, res, done){
				if(err) throw err;
				fs.exists(this.delFile, function(exist){
					if(res.statusCode == 200 && !exist)
						throw new Error('Upload worked but file not found');
					else if(res.statusCode == 403 && exist)
						throw new Error('Upload prevented but file found anyway');
					done();
				});
			}
		},{
			skip: true, //TODO bugged?
			desc: 'download', url: '/fs/download', reqFile: path.join(__dirname, 'tmp/downloadMe.txt'),
			send: {file: path.join(__dirname, 'tmp/downloadMe.txt')},
			customPostEnd: function(r){
				r.pipe(fs.createWriteStream(path.join(__dirname, 'tmp', 'downloaded.txt')));
			}, send: function(err, res, done){
				if(err) throw err;
				if(res.statusCode == 200){
					fs.exists(path.join(__dirname, 'tmp', 'downloaded.txt'), function(exist){
						if(!exist)
							throw new Error('Download file missing');
						done();
					});
				}else if(res.statusCode == 403){
					fs.readFile(path.join(__dirname, 'tmp', 'downloaded.txt'), function(err, data){
						if(err) throw err;
						if(data.toString() != notAuthorized)
							throw new Error('Expected error but did not receive');
						done();
					});
				}
			}
		},{
			desc: 'delete', url: '/fs/delete', reqFile: path.join(__dirname, 'tmp/deleteMe.txt'),
			get send(){
				return {file: this.reqFile};
			}, end: function(err, res, done){
				if(err) throw err;
				fs.exists(this.reqFile, function(exist){
					if(res.statusCode == 200 && exist)
						throw new Error('Deleted file still exists');
					else if(res.statusCode == 403 && !exist)
						throw new Error('Deletion rejected but file is missing anyway');
					done();
				});
			}
		}, {
			desc: 'archive', url: '/fs/archive', reqFile: path.join(__dirname, 'tmp/archiveMe.txt'),
			get delFile(){
				if(config.rawData)
					return path.join(config.get('Node.archive_folder'), 'archiveMe.txt.zip');
				else
					return true;
			}, get send(){
				return { file: this.reqFile }
			}, end: function(err, res, done){
				var test = this;
				fs.exists(this.reqFile, function(exist){
					if(res.statusCode == 200 && exist)
						throw new Error('Original file still exists');
					else if(res.statusCode == 403 && !exist)
						throw new Error('Action rejected but original file was removed anyway');

					fs.exists(test.delFile, function(exist){
						if(res.statusCode == 200 && !exist)
							throw new Error('Archived file is missing');
						else if(res.statusCode == 403 && exist)
							throw new Error('Action rejected but archived file found anyway');

						done();
					});
				});
			}
		}];

		var dbTests = {
			'own user': [{
				desc: 'get', url: '/db/internal/user/get', statusCode: 200, getSend: function(account){
					return {username: account.credentials.username};
				}, end: function(err, res, done){
					if(err) throw err;
					var r = res.body;
					if(!r['Authentication Service'] || !r.Username || !r.Language || !r.Status || !r.Name || !r.Phone)
						throw new Error('User record is incomplete');
					done();
				}
			},{
				desc: 'set', url: '/db/internal/user/set', statusCode: 200, expectRes: 'true', getSend: function(account){
					return {username: account.credentials.username, data: {Note: 'Changed self'}};
				}
			}],
			'other user': [{
				desc: 'set', url: '/db/internal/user/set', send: {data: {Username: 'someone'} }
			},{
				desc: 'get', url: '/db/internal/user/get', send: {username: 'someone'},
				end: function(err, res, done){
					if(err) throw err;
					if(res.statusCode == 200){
						var r = res.body;
						if(!r['Authentication Service'] || !r.Username || !r.Language || !r.Status || !r.Name || !r.Phone)
							throw new Error('User record is incomplete');
					}
					done();
				}
			},{
				desc: 'remove', url: '/db/internal/user/remove', send: {username: 'someone'}
			}],
			'groups': [{
				desc: 'set', url: '/db/internal/group/set', send: {data: {Name: 'NewGroup'} }
			},{
				desc: 'get', url: '/db/internal/group/get', send: {group: 'NewGroup'},
				end: function(err, res, done){
					if(err) throw err;
					if(res.statusCode == 200){
						var r = res.body;
						if(!r._id || r.Name != 'NewGroup')
							throw new Error('Group record is incomplete');
					}
					done();
				}
			},{
				desc: 'remove', url: '/db/internal/group/remove', send: {group: 'NewGroup'}
			},{
				desc: 'own permissions', url: '/db/internal/group/get/permissions', statusCode: 200, getSend: function(account){
					return {username: account.credentials.username};
				}
			}],
			'public': [{
				desc: 'blueprint user', url: '/db/internal/user/blueprint', statusCode: 200, end: function(err, res, done){
					if(err) throw err;
					if(!res.body)
						throw new Error('No data returned');
					done();
				}
			},{
				desc: 'blueprint group', url: '/db/internal/group/blueprint', statusCode: 200, end: function(err, res, done){
					if(err) throw err;
					if(!res.body)
						throw new Error('No data returned');
					done();
				}
			},{
				desc: 'group emails', url: '/db/internal/group/get/emails', statusCode: 200, send: {group: 'Basic'}, end: function(err, res, done){
					if(err) throw err;
					if(!res.body)
						throw new Error('No data returned');
					done();
				}
			},{
				desc: 'all emails', url: '/db/internal/user/get/all/emails', statusCode: 200, end: function(err, res, done){
					if(err) throw err;
					if(!res.body)
						throw new Error('No data returned');
					done();
				}
			}]
		}

		var start_stop = [
			{desc: 'emm', url: '/emm/app/listener/campaign/stop'},
			{desc: 'emm', url: '/emm/app/listener/campaign/start', setup: function(done){ setTimeout(done, 6000); }}, //takes a while to stop
			{desc: 'cognos', url: '/cognos/app/stop'},
			{desc: 'cognos', url: '/cognos/app/start'},

			{desc: 'websphere', url: '/websphere/app/stop'},
			{desc: 'websphere', url: '/websphere/app/start'},
			{desc: 'weblogic', url: '/weblogic/app/stop'},
			{desc: 'weblogic', url: '/weblogic/app/start'},

			{desc: 'apache', url: '/apache/app/stop'},
			{desc: 'apache', url: '/apache/app/start'},
			{desc: 'iis', url: '/iis/app/stop'},
			{desc: 'iis', url: '/iis/app/start'}
		];
		start_stop.forEach(function(p){
			if(!d.plugins[p.desc])
				p.skip = true;
		});

		var emm = [{
			desc: 'console', url: '/emm/app/console', send: {cmd: 'help'}
		}, {
			skip: true, desc: 'recompute', url: '/emm/app/recompute' //not done //TODO
		}, {
			desc: 'run', url: '/emm/app/process/run', statusCode: 200, send: {flowchartPath: d.validRunnableFlowchartPath}
		}, {
			desc: 'status', url: '/emm/app/status', statusCode: 200
		}, {
			desc: 'kill own', setup: function(done){
				d.smartFindFlowchart(d, d.validRunnableFlowchartPath, function(err, session, data){
					if(err) throw err;
					emm.pid = session.pid;
					done();
				});
			}, url: '/emm/app/process/kill', statusCode: 200, getSend: function(){ return {pid: emm.pid}; }
		},{
			desc: 'kill others\'', setup: function(done, account){
				d.request.post('/login').expect(200).send(d.externalLogin2).end(function(err, res){
					if(err) throw err;
					d.request.post('/emm/app/process/run').expect(200).send({
						flowchartPath: d.validRunnableFlowchartPath2
					}).end(function(err, res){
						if(err) throw err;
						d.smartFindFlowchart(d, d.validRunnableFlowchartPath2, function(err, session, data){
							if(err) throw err;
							emm.pid2 = session.pid;
							d.request.post('/login').expect(200).send(account.credentials).end(function(err, res){
								if(err) throw err;
								done(err);
							});
						});
					});
				});
			}, url: '/emm/app/process/kill', getSend: function(){ return {pid: emm.pid2}; },
		}];
		if(!d.plugins.emm){
			emm.forEach(function(t){
				t.skip = true;
			});
		}

		accounts.forEach(function(account){
			describe(account.desc, function(){
				before(function(done){
					d.request = new d.Session();
					d.request.post('/login').send(account.credentials).end(done);
				});
				after(function(done){
					d.request.post('/login/logout').end(function(err, res){
						d.request.destroy();
						done();
					});
				})

				it('view server stats', function(done){
					d.request.post('/config/get').expect(account.statusCode)
					.send({item: 'Watched Servers List'})
					.end(function(err, res){
						if(err) throw err;
						if(account.statusCode == 200 && !res.body)
							throw new Error('Expected watched server list but got nothing');
						done();
					});
				});

				describe('file system', function(){
					before(function(done){
						fs.exists('test/tmp2', function(exist){
							exist? done(): fs.mkdir('test/tmp2', done);
						});
					});
					fsTests.forEach(function(t){
						if(t.reqFile){
							before(function(done){
								fs.exists(t.reqFile, function(exist){
									exist? done(): fs.writeFile(t.reqFile, done);
								});
							});
							after(function(done){
								fs.exists(t.reqFile, function(exist){
									exist? fs.unlink(t.reqFile, done): done();
								});
							});
						}
						if(t.delFile){
							after(function(done){
								fs.exists(t.delFile, function(exist){
									exist? fs.unlink(t.delFile, done): done();
								});
							});
						}
					});
					doBatchTests(d, account, fsTests);
				});

				describe('add / remove / modify users', function(){
					for(var c in dbTests){
						describe(c, function(){
							doBatchTests(d, account, dbTests[c]);
						});
					}
				});

				describe('start stop', function(){
					doBatchTests(d, account, start_stop);
				});
				describe('emm', function(){
					doBatchTests(d, account, emm);
				});
			});
		});
	});
}