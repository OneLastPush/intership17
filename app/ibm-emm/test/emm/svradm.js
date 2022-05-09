var path = require('path');

var fpath = require('fix-path');
var log = require('smart-tracer');

function findFlowchart(d, flowchartFile, cb){
	fpath(flowchartFile, false, function(err, fixedFlowchartFile){
		var flowchartFileRegex = new RegExp(path.normalize(fixedFlowchartFile).replace(/\\|\//g, '\\$&'));
		d.request.post('/'+d.mount+'/app/status').expect(200).send(d.loginCreds)
		.end(function(err, res){
			if(err) return cb(err);
			var session;
			res.body.data.forEach(function(s){
				if(s.filename && s.filename.match(flowchartFileRegex))
					session = s;
			});
			cb(err, session, res.body.data);
		});
	});
}

module.exports = function(d){
	describe('svradm', function(){
		it('get log level', function(done){
			d.request.post('/'+d.mount+'/app/loglevel')
			.send(d.loginCreds)
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				if(!res.body.cmd || !res.body.stdout)
					throw new Error('Response is missing elements');
				done();
			});
		})
		it('change log level', function(done){
			d.request.post('/'+d.mount+'/app/loglevel')
			.send(d.loginCreds)
			.send({level: 'all'})
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				if(!res.body.cmd || !res.body.stdout)
					throw new Error('Response is missing elements');
				done();
			});
		});
		it('version', function(done){
			d.request.post('/'+d.mount+'/app/cli/version')
			.send(d.loginCreds)
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				if(!res.body.cmd || !res.body.stdout)
					throw new Error('Response is missing elements');
				d.util.forEach(function(p){
					if(!res.body.version[p])
						throw new Error('Could not find version for expected product: ' + p);
				});
				done();
			});
		});
		it('change owwner', function(done){
			d.request.post('/'+d.mount+'/app/owner') //doesn't actually ever told you the user/policy dne
			.send(d.loginCreds)
			.send({
				oldUserId: '435664543',
				newUserId: '34252545234',
				policyId: '3455432'
			}).expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				if(!res.body.cmd || !res.body.stdout)
					throw new Error('Response is missing elements');
				done();
			});
		});
		describe('login', function(){
			it('successful', function(done){
				d.request.post('/'+d.mount+'/app/login')
				.send(d.loginCreds)
				.expect(200)
				.end(done);
			});
			it('non-existent', function(done){
				d.request.post('/'+d.mount+'/app/login')
				.send({username: 'no', password: 'no'})
				.expect(401, 'Invalid login credentials')
				.end(done);
			});
		});
		describe('emm environment variables', function(){
			it('list all', function(done){
				d.request.post('/'+d.mount+'/app/env')
				.send(d.loginCreds)
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					if(!res.body.cmd || !res.body.stdout || !res.body.env)
						throw new Error('Response is missing elements');

					var expected = [
						'ALLUSERSPROFILE',//first
						'UNICA_ACSYSENCODING'///last
					];
					expected.forEach(function(variable){
						if(!res.body.env[variable])
							throw new Error('Expected ' + variable + ' but did not find');
					});

					done();
				});
			});
			it('set', function(done){
				d.request.post('/'+d.mount+'/app/env/set')
				.send(d.loginCreds)
				.send({variable: 'ignoreme', value: 'meh'})
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					d.request.post('/'+d.mount+'/app/env')
					.send(d.loginCreds)
					.expect(200)
					.end(function(err, res){
						if(err)
							throw err;
						if(!res.body.cmd || !res.body.stdout || !res.body.env)
							throw new Error('Response is missing elements');
						if(!res.body.env.ignoreme || res.body.env.ignoreme !== 'meh')
							throw new Error('added env variable not found');
						done();
					});
				});
			});
		});
		describe('console', function(){
			it('nothing', function(done){
				d.request.post('/'+d.mount+'/app/console')
				.send(d.loginCreds)
				.send({cmd: ''})
				.expect(404)
				.end(done);
			});
			it('word', function(done){
				d.request.post('/'+d.mount+'/app/console')
				.send(d.loginCreds)
				.send({cmd: 'help'})
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					if(!res.body.cmd || !res.body.stdout)
						throw new Error('Response is missing elements');
					if(!res.body.stdout.match(/available commands/i))
						throw new Error('Did not recieve expected output');
					done();
				});
			});
			it('word parameter', function(done){
				d.request.post('/'+d.mount+'/app/console')
				.send(d.loginCreds)
				.send({cmd: 'status -d'})
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					if(!res.body.cmd || !res.body.stdout)
						throw new Error('Response is missing elements');
					if(!res.body.stdout.match(/flowcharts/i))
						throw new Error('Did not recieve expected output');
					done();
				});
			});
			it('word parameter escape-needing parameter', function(done){
				d.request.post('/'+d.mount+'/app/console')
				.send(d.loginCreds)
				.send({cmd: 'resume -s "i don\'t exist"'})
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					if(!res.body.cmd || !res.body.stdout)
						throw new Error('Response is missing elements');
					if(!res.body.stdout.match(/unable to locate specified flowchart\(s\) to resume/i))
						throw new Error('Did not recieve expected output, received: ' + res.body.stdout);
					done();
				});
			})
			it('unknown words', function(done){
				d.request.post('/'+d.mount+'/app/console')
				.send(d.loginCreds)
				.send({cmd: '-g pineapple'})
				.expect(200)
				.end(function(err, res){
					if(err)
						throw err;
					if(!res.body.cmd || !res.body.stdout)
						throw new Error('Response is missing elements');
					if(!res.body.stdout.match(/unrecognized command/i))
						throw new Error('Did not recieve expected output, received: ' + res.body.stdout);
					done();
				});
			});
		});
		describe('manage sessions', function(){
			describe('status', function(){
				before(function(done){
					var isDone = false;
					//run flowchart
					d.request.post('/'+d.mount+'/app/process/run')
					.send(d.loginCreds)
					.send({flowchartPath: d.validRunnableFlowchartPath})
					.end(function(err, res){
						if(err) throw err;
						var intervalId = setInterval(function getPID(){ //Waiting for flowchart to be running. IBM EMM is slow.. so slow
							findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
								if(err) throw err;
								if(session && session.pid != -1){
									d.sessionPID = session.pid;
									clearInterval(intervalId); //stop looping
									if(!isDone)
										done();
									isDone = true;
								}
							});
						}, 2000);
					});
				});
				after(function(done){
					d.request.post('/'+d.mount+'/app/process/kill')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(done);
				});
				it('data', function(done){
					d.request.post('/'+d.mount+'/app/status').expect(200).send(d.loginCreds)
					.end(function(err, res){
						if(err)
							throw err;
						if(!res.body.cmd || !res.body.stdout || !res.body.data)
							throw new Error('Response is missing elements');

						//check data integrity
						var flowchartFields = ['user', 'c', 'pid', 'port', 'svr', 'flowchart_name', 'type', 'campaign_code', 'camp_id', 'mode', 'writer', 'filename'];
						var clientFields = ['user', 'svr', 'clientid'];
						res.body.data.forEach(function(s){
							if(s.section == 'client'){ //users
								clientFields.forEach(function(f){
									if(s[f] == undefined)
										throw new Error('Missing field ' + f + ' in client object ' + JSON.stringify(s, null, 4));
								});
							}else if(s.section == 'active' || s.section == 'suspended'){ //flowcharts
								flowchartFields.forEach(function(f){
									if(s[f] == undefined)
										throw new Error('Missing field ' + f + ' in flowchart object ' + JSON.stringify(s, null, 4));
								});
							}else{
								throw new Error('Missing field section ' + JSON.stringify(s, null, 4));
							}

							if(s.pid){
								if(s.start_time == '--' || s.duration == '--' || s.cpu_uptime == '--')
									throw new Error('Missing start time / cpu uptime fields ' + JSON.stringify(s, null, 4));
							}
						});
						done();
					});
				});
			});

			describe('run', function(){
				after(function(done){
					findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
						if(err) throw err;
						if(!session || session.pid == -1) return done();
						d.request.post('/'+d.mount+'/app/process/kill')
						.send(d.loginCreds)
						.send({pid: session.pid})
						.end(done);
					});
				});
				it('valid', function(done){
					d.request.post('/'+d.mount+'/app/process/run')
					.send(d.loginCreds)
					.send({flowchartPath: d.validRunnableFlowchartPath})
					.expect(200)
					.end(function(err, res){
						if(err)
							throw err;
						if(res.stderr)
							throw new Error('got error from command: ' + res.body.stderr);
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(!res.body.stdout.match(/^Successfully ran command[\s\S]*/i))
							throw new Error('Expected to get success message, but got: ' + res.body.stdout);
						done();
					});
				});
				it('valid status', function(done){
					var intervalId = setInterval(function checkStatus(){
						d.request.post('/'+d.mount+'/app/process/status')
						.send(d.loginCreds)
						.send({flowchartPath: d.validRunnableFlowchartPath})
						.end(function(err, res){
							if(res.statusCode == 404) //means not ready yet
								return;
							if(err)
								throw err;
							if(!res.body.cmd || !(res.body.stdout || res.body.stderr))
								throw new Error('Response is missing elements');
							clearInterval(intervalId); //stop looping
							done();
						});
					}, 2000);
				});
				it('non-existent', function(done){
					d.request.post('/'+d.mount+'/app/process/run')
					.send(d.loginCreds)
					.send({flowchartPath: 'campaigns/erhfe/ergferwgr.ses'})
					.expect(200)
					.end(function(err, res){
						if(err)
							throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(!res.body.stdout.match(/^Successfully ran command[\s\S]*/i))
							throw new Error('Expected to get success message, but got: ' + res.body.stdout);
						done();
					});
				});
				it('non-existent status', function(done){
					var intervalId = setInterval(function checkStatus(){
						d.request.post('/'+d.mount+'/app/process/status')
						.send(d.loginCreds)
						.send({flowchartPath: 'campaigns/erhfe/ergferwgr.ses'})
						.end(function(err, res){
							if(res.statusCode == 404) //means not ready yet
								return;
							if(err)
								throw err;
							if(!res.body.cmd || !res.body.stderr)
								throw new Error('Response is missing elements');
							clearInterval(intervalId); //stop looping
							done();
						});
					}, 2000);
				});
			});

			describe('control', function(){
				beforeEach(function(done){
					var isDone = false;
					//run flowchart
					d.request.post('/'+d.mount+'/app/process/run')
					.send(d.loginCreds)
					.send({flowchartPath: d.validRunnableFlowchartPath})
					.end(function(err, res){
						if(err) throw err;
						var intervalId = setInterval(function getPID(){ //Waiting for flowchart to be running. IBM EMM is slow.. so slow
							findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
								if(err) throw err;
								if(session && session.pid != -1){
									d.sessionPID = session.pid;
									clearInterval(intervalId); //stop looping
									if(!isDone)
										done();
									isDone = true;
								}
							});
						}, 1000);
					});
				});
				afterEach(function(done){
					function kill(pid){
						d.request.post('/'+d.mount+'/app/process/kill')
						.send(d.loginCreds)
						.send({pid: pid})
						.end(done);
					}
					//kill flowchart if still exists
					findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
						if(err) throw err;
						if(!session || session.pid == -1) return done();
						if(session.section == 'suspended'){
							//if suspended, resume first then kill
							d.request.post('/'+d.mount+'/app/process/resume')
							.send(d.loginCreds)
							.send({pid: session.pid})
							.end(function(err, res){
								if(err) throw err;
								findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
									if(err) throw err;
									kill(session.pid);
								});
							});
						}else
							kill(session.pid);
					});
				});

				it('save', function(done){
					d.request.post('/'+d.mount+'/app/process/save')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(function(err, res){
						if(err) throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(res.body.stderr || !res.body.stdout.match(/successful/i))
							throw new Error('command was not successful');
						done();
					});
				});

				it('suspend and resume', function(done){
					d.request.post('/'+d.mount+'/app/process/suspend')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(function(err, res){
						if(err) throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(res.body.stderr || !res.body.stdout.match(/successful/i))
							throw new Error('suspend command was not successful');
						findFlowchart(d, d.validRunnableFlowchartPath, function(err, session, sessions){
							if(err) throw err;
							if(!session || session.pid == -1)
								throw new Error('Flowchart session is gone');
							if(session.section != 'suspended')
								throw new Error('Flowchart session is not suspended');

							d.request.post('/'+d.mount+'/app/process/resume')
							.send(d.loginCreds)
							.send({pid: session.pid})
							.end(function(err, res){
								if(err) throw err;
								if(!res.body.cmd || !res.body.stdout)
									throw new Error('Response is missing elements');
								if(res.body.stderr || !res.body.stdout.match(/successful/i))
									throw new Error('resume command was not successful');

								findFlowchart(d, d.validRunnableFlowchartPath, function(err, session, sessions){
									if(err) throw err;
									if(!session || session.pid == -1)
										throw new Error('Flowchart session is gone');
									if(session.section != 'active')
										throw new Error('Flowchart session is not active again after resume');

									done();
								});
							});
						});
					});
				});
				it('stop', function(done){
					d.request.post('/'+d.mount+'/app/process/stop')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(function(err, res){
						if(err) throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(res.body.stderr || !res.body.stdout.match(/successful/i))
							throw new Error('command was not successful');
						findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
							if(err) throw err;
							if(session && session.pid != -1)
								throw new Error('Flowchart session still present');
							done();
						});
					});
				});

				it('kill', function(done){
					d.request.post('/'+d.mount+'/app/process/kill')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(function(err, res){
						if(err) throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(res.body.stderr || !res.body.stdout.match(/successful/i))
							throw new Error('command was not successful');
						findFlowchart(d, d.validRunnableFlowchartPath, function(err, session){
							if(err) throw err;
							if(session && session.pid != -1)
								throw new Error('Flowchart session still present');
							done();
						});
					});
				});

				it('kill suspended', function(done){
					d.request.post('/'+d.mount+'/app/process/suspend')
					.send(d.loginCreds)
					.send({pid: d.sessionPID})
					.end(function(err, res){
						if(err) throw err;
						if(!res.body.cmd || !res.body.stdout)
							throw new Error('Response is missing elements');
						if(res.body.stderr || !res.body.stdout.match(/successful/i))
							throw new Error('suspend command was not successful');

						findFlowchart(d, d.validRunnableFlowchartPath, function(err, session, sessions){
							if(err) throw err;
							if(!session || session.pid == -1)
								throw new Error('Flowchart session is gone');
							if(session.section != 'suspended')
								throw new Error('Flowchart session is not suspended');

							d.request.post('/'+d.mount+'/app/process/kill')
							.send(d.loginCreds)
							.send({pid: session.pid})
							.expect(409, 'Flowchart has to be active for this action')
							.end(done);
						});
					});
				});
			});
		});
	});
}