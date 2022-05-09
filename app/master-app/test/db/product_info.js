module.exports = function(d){
	describe('product_info', function(){
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
		describe('set', function(){
			it('add with no date', function(done){
				d.request.post('/db/internal/product_info/set')
				.send({
					data: {
						Product: 'Apples',
						'Date purchased': '',
						'Customer number': '123123',
						Description: 'Yummy',
						Support: {
							Name: 'Farmer Roge',
							Email: '',
							Phone: ''
						}
					}
				}).expect(200, 'true').end(done);
			});
			it('add with date', function(done){
				d.request.post('/db/internal/product_info/set')
				.send({
					data: {
						Product: 'Apples2',
						'Date purchased': '20 january 2016',
						'Customer number': '123123',
						Description: 'Yummy',
						Support: {
							Name: 'Farmer Roge',
							Email: '',
							Phone: ''
						}
					}
				}).expect(200, 'true').end(done);
			});
			it('update date', function(done){
				d.request.post('/db/internal/product_info/set')
				.send({
					product: 'Apples',
					data: {
						Product: 'Pie',
						'Date purchased': 'August 26 2014',
						Description: 'Ewwie',
						Support: {
							Name: 'Mechanical factory',
						}
					}
				}).expect(200, 'true').end(done);
			});
			it('remove', function(done){
				d.request.post('/db/internal/product_info/remove')
				.send({product: 'Apples2'})
				.expect(200, 'true').end(function(err){
					if(err) return done(err);
					d.request.post('/db/internal/product_info/get')
					.send({product: 'Apples2'})
					.expect(404).end(done);
				});
			});
		});
		describe('view', function(){
			it('blueprint', function(done){
				d.request.post('/db/internal/product_info/blueprint')
				.expect(d.removeIds)
				.expect(200, {
					Product: '',
					'Date purchased': '',
					'Customer number': '',
					Description: '',
					Support: {
						Name: '',
						Email: '',
						Phone: ''
					}
				}).end(done);
			});
			it('all', function(done){
				d.request.post('/db/internal/product_info/get/all')
				.expect(d.removeIds)
				.expect(200, [{
					Product: 'Pie',
					'Date purchased': '2014-08-26T04:00:00.000Z',
					'Customer number': '123123',
					Description: 'Ewwie',
					Support: {
						Name: 'Mechanical factory',
						Email: '',
						Phone: ''
					}
				}]).end(done);
			});
		});
	});
};