var path = require('path');
var fs = require('fs');

module.exports = {
	test: function(request){
		after(function(done){
			fs.unlink('./test/test/dir/test_download.txt', done);
		});
		after(function(done){
			fs.unlink('./test/test/dir/nonbinary.txt', done);
		});
		after(function(done){
			fs.readdir('./test/archive', function(err, files){
				if(err) throw err;
				files.forEach(function(file){
					fs.unlinkSync(path.join('./test/archive', file));
				});
				fs.rmdir('./test/archive', done);
			});
		});
		after(function(done){
			fs.readdir('./test/split', function(err, files){
				if(err) throw err;
				files.forEach(function(file){
					fs.unlinkSync(path.join('./test/split', file));
				});
				fs.rmdir('./test/split', done);
			});
		});
		after(function(done){
			fs.rmdir('test/dir/innerDir', done);
		});
		after(function(done){
			fs.rmdir('test/dir/innerDir2', done);
		});
		after(function(done){
			fs.rmdir('test/dir', done);
		});

		// TODO if piping ever gets fixed, fix this test to be nicer. Right now hacky.
		// https://github.com/visionmedia/supertest/issues/241
		describe('download', function(){
			it('file', function(done){
				request.get('/download').expect(200)
				.send({'file': './test/test/nonbinary.txt'})
				.on('end', function(){
					fs.exists('./test/test/dir/test_download.txt', function(exists){
						if(!exists)
							throw new Error('downloaded file is missing');
						done();
					});
				}).pipe(fs.createWriteStream('./test/test/dir/test_download.txt'));
			});
			it('folder', function(done){
				request.get('/download').expect(200)
				.send({'folder': './test/test'})
				.on('end', function(){
					fs.exists('./test/test/dir/test.zip', function(exists){
						if(!exists)
							throw new Error('downloaded file is missing');
						done();
					});
				}).pipe(fs.createWriteStream('./test/test/dir/test.zip'));
			});
		});

		describe('upload', function(){
			it('new file', function(done){
				request.post('/upload').expect(200)
				.field('uploadTo', './test/test/dir')
				.attach('file', fs.createReadStream('./test/test/nonbinary.txt'))
				.expect(function(res){
					if(!fs.existsSync('./test/test/dir/nonbinary.txt'))
						throw new Error('file was not found');
				}).end(done);
			});
			it('duplicate file/existing file', function(done){
				request.post('/upload').expect(409)
				.field('uploadTo', './test/test/dir')
				.attach('file', fs.createReadStream('./test/test/nonbinary.txt'))
				.end(done);
			});
			it('duplicate file/existing file force', function(done){
				request.post('/upload').expect(200)
				.field('uploadTo', './test/test/dir')
				.field('force', 'true')
				.attach('file', fs.createReadStream('./test/test/nonbinary.txt'))
				.end(done);
			});
		});

		describe('delete', function(){
			it('file', function(done){
				fs.writeFile('./test/test/dir/deleteTest.txt', 'delete me', function(err){
					if(err) throw err;
					request.get('/delete').expect(200)
					.send({'file': './test/test/dir/deleteTest.txt'})
					.expect(function(res){
						if(fs.existsSync('./test/test/dir/deleteTest.txt'))
							throw new Error('file still exists after delete');
					}).end(done);
				});
			});
			it('folder', function(done){
				fs.mkdir('./test/test/dir/testdir', function(err){
					if(err) throw err;
					request.get('/delete').expect(200)
					.send({folder: './test/test/dir/testdir'})
					.expect(function(res){
						if(fs.existsSync('./test/test/dir/testdir.txt'))
							throw new Error('folder still exists after delete');
					}).end(done);
				});
			});
		});

		describe('ensure directory', function(){
			it('make deep directory', function(done){
				request.post('/mkdir').expect(200)
				.send({
					folder: 'test/dir/innerDir'
				}).end(done);
			});
			it('make directory', function(done){
				request.post('/mkdir').expect(200)
				.send({
					folder: 'test/dir/innerDir2'
				}).end(done);
			});
			it('make duplicate directory', function(done){
				request.post('/mkdir') //just so it doens't crash.
				.send({
					folder: 'test/dir/innerDir'
				}).end(done);
			});
		});

		describe('archive', function(){
			var archiveTests = [
				{ desc: 'new', archiveFile: './test/archive/archiveTest.txt.zip'},
				{ desc: 'duplicate', archiveFile: './test/archive/archiveTest.txt(1).zip'},
				{ desc: 'duplicate again', archiveFile: './test/archive/archiveTest.txt(2).zip'}
			];
			archiveTests.forEach(function(test){
				it(test.desc, function(done){
					fs.writeFile('./test/test/archiveTest.txt', 'archive me', function(err){
						if(err) throw err;

						request.get('/archive').expect(200)
						.send({
							'file': './test/test/archiveTest.txt',
							'archiveTo': './test/archive'
						}).expect(function(res){
							if(fs.existsSync('./test/test/archiveTest.txt'))
								throw new Error('archived file still exists in original directory');
							if(!fs.existsSync(test.archiveFile))
								throw new Error('archived file is not in archive directory');
						}).end(done);
					});
				});
			});
		});

		it('split', function(done){
			request.get('/split').expect(200)
			.send({
				file: './test/test\\nonbinary.txt',
				output: './test/split'
			}).expect(function(res){
				var files = fs.readdirSync('./test/split');
				if(files.indexOf('nonbinary_1.txt') === -1 || files.indexOf('nonbinary_2.txt') === -1)
					throw new Error('cannot find split file(s)');
			}).end(done);
		});
	}
};