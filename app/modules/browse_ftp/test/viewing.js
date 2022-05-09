var path = require('path');
var fs = require('fs');

function testDirChildren(data){
	if(data.length===0)
		throw new Error('did not get any files or folders');
	var dir, binary, nonbinary;
	data.forEach(function(f){
		if(f.folder)
			dir = true;
		if(f.binary)
			binary = true;
		if(!f.binary)
			nonbinary = true;
	});
	if(!dir)
		throw new Error('Directory not detected');
	// if(!binary)
	// 	throw new Error('Binary not detected');
	if(!nonbinary)
		throw new Error('Non-binary not detected');
}

module.exports = {
	test: function(request, server){
		before(function(done){
			request.post('/upload')
			.field('server', server)
			.field('uploadTo', '.')
			.attach('file', fs.createReadStream('./test/test/testMe.txt'))
			.end(function(){
				done();
			});
		});
		before(function(done){
			request.post('/mkdir')
			.send({
				server: server,
				folder: 'testDir'
			}).end(function(){
				done();
			});
		});
		after(function(done){
			request.post('/delete')
			.send({server: server, file: 'testMe.txt'})
			.end(function(){
				done();
			});
		});
		after(function(done){
			request.post('/delete')
			.send({server: server, folder: 'testDir'})
			.end(function(){
				done();
			});
		});

		describe('directory listing', function(){
			it('all', function(done){
				request.get('/').expect(200)
				.send({
					server: server,
					folder: './'
				}).expect(function(res){
					var data = JSON.parse(res.text);
					//console.log(data);
					if(data.folder!==true)
						throw new Error('wrapping not recognized as directory/folder');
					testDirChildren(data.children);
				}).end(done);
			});
			it('children only', function(done){
				request.get('/').expect(200)
				.send({
					server: server,
					folder: './',
					justChildren: true
				}).expect(function(res){
					var data = JSON.parse(res.text);
					testDirChildren(data);
				}).end(done);
			});
			it('extension filtered', function(done){
				request.get('/').expect(200)
				.send({
					server: server,
					folder: './',
					justChildren: true,
					exts: ['txt']
				}).expect(function(res){
					var data = JSON.parse(res.text);
					data.forEach(function(f){
						if(!f.folder && '.txt' !== path.extname(f.title))
							throw new Error('got file other than .txt');
					});
				}).end(done);
			});
		});
		describe('info', function(){
			describe('exists', function(){
				it('folder', function(done){
					request.get('/exists').expect(200)
					.send({
						server: server,
						folder: 'testDir'
					}).expect('true')
					.end(done);
				});
				it('file', function(done){
					request.get('/exists').expect(200)
					.send({
						server: server,
						file: 'testMe.txt'
					}).expect('true')
					.end(done);
				});
				it('does not exist', function(done){
					request.get('/exists').expect(200)
					.send({
						server: server,
						file: 'regdfegfger'
					}).expect('false')
					.end(done);
				});
			});
			describe('system info', function(){
				it('file', function(done){
					request.get('/info').expect(200)
					.send({
						server: server,
						file: 'testMe.txt'
					}).expect(function(res){
						var data = JSON.parse(res.text);
						//console.log(data);
						if(!data.location)
							throw new Error('location');
						if(!data.name)
							throw new Error('name');
						if(!data.extension)
							throw new Error('extension');
						if(data.size === undefined || data.size === null)
							throw new Error('size');
						// if(!data.created)
						// 	throw new Error('created');
						if(!data.modified)
							throw new Error('modified');
						// if(!data.accessed)
						// 	throw new Error('accessed');
						if(!data.permissions)
							throw new Error('permissions');
						if(data.owner === null)
							throw new Error('owner');
						if(data.group === null)
							throw new Error('group');
					}).end(done);
				});
				it('folder', function(done){
					request.get('/info').expect(200)
					.send({
						server: server,
						folder: 'testDir'
					}).expect(function(res){
						var data = JSON.parse(res.text);
						//console.log(data);
						if(!data.location)
							throw new Error('location');
						if(!data.name)
							throw new Error('name');
						if(data.extension)
							throw new Error('extension');
						if(data.size === undefined || data.size === null)
							throw new Error('size');
						// if(!data.created)
						// 	throw new Error('created');
						if(!data.modified)
							throw new Error('modified');
						// if(!data.accessed)
						// 	throw new Error('accessed');
						if(!data.permissions)
							throw new Error('permissions');
						if(data.owner === null)
							throw new Error('owner');
						if(data.group === null)
							throw new Error('group');
					}).end(done);
				});
			});
		});
	}
};