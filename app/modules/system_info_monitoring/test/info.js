

module.exports = {
	test: function(request){
		var notNull = function(res){
			if(!res.text)
				throw new Error('no response returned');
		};
		var infoTests = [
			{ attr: 'uptime', expect: notNull },
			{ attr: 'cpu', expect: notNull },
			{ attr: 'ram', expect: notNull },
			{ attr: 'swap', expect: notNull },
			{ attr: 'disk', expect: notNull },
			{ attr: 'network', expect: notNull }
		];
		infoTests.forEach(function(test){
			it(test.attr, function(done){
				request.get('/sys/'+test.attr).expect(200)
				.expect(test.expect)
				.end(done);
			});
		});

		it('all', function(done){
			request.get('/sys').expect(200)
			.expect(function(res){
				if(res.text){
					var data = JSON.parse(res.text);
					if(!data.host_name)
						throw new Error('missing host name');
					if(!data.type)
						throw new Error('missing type');
					if(!data.platform)
						throw new Error('missing platform');
					if(!data.architecture)
						throw new Error('missing architecture');
					if(!data.release)
						throw new Error('missing release');
					if(!data.model)
						throw new Error('missing model');
					if(!data.cpus || data.cpus.length===0)
						throw new Error('missing cpus');
					else{
						data.cpus.forEach(function(cpu){
							if(!cpu.model)
								throw new Error('cpu is missing model');
							if(!cpu.ticks_since_boot)
								throw new Error('cpu is missing ticks since boot');
							if(!cpu.usage)
								throw new Error('cpu is missing usage');
						});
					}
					if(!data.ram)
						throw new Error('missing ram');
					else{
						if(data.ram.free === undefined || data.ram.free === null)
							throw new Error('missing free ram');
						if(data.ram.total === undefined || data.ram.total === null)
							throw new Error('missing total ram');
						if(data.ram.used === undefined || data.ram.used === null)
							throw new Error('missing used ram');
					}
					if(!data.swap)
						throw new Error('missing swap');
					else{
						if(data.swap.free === undefined || data.swap.free === null)
							throw new Error('missing free swap');
						if(data.swap.total === undefined || data.swap.total === null)
							throw new Error('missing total swap');
						if(data.swap.used === undefined || data.swap.used === null)
							throw new Error('missing used swap');
					}
					if(!data.network.usage){
						throw new Error('missing network usage');
					}else{
						if(data.network.usage.download === undefined || data.network.usage.download === null)
							throw new Error('missing network download');
						if(data.network.usage.upload === undefined || data.network.usage.upload === null)
							throw new Error('missing network upload');
					}
					if(!data.network.interfaces)
						throw new Error('missing network interfaces');
					if(!data.disk_usage)
						throw new Error('missing disk usage');
				}else{
					throw new Error('no response returned');
				}
			}).end(done);
		});
	}
};