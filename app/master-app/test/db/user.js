var os = require('os');
var path = require('path');
var isWindows = os.platform() === 'win32';
var root = path.parse(__dirname).root.toUpperCase();

module.exports = function(d){
	describe('user', function(){
		describe('set', function(){
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
			it('update', function(done){
				d.request.post('/db/internal/user/set')
				.send({
					username: 'admin',
					data: {
						Email: 'ganna.shmatova@cleargoals.com',
						Note: 'What a doozy',
						Bookmarks: [{
							key: 'Home', value: 'localhost',
						},{
							key: 'Google', value: 'http://google.com'
						}]
					}
				}).expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get')
					.send({username: 'admin'})
					.expect(d.removeIds)
					.expect(200, {
						Username: 'Admin',
						Password: '******',
						'Authentication Service': 'Internal',
						Status: 'Active',
						Language: 'English',
						Email: 'ganna.shmatova@cleargoals.com',
						'IBM Marketing': {
							Username: d.externalLogin.username,
							Password: '******'
						},
						Name: {First: '', Middle: '', Last: ''},
						Phone: {Mobile: '', Office: ''},
						Bookmarks: [{
							key: 'Home', value: 'localhost',
						},{
							key: 'Google', value: 'http://google.com'
						}],
						Note: 'What a doozy'
					}).end(done);
				});
			});
			it('add', function(done){
				d.request.post('/db/internal/user/set')
				.send({data: {Username: 'Bob', Password: 'ImFarmerRoge'}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get')
					.send({username: 'bob'})
					.expect(d.removeIds)
					.expect(200, {
						Username: 'Bob',
						Password: '******',
						'Authentication Service': 'Internal',
						Status: 'Active',
						Language: 'English',
						Email: '',
						'IBM Marketing': {Username: '', Password: ''},
						Name: {First: '', Middle: '', Last: ''},
						Phone: {Mobile: '', Office: ''},
						Bookmarks: [],
						Note: ''
					}).end(done);
				});
			});
			it('remove', function(done){
				d.request.post('/db/internal/user/remove')
				.send({username: 'bob'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get')
					.send({username: 'bob'})
					.expect(d.removeIds)
					.expect(404).end(done);
				});
			});
		});
		describe('pinned items', function(){
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
			it('get pinned', function(done){
				d.request.post('/db/internal/user/get/pinned')
				.send({username: 'admin'})
				.expect(200, []).end(done);
			});
			it('add pinned //root', function(done){
				d.request.post('/db/internal/user/add/pinned')
				.send({username: 'admin', pinned: isWindows? root+'users':'/usr'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users']:['/usr']).end(done);
				});
			});
			it('add pinned \\\\root2', function(done){
				d.request.post('/db/internal/user/add/pinned')
				.send({username: 'admin', pinned: isWindows?root+'ProgramData':'\\lib'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users',root+'programdata']:['/usr','/lib']).end(done);
				});
			});
			it('add pinned non-existant', function(done){
				d.request.post('/db/internal/user/add/pinned')
				.send({username: 'admin', pinned: isWindows?root+'ProgramData\\abcd\\a.sh':'\\lib\\abcd\\a.sh'})
				.expect(400).end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users',root+'programdata']:['/usr','/lib']).end(done);
				});
			});
			it('add pinned duplicate C:/root2', function(done){
				d.request.post('/db/internal/user/add/pinned')
				.send({username: 'admin', pinned: isWindows?root+'ProgramData':'//lib'})
				.expect(200, 'true').end(function(err){ //TODO this should return false
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users',root+'programdata']:['/usr','/lib']).end(done);
				});
			});
			it('is pinned \\Root', function(done){
				d.request.post('/db/internal/user/is/pinned')
				.send({username: 'admin', pinned: isWindows? root+'Users':'\\usr'})
				.expect(200, 'true').end(done);
			});
			it('is pinned non-existant', function(done){
				d.request.post('/db/internal/user/is/pinned')
				.send({username: 'admin', pinned: '/abc/123/fregfgerg'})
				.expect(200, 'false').end(done);
			});
			it('remove pinned //root', function(done){
				d.request.post('/db/internal/user/remove/pinned')
				.send({username: 'admin', pinned: isWindows?root+'ProgramData':'//lib'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users']:['/usr']).end(done);
				});
			});
			it('remove pinned non-existant', function(done){
				d.request.post('/db/internal/user/remove/pinned')
				.send({username: 'admin', pinned: isWindows?'//':'/USr'})
				.expect(200, 'true').end(function(err){ //TODO this should return false
					if(err) return done(err);
					d.request.post('/db/internal/user/get/pinned')
					.send({username: 'admin'})
					.expect(200, isWindows?[root+'users']:['/usr']).end(done);
				});
			});
		});
		describe('view', function(){
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
			it('blueprint', function(done){
				d.request.post('/db/internal/user/blueprint')
				.expect(d.removeIds)
				.expect(200, {
					Username: '',
					Password: 'password',
					'Authentication Service': 'Internal',
					Language: 'English',
					Email: '',
					Status: 'Active',
					Note: '',
					'IBM Marketing': {
						Username: '',
						Password: ''
					},
					Name: {
						First: '',
						Middle: '',
						Last: ''
					},
					Phone: {
						Office: '',
						Mobile: ''
					},
					Bookmarks: [{
						key: 'Name',
						value: 'URL'
					}]
				}).end(done);
			});
			it('all', function(done){
				d.request.post('/db/internal/user/get/all')
				.expect(d.removeIds)
				.expect(200, [{
					Username: 'Admin',
					Password: '******',
					'Authentication Service': 'Internal',
					Status: 'Active',
					Language: 'English',
					Email: 'ganna.shmatova@cleargoals.com',
					'IBM Marketing': {
						Username: d.externalLogin.username,
						Password: '******'
					},
					Name: {First: '', Middle: '', Last: ''},
					Phone: {Mobile: '', Office: ''},
					Bookmarks: [{
						key: 'Home', value: 'localhost',
					},{
						key: 'Google', value: 'http://google.com'
					}],
					Note: 'What a doozy',
					Pinned: [isWindows?root+'users': '/usr']
				}]).end(done);
			});
			it('one', function(done){
				d.request.post('/db/internal/user/get')
				.send({username: 'admin'})
				.expect(d.removeIds)
				.expect(200, {
					Username: 'Admin',
					Password: '******',
					'Authentication Service': 'Internal',
					Status: 'Active',
					Language: 'English',
					Email: 'ganna.shmatova@cleargoals.com',
					'IBM Marketing': {
						Username: d.externalLogin.username,
						Password: '******'
					},
					Name: {First: '', Middle: '', Last: ''},
					Phone: {Mobile: '', Office: ''},
					Bookmarks: [{
						key: 'Home', value: 'localhost',
					},{
						key: 'Google', value: 'http://google.com'
					}],
					Note: 'What a doozy',
					Pinned: [isWindows?root+'users': '/usr']
				}).end(done);
			});
			it('user\'s language', function(done){
				d.request.post('/db/internal/user/get/language')
				.send({username: 'admin'})
				.expect(200, ['English']).end(done);
			});
			it('user\'s bookmarks', function(done){
				d.request.post('/db/internal/user/get/bookmarks')
				.send({username: 'admin'})
				.expect(200, [{
					key: 'Home',
					value: 'localhost',
				},{
					key: 'Google',
					value: 'http://google.com'
				}]).end(done);
			});
			it('all email', function(done){
				d.request.post('/db/internal/user/get/all/emails')
				.expect(200, ['ganna.shmatova@cleargoals.com']).end(done);
			});
			it('user\'s email', function(done){ //TODO this shouldn't return an array, but rather just a string
				d.request.post('/db/internal/user/get/email')
				.send({username: 'admin'})
				.expect(200, ['ganna.shmatova@cleargoals.com']).end(done);
			});
		});
	});
};