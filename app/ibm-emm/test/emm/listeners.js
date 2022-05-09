function ping(d, t, expect, done){
	d.request.post(t.url + '/ping').send(d.loginCreds)
	.end(function(err, res){
		if(err) throw err;
		if(!res.body)
			throw new Error('No body found in response');
		if(res.body.status != expect)
			throw new Error('Expected ping to return ' + expect + ' but got ' + res.body.status);
		done();
	});
}
function doTest(d, t){
	describe(t.desc, function(){
		if(t.skip){
			it('version');
		}else{
			it('version', function(done){
				d.request.post(t.url + '/version').send(d.loginCreds)
				.expect(200).end(function(err, res){
					if(err) throw err;
					if(!res.text)
						throw new Error('Version information is missing');
					done();
				});
			});
		}
		describe('ping', function(){
			if(t.skip){
				it('no creds');
				it('valid');
				return;
			}
			it('no creds', function(done){
				d.request.post(t.url + '/ping').expect(404).end(done);
			});
			it('valid', function(done){
				ping(d, t, true, done);
			});
		});
		describe('stop', function(){
			if(t.skip || !t.stop_start){
				it('no creds');
				it('valid');
				return;
			}
			it('no creds', function(done){
				d.request.post(t.url + '/stop').expect(404).end(done);
			});
			it('valid', function(done){
				d.request.post(t.url + '/stop').send(d.loginCreds)
				.expect(200).end(function(err, res){
					if(err) throw err;
					if(!res.body)
						throw new Error('No body found in response');
					if(!res.body.stdout)
						throw new Error('Stdout is missing from response');
					if(!res.body.stdout.match(/SHUTDOWN message delivered to server process/i))
						throw new Error('Response missing shutdown message');
					ping(d, t, false, done);
				});
			});
		});
		describe('start', function(){
			if(t.skip || !t.stop_start){
				it('no creds');
				return;
			}
			it('no creds', function(done){
				d.request.post(t.url + '/start')
				.expect(200).end(function(err, res){
					if(err) throw err;
					if(!res.text)
						throw new Error('Missing response text');
					if(!res.text.match(/listener service was started successfully/i))
						throw new Error('Missing success message');
					ping(d, t, true, done);
				});
			});
		});
	});
}

module.exports = function(d){ //assumes these are turned on when tests start
	describe('listeners', function(){
		d.listenerTests.forEach(function(t){
			t.url = '/'+d.mount+'/app/listener/'+t.desc;
			doTest(d, t);
		});
	});
};