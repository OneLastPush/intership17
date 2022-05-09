var os = require('os');
var path = require('path');

var isWindows = os.platform() === 'win32';
var root = path.parse(__dirname).root.toUpperCase();

module.exports = function(d){
	describe('group', function(){
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
				d.request.post('/db/internal/group/set')
				.send({group: 'Basic', data: {Users: []}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get')
					.send({group: 'Basic'})
					.expect(d.removeIds)
					.expect(200, {
						Name: 'Basic',
						Users: [],
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
			it('add', function(done){
				d.request.post('/db/internal/group/set')
				.send({data: {Name: 'Secret'}})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get')
					.send({group: 'Secret'})
					.expect(d.removeIds)
					.expect(200, {
						Name: 'Secret',
						Users: [],
						Permissions: [],
						'Viewable file types': [],
						'File system permissions': []
					}).end(done);
				});
			});
			it('remove', function(done){
				d.request.post('/db/internal/group/remove')
				.send({group: 'Secret'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/group/get')
					.send({group: 'Secret'})
					.expect(d.removeIds)
					.expect(404).end(done);
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
				d.request.post('/db/internal/group/blueprint')
				.expect(d.removeIds)
				.expect(200, {
					Name: '',
					Users: [],
					Permissions: [],
					'Viewable file types': [],
					'File system permissions':[]
				}).end(done);
			});
			it('all', function(done){
				d.request.post('/db/internal/group/get/all')
				.expect(d.removeIds)
				.expect(200, [{
					Name: 'Basic',
					Users: [],
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
				},{
					Name: 'Administrator',
					Users: ['Admin'],
					Permissions: [
						'manage sessions',
						'review log files',
						'recompute catalogs/flowcharts',
						'view server stats',
						'access console',
						'start & stop the environment',
						'add / remove / modify users',
						'read / write config'
					],
					'Viewable file types': ['*'],
					'File system permissions': [{
						Path: root,
						Rank: 0,
						'Can download': true,
						'Can upload': true,
						'Can archive': true,
						'Can delete': true,
						'Propogate to subfolders': true
					}]
				}]).end(done);
			});
			it('one', function(done){
				d.request.post('/db/internal/group/get')
				.send({group: 'Basic'})
				.expect(d.removeIds)
				.expect(200, {
					Name: 'Basic',
					Users: [],
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
			it("user's groups", function(done){
				d.request.post('/db/internal/group/get/user')
				.send({username: 'admin'})
				.expect(d.removeIds)
				.expect(200, ['Administrator'])
				.end(done);
			});
			it('permissions', function(done){
				d.request.post('/db/internal/group/get/permissions')
				.send({username: 'admin'})
				.expect(d.removeIds)
				.expect(200, [
					'manage sessions',
					'review log files',
					'recompute catalogs/flowcharts',
					'view server stats',
					'access console',
					'start & stop the environment',
					'add / remove / modify users',
					'read / write config'
				]).end(done);
			});
			it('path permissions', function(done){
				d.request.post('/db/internal/group/get/path/permissions')
				.send({username: 'admin'})
				.expect(d.removeIds)
				.expect(200, [{
					Path: root,
					Rank: 0,
					'Can download': true,
					'Can upload': true,
					'Can archive': true,
					'Can delete': true,
					'Propogate to subfolders': true
				}]).end(done);
			});
			it('specific path permission', function(done){
				d.request.post('/db/internal/group/get/path/permissions')
				.send({username: 'admin', path: isWindows? root+'programdata': '/usr'})
				.expect(d.removeIds)
				.expect(200, {
					Path: isWindows? root+'programdata': '/usr',
					Rank: 0,
					'Can download': true,
					'Can upload': true,
					'Can archive': true,
					'Can delete': true,
					'Propogate to subfolders': true
				}).end(done);
			});
			it('viewable filetypes', function(done){
				d.request.post('/db/internal/group/get/filetypes')
				.send({username: 'admin'})
				.expect(d.removeIds)
				.expect(200, [
					'*'
				]).end(done);
			});
			it('emails', function(done){
				d.request.post('/db/internal/group/get/emails')
				.send({group: 'Administrator'})
				.expect(d.removeIds)
				.expect(200, ['ganna.shmatova@cleargoals.com'])
				.end(done);
			});
		});
	});
};