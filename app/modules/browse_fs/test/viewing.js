var path = require('path');
var fs = require('fs');

function testDirChildren(data){
	if(data.length!=4)
		throw new Error('did not get the right number of files');
	data.forEach(function(f){
		switch(f.title){
			case 'dir':
				if(f.folder !== true)
					throw new Error('folder not recognized as folder');
				break;
			case 'nonbinary.txt':
				break;
			case 'binary.exe':
				break;
			case 'extensionless':
				break;
			default:
				throw new Error('file names do not match expected file names/titles');
		}
	});
}

var firstLine = function(res){
	if(res.text){
		if(res.text !== 'segment,name,things\r\n<<< more >>> ...')
			throw new Error('File first line contents do not match expected');
	}else{
		throw new Error('File reading returned empty');
	}
};
var lastLine = function(res){
	if(res.text){
		if(res.text !== '... <<< more >>>\n2,name3,things3')
			throw new Error('File last line contents do not match expected');
	}else{
		throw new new Error('File reading returned empty');
	}
};

module.exports = {
	test: function(request){
		describe('directory listing', function(){
			it('all', function(done){
				request.get('/').expect(200)
				.send({
					folder: './test/test'
				}).expect(function(res){
					var data = JSON.parse(res.text);
					if(data.folder!==true)
						throw new Error('wrapping not recognized as directory/folder');
					testDirChildren(data.children);
				}).end(done);
			});
			it('children only', function(done){
				request.get('/').expect(200)
				.send({
					folder: './test/test',
					justChildren: true
				}).expect(function(res){
					var data = JSON.parse(res.text);
					testDirChildren(data);
				}).end(done);
			});
			it('extension filtered', function(done){
				request.get('/').expect(200)
				.send({
					folder: './test/test',
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
					.send({folder: './test/test'})
					.expect('true')
					.end(done);
				});
				it('file', function(done){
					request.get('/exists').expect(200)
					.send({'file': './test/test/nonbinary.txt'})
					.expect('true')
					.end(done);
				});
				it('does not exist', function(done){
					request.get('/exists').expect(200)
					.send({'file': './test/test/abcabc'})
					.expect('false')
					.end(done);
				});
			});
			describe('system info', function(){
				it('file non-binary', function(done){
					request.get('/info').expect(200)
					.send({'file': './test/test/nonbinary.txt'})
					.expect(function(res){
						var data = JSON.parse(res.text);
						if(!data.location)
							throw new Error('location');
						if(data.name !== 'nonbinary.txt')
							throw new Error('name');
						if(data.extension !== 'txt')
							throw new Error('extension');
						if(data.binary)
							throw new Error('expected non binary but was binary');
						if(data.size !== 73)
							throw new Error('size was to be 73, was ' + data.size);
						if(!data.created)
							throw new Error('created');
						if(!data.modified)
							throw new Error('modified');
						if(!data.accessed)
							throw new Error('accessed');
						if(!data.permissions)
							throw new Error('permissions');
						if(data.owner === null)
							throw new Error('owner');
						if(data.group === null)
							throw new Error('group');
					}).end(done);
				});
				it('file binary', function(done){
					request.get('/info').expect(200)
					.send({'file': './test/test/binary.exe'})
					.expect(function(res){
						var data = JSON.parse(res.text);
						if(!data.location)
							throw new Error('location');
						if(data.name !== 'binary.exe')
							throw new Error('name');
						if(data.extension !== 'exe')
							throw new Error('extension');
						if(!data.binary)
							throw new Error('expected binary but was non-binary');
						if(data.size !== 116992)
							throw new Error('size was to be 116992, was ' + data.size);
						if(!data.created)
							throw new Error('created');
						if(!data.modified)
							throw new Error('modified');
						if(!data.accessed)
							throw new Error('accessed');
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
					.send({folder: './test/test/dir'})
					.expect(function(res){
						var data = JSON.parse(res.text);
						if(!data.location)
							throw new Error('location');
						if(data.name !== 'dir')
							throw new Error('name');
						if(data.extension !== '')
							throw new Error('extension');
						if(data.size !== 0)
							throw new Error('size');
						if(!data.created)
							throw new Error('created');
						if(!data.modified)
							throw new Error('modified');
						if(!data.accessed)
							throw new Error('accessed');
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

		describe('read contents', function(){
			var readerTests = [
				{ desc: 'whole file', expect: function(res){
					if(res.text){
						fs.readFile('./test/nonbinary.txt', {encoding:'utf8'},function(err, data){
							if(err)
								throw err;
							if(res.text !== data)
								throw new Error('File contents do not match');
						});
					}else{
						throw new Error('File reading returned empty');
					}
				}},
				{ desc: 'first line', lines: 1, expect: firstLine },
				{ desc: 'last line', lines: -1, expect: lastLine },
				{ desc: 'head line', lines: 1, action: 'head', expect: firstLine },
				{ desc: 'tail line', lines: 1, action: 'tail', expect: lastLine },
				{ desc: 'head -1 line still heads', lines: -1, action: 'head', expect: firstLine },
				{ desc: 'tail -1 line still tails', lines: -1, action: 'tail', expect: lastLine }
			];
			readerTests.forEach(function(test){
				it(test.desc, function(done){
					request.get('/file').expect(200)
					.send({
						file: './test/test/nonbinary.txt',
						action: test.action,
						lines: test.lines
					}).expect(test.expect)
					.end(done);
				});
			});
		});
	}
};