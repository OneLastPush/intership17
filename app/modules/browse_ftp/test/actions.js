var path = require('path');
var fs = require('fs');

module.exports = {
	test: function(request, server){
		before(function(done){
			request.post('/upload')
			.field('server', server)
			.field('uploadTo', '.')
			.attach('file', fs.createReadStream('./test/test/deleteMe.txt'))
			.end(function(){
				done();
			});
		});
		before(function(done){
			request.post('/upload')
			.field('server', server)
			.field('uploadTo', '.')
			.attach('file', fs.createReadStream('./test/test/downloadMe.txt'))
			.end(function(){
				done();
			});
		});
		after(function(done){
			fs.unlink('./test/test/downloadMeDownloaded.txt', function(){
				done();
			});
		});
		after(function(done){
			request.get('/delete')
			.send({
				server: server,
				file: './uploadMe.txt'
			}).end(function(){
				done();
			});
		});
		after(function(done){
			request.get('/delete').expect(200)
			.send({
				server: server,
				file: './downloadMe.txt'
			}).end(function(){
				done();
			});
		});
		after(function(done){
			request.get('/delete').expect(200)
			.send({
				server: server,
				folder: 'dir/innerDir'
			}).end(function(){
				done();
			});
		});
		after(function(done){
			request.get('/delete').expect(200)
			.send({
				server: server,
				folder: 'dir/innerDir2'
			}).end(function(){
				done();
			});
		});
		after(function(done){
			request.get('/delete').expect(200)
			.send({
				server: server,
				folder: './dir'
			}).end(function(){
				done();
			});
		});

		// TODO if piping ever gets fixed, fix this test to be nicer. Right now hacky.
		// https://github.com/visionmedia/supertest/issues/241
		it('download', function(done){
			request.get('/download').expect(200)
			.send({
				server: server,
				file: './downloadMe.txt'
			}).on('end', function(){
				fs.exists('./test/test/downloadMe.txt', function(exists){
					if(!exists)
						throw new Error('downloaded file is missing');
					done();
				});
			}).pipe(fs.createWriteStream('./test/test/downloadMeDownloaded.txt'));
		});
		describe('upload', function(){
			it('new file', function(done){
				request.post('/upload').expect(200)
				.field('server', server)
				.field('uploadTo', '.')
				.attach('file', fs.createReadStream('./test/test/uploadMe.txt'))
				.expect(function(res){
					//console.log(res.text);
				}).end(done);
			});
			it('duplicate file/existing file', function(done){
				request.post('/upload').expect(409)
				.field('server', server)
				.field('uploadTo', '.')
				.attach('file', fs.createReadStream('./test/test/uploadMe.txt'))
				.expect(function(res){
					//console.log(res.text);
				}).end(done);
			});
		});

		it('delete', function(done){
			request.get('/delete').expect(200)
			.send({
				server: server,
				file: './deleteMe.txt'
			}).end(done);
		});

		describe('ensure directory', function(){
			it('make deep directory', function(done){
				request.post('/mkdir').expect(200)
				.send({
					server: server,
					folder: 'dir/innerDir'
				}).end(done);
			});
			it('make directory', function(done){
				request.post('/mkdir').expect(200)
				.send({
					server: server,
					folder: 'dir/innerDir2'
				}).end(done);
			});
			it('make duplicate directory', function(done){
				request.post('/mkdir') //just so it doens't crash.
				.send({
					server: server,
					folder: 'dir/innerDir'
				}).end(done);
			});
		});
	}
};