

module.exports = function(d){
	describe('internal db login', function(){
		beforeEach(function(){
			d.request = new d.Session();
		});
		afterEach(function(done){
			d.request.post('/login/logout').end(function(err, res){
				d.request.destroy();
				done(err, res);
			});
		});
		it('login', function(done){
			d.request.post('/login').send(d.adminLogin).expect(200).end(done);
		});
		it('login case insensitivity / all caps', function(done){
			d.request.post('/login').send({
				username: d.adminLogin.username.toUpperCase(),
				password: d.adminLogin.password
			}).expect(200).end(done);
		});
		it('login externally and create internally', function(done){
			d.request.post('/login').send(d.externalLogin).expect(200).end(function(err, data){
				if(err)
					return done(err);
				d.request.post('/db/internal/user/get').send({ //check db for this newly created record
					username: d.externalLogin.username
				}).expect(200).end(function(err, res){
					if(err)
						return done(err);
					if(!res.body || !res.body.Username)
						return done(new Error('Did not find external user record in the database'));
					if(!res.body.Username.match(new RegExp('^'+d.externalLogin.username+'$', 'i')))
						return done(new Error('Retrieved username '+res.body.Username+' but expected '+d.externalLogin.username));
					done();
				});
			});
		});
	});
	describe('password reset', function(){
		before(function(done){
			d.request = new d.Session();
			d.request.post('/login').send(d.adminLogin).end(function(err){
				if(err) return done(err);
				d.request.post('/db/internal/user/set').send({
					username: d.adminLogin.username,
					data: {
						Email: d.testEmail
					}
				}).end(function(err){
					if(err) return done(err);
					d.request.post('/login/logout').end(done);
				});
			});
		});
		after(function(){
			d.request.destroy();
		});
		it('request reset', function(done){
			var r = d.request.post('/login/reset/token').send({
				username: d.adminLogin.username,
				email: d.testEmail
			});
			if(d.canEmail)
				r.expect(200);
			r.end(function(err, res){
				if(err)
					return done(err);
				if(!res.text)
					throw new Error("Token was not sent back. Token should be sent back in test mode.");
				d.token = res.text;
				done(err);
			});
		});
		it('reset', function(done){
			d.tempPW = 'passwordddddd';
			d.request.post('/login/reset/pw').send({
				username: d.adminLogin.username,
				token: d.token,
				password: d.tempPW
			}).expect(200).end(function(err, res){
				if(err)
					return done(err);
				d.request.post('/login').send({
					username: d.adminLogin.username,
					password: d.tempPW
				}).expect(200).end(done);
			});
		});
		it('request external reset rejected', function(done){
			d.request.post('/login/reset/token').send({
				username: d.externalLogin.username,
				email: d.testEmail
			}).expect(400).end(done);
		});
		describe('case insensitivity', function(){
			it('request reset', function(done){
				var username = '';
				for(var i=0; i<d.adminLogin.username.length; i++){
					if(Math.random() < 0.5)
						username += d.adminLogin.username.substring(i, i+1).toUpperCase();
					else
						username += d.adminLogin.username.substring(i, i+1).toLowerCase();
				}
				var r = d.request.post('/login/reset/token').send({
					username: username,
					email: d.testEmail
				});
				if(d.canEmail)
					r.expect(200);
				r.end(function(err, res){
					if(err)
						return done(err);
					if(!res.text)
						throw new Error("Token was not sent back. Token should be sent back in test mode.");
					d.token = res.text;
					done(err);
				});
			});
			it('reset', function(done){
				var username = '';
				for(var i=0; i<d.adminLogin.username.length; i++){
					if(Math.random() < 0.5)
						username += d.adminLogin.username.substring(i, i+1).toUpperCase();
					else
						username += d.adminLogin.username.substring(i, i+1).toLowerCase();
				}
				d.request.post('/login/reset/pw').send({
					username: username,
					token: d.token,
					password: d.adminLogin.password
				}).expect(200).end(function(err, res){
					if(err)
						return done(err);
					d.request.post('/login').send(
						d.adminLogin
					).expect(200).end(done);
				});
			});
		});
	});
};