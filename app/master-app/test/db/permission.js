module.exports = function(d){
	describe('permission', function(){
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
		it('view all', function(done){
			d.request.post('/db/internal/permission/get/all')
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
	});
};