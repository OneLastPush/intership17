module.exports = function(d){
	describe('db', function(){
		it('version', function(done){
			d.request.post('/'+d.mount+'/app/db/version')
			.expect(200)
			.end(function(err, res){
				if(err)
					return done(err);
				var versionsExpected = d.db;
				for(var i=0; i<versionsExpected.length; i++){
					if(!res.body[versionsExpected[i]])
						return done(new Error('missing version ' + versionsExpected[i]));
				}
				done();
			});
		});
		it('get users', function(done){
			d.request.post('/'+d.mount+'/app/db/users')
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				//check the data
				var data = res.body;
				if(! (data || data instanceof Array))
					throw new Error('No data returned or data is not an array as expected');
				if(data.length < 2)
					throw new Error('Data has less than 2 records in it');
				var record = data[0];
				if(!(record.ID && record.NAME && record.STATUS))
					throw new Error('Data record is missing ID or Name or STATUS');
				done();
			});
		});
		it('get policies', function(done){
			d.request.post('/'+d.mount+'/app/db/policies')
			.expect(200)
			.end(function(err, res){
				if(err)
					throw err;
				var data = res.body;
				if(! (data || data instanceof Array))
					throw new Error('No data returned or data is not an array as expected');
				if(data.length < 2)
					throw new Error('Data has less than 2 records in it');
				var record = data[0];
				if(!(record.ID && record.NAME && record.DISPLAY_NAME))
					throw new Error('Data record is missing ID or Name or DISPLAY_NAME');
				done();
			});
		});
		it('validate campaign code exists', function(done){
			d.request.post('/'+d.mount+'/app/db/campaigncode/validate')
			.send({code: d.validCampaignCode})
			.expect(200, 'true')
			.end(function(err, res){
				if(err)
					throw err;
				done();
			});
		});
		it('validate campaign code doesn\'t exist', function(done){
			d.request.post('/'+d.mount+'/app/db/campaigncode/validate')
			.send({code: 'ergfggreft'})
			.expect(200, 'false')
			.end(function(err, res){
				if(err)
					throw err;
				done();
			});
		});
		it('validate flowchart name exists', function(done){
			d.request.post('/'+d.mount+'/app/db/flowchartname/validate')
			.send({name: d.validFlowchartName})
			.expect(200, 'true')
			.end(function(err, res){
				if(err)
					throw err;
				done();
			});
		});
		it('validate flowchart name doesn\'t exist', function(done){
			d.request.post('/'+d.mount+'/app/db/flowchartname/validate')
			.send({name: 'ergfggreft'})
			.expect(200, 'false')
			.end(function(err, res){
				if(err)
					throw err;
				done();
			});
		});
	});
}