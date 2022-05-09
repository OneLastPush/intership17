var fs = require('fs');
var path = require('path');
var assert = require('assert');

var config = require('smart-config');

function getAuditFileName(){
	var date = new Date();
	return 'audit_'+date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'.json';
}

function getLastAudit(d, cb){
	setTimeout(function(){
		fs.readFile(path.join(d.logsFolder, getAuditFileName()), function(err, data){
			if(err)
				return cb(err);
			var lines = data.toString().trim().split(/\r?\n/);
			var lastLine = lines.pop();
			var audit = JSON.parse(lastLine);
			cb(undefined, audit);
		});
	}, 500);
}

function sameAudit(actual, expected){
	delete actual.when;
	if(expected.who.toLowerCase() != actual.who.toLowerCase())
		throw new Error('Audit\'s who property is different, expect ' + expected.who + ' got ' + actual.who);
	delete actual.who;
	delete expected.who;
	if(actual.file){
		var relPath = actual.file.match(/.*partition1[\\\/](.*)/);
		if(relPath)
			actual.file = relPath[1];
	}
	assert.deepEqual(actual, expected);
}

module.exports = function(d){
	describe('audits', function(){
		before(function(done){
			d.request = new d.Session();
			d.request.post('/login').send(d.adminLogin).end(done);
		});
		after(function(done){
			d.request.post('/login/logout').end(function(err, res){
				d.request.destroy();
				done(err, res);
			});
		});

		var delFile = path.normalize('test/tmp/delFile');
		var archFile = path.normalize('test/tmp/archFile');
		var killSend;
		var app = {url: '', audit: ''};
		for(var p in d.plugins){
			if(d.plugins[p]){
				if(p == 'emm')
					app = {
						url: 'emm/app/listener/campaign',
						audit: 'emm/campaign'
					}
				else
					app = {
						url: p + '/app',
						audit: p
					}
				break;
			}
		}
		var tests = [{
			desc: 'delete',
			before: function(done){
				fs.writeFile(delFile, 'erwfwf', done);
			}, url: '/fs/delete', success: {
				send: {file: delFile},
				expect: {
					action: 'delete',
					who: d.adminLogin.username,
					file: delFile
				}
			}, fail: {
				send: {file: delFile+'123'},
				dontExpect: {
					file: delFile+'123'
				}
			}
		},{
			desc: 'archive',
			before: function(done){
				fs.writeFile(archFile, 'erwfwf', done);
			}, url: '/fs/archive', success: {
				send: {file: archFile},
				get expect(){
					return {
						action: 'archive',
						who: d.adminLogin.username,
						file: archFile,
						to: config.get('Node.archive_folder')
					};
				}
			}, fail: {
				send: {file: archFile+'123'},
				dontExpect: {
					file: archFile+'123'
				}
			}
		},{
			skip: !d.plugins.emm,
			desc: 'run',
			url: '/emm/app/process/run', success: {
				send: {flowchartPath: d.validRunnableFlowchartPath},
				expect: {
					action: 'run',
					who: d.adminLogin.username,
					file: d.validRunnableFlowchartPath
				}
			}
		},{
			skip: !d.plugins.emm,
			desc: 'kill',
			before: function(done){
				if(d.plugins.emm){
					d.smartFindFlowchart(d, d.validRunnableFlowchartPath, function(err, session, data){
						if(err) throw err;
						killSend = {pid: session.pid};
						done();
					});
				}else
					done();
			},
			url: '/emm/app/process/kill', success: {
				sendFn: function(){ return killSend; },
				expect: {
					action: 'kill',
					who: d.adminLogin.username,
					file: d.validRunnableFlowchartPath
				}
			}, fail: {
				send: {pid: '-1'},
				dontExpect:{
					file: undefined
				}
			}
		},{
			skip: app.url? false: true,
			desc: 'stop',
			url: '/'+app.url+'/stop', success: {
				expect: {
					action: 'stop',
					who: d.adminLogin.username,
					application: app.audit
				}
			}, fail: {
				url: '/'+app.url+'123/stop',
				dontExpect: {
					application: app.audit+'123'
				}
			}
		},{
			skip: app.url? false: true,
			desc: 'start',
			before: function(done){ setTimeout(done, 10000); }, //wait for it to stop
			url: '/'+app.url+'/start', success: {
				expect: {
					action: 'start',
					who: d.adminLogin.username,
					application: app.audit
				}
			}, fail: {
				url: '/'+app.url+'123/start',
				dontExpect: {
					application: app.audit+'123'
				}
			}
		}];

		tests.forEach(function(t){
			describe(t.desc, function(){
				if(t.before)
					before(t.before);
				if(t.skip)
					it('success');
				else{
					it('success', function(done){
						d.request.post(t.url).send(t.success.sendFn? t.success.sendFn(): t.success.send).expect(200).end(function(err, res){
							if(err) throw err;
							setTimeout(getLastAudit, 200, d, function(err, audit){
								if(err) throw err;
								sameAudit(audit, t.success.expect);
								done();
							});
						});
					});
				}
				if(t.fail){
					it('failure', function(done){
						d.request.post(t.fail.url || t.url).send(t.fail.send).end(function(err, res){
							setTimeout(getLastAudit, 200, d, function(err, audit){
								if(err) return done();
								for(var f in t.fail.dontExpect){
									if(audit[f] == t.fail.dontExpect[f])
										throw new Error('Audited when shouldn\'t have')
								}
								done();
							});
						});
					});
				}
			});
		});

	});
};