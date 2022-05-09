module.exports = function(d){
	describe('referencial integrity', function(){
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
		describe('add', function(){
			it('user with groups specified', function(done){
				d.request.post('/db/internal/user/set')
				.send({data: {Username: 'Bob', Groups: ['Basic']}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get')
					.send({group: 'Basic'})
					.expect(d.removeIds)
					.expect(200, {
						Name: 'Basic',
						Users: ['Bob'],
						Permissions: [],
						'Viewable file types': [
							'ses',
							'log',
							'cat', 'xml',
							'txt',
							'dat', 'dct', 'csv',
							'doc', 'docx'
						],
						'File system permissions': []
					}).end(done);
				});
			});
			it('group with users specified', function(done){
				d.request.post('/db/internal/group/set')
				.send({data: {Name: 'Secret', Users: ['Bob']}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get/user')
					.send({username: 'bob'})
					.expect(d.removeIds)
					.expect(200, ['Basic', 'Secret']).end(done);
				});
			});
		});
		describe('modify', function(){
			it('rename user', function(done){
				d.request.post('/db/internal/user/set')
				.send({username: 'bob', data: {Username: 'Bobby'}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					var index = 2;
					function doDone(err){
						if(err){
							index = -1;
							done(err);
						}
						if(--index===0)
							done();
					}
					d.request.post('/db/internal/group/get/user')
					.send({username: 'bobby'})
					.expect(d.removeIds)
					.expect(200, ['Basic', 'Secret']).end(doDone);

					d.request.post('/db/internal/group/get/user')
					.send({username: 'bob'})
					.expect(d.removeIds)
					.expect(200, []).end(doDone);
				});
			});
			it('rename group', function(done){
				d.request.post('/db/internal/group/set')
				.send({group: 'Secret', data: {Name: 'SuperSecret'}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get/user')
					.send({username: 'bobby'})
					.expect(d.removeIds)
					.expect(200, ['Basic', 'SuperSecret']).end(done);
				});
			});
			//TODO
			// it('update user\'s groups', function(done){
			// 	d.request.post('/db/internal/user/set')
			// 	.send({username: 'bobby', data: {Groups: ['Secret']}})
			// 	.expect(200, 'true').end(function(err){
			// 		if(err) return done(err);
			// 		d.request.post('/db/internal/group/get/user')
			// 		.send({username: 'bob'})
			// 		.expect(d.removeIds)
			// 		.expect(200, ['Secret']).end(done);
			// 	});
			// });
			// it('update group\s users');
		});
		describe('remove', function(){
			it('remove user', function(done){
				d.request.post('/db/internal/user/remove')
				.send({username: 'bobby'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					var index = 2;
					function doDone(err){
						if(err){
							index = -1;
							done(err);
						}
						if(--index===0)
							done();
					}
					d.request.post('/db/internal/group/get/user')
					.send({username: 'bobby'})
					.expect(d.removeIds)
					.expect(200, []).end(doDone);

					d.request.post('/db/internal/group/get')
					.send({group: 'SuperSecret'})
					.expect(d.removeIds)
					.expect(200, {
						Name: 'SuperSecret',
						Users: [],
						Permissions: [],
						'Viewable file types': [],
						'File system permissions': []
					}).end(doDone);
				});
			});
			it('remove group', function(done){
				d.request.post('/db/internal/group/remove')
				.send({group: 'Basic'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get/user')
					.send({username: 'admin'})
					.expect(d.removeIds)
					.expect(200, ['Administrator']).end(done);
				});
			});
		});
	});
};