var fs = require('fs');
var path = require('path');
var find = require('find');
var rimraf = require('rimraf');
var exec = require('child_process').exec;

var home = path.join('..', '..', __dirname);
var productionFolder = 'build';

var appFrom = path.join(__dirname, '..', 'master');
var webTo = path.join(__dirname, 'build', 'app');

var webFrom = path.join(__dirname, '..', '..', 'web');
var webTo = path.join(__dirname, 'build', 'web', 'public');

//debug
var doErr = function(err){
	if(err) console.log(err.stack);
};

//utils
function ensureDirectory(dir, cb){
	dir = path.normalize(dir);
	var folders = dir.split(path.sep);

	var startCntr = 0;
	var doneCntr = folders.length;
	var ensure;
	function doNext(){ //go folder by folder
		var index = startCntr++;
		ensure = [];
		for(var j=0; j<=index; j++)
			ensure.push(folders[j]);

		ensure = path.join.apply(path, ensure);

		fs.exists(ensure, function(exists){ //make if doesn't exist
			if(exists){
				done();
			}else{
				fs.mkdir(ensure, function(err){
					done();
				});
			}
		});

		function done(){
			if(--doneCntr===0){
				if(cb) cb();
			}else
				doNext();
		}
	}
	doNext(); //start
}
function copyFile(from, to){
	var rs = fs.createReadStream(from);
	var ws = fs.createWriteStream(to);
	rs.on('error', doErr);
	ws.on('error', doErr);
	rs.pipe(ws);
}

//start
var UglifyJS = require('uglify-js');
(function(){ //backend
	var production = appTo;
	var from = appFrom;
	//deletes old code if any
	rimraf(production, function(err){

		find.file(/.+/, from, function(files){
			console.log(files.length + ' total files in app directory ' + from);

			//divide into file types
			var copyFiles = [];
			var jsFiles = [];

			files.forEach(function(file){
				if(file.indexOf('node_modules') >= 0){
					//node module file, so we ignore
				}else{
					if(path.extname(file) == '.js'){
						jsFiles.push(file);
					}else{
						if(path.basename(file) == 'package.json' ||
							file.replace(from, '').match(/^[\\\/](jdbc|public|ssl)/)){
							copyFiles.push(file);
						}	
					}
				}
			});

			//javascript scrambled files to paste
			console.log(jsFiles.length + ' JS files in app');
			jsFiles.forEach(function(file){
				var newLoc = file.replace(from, production);
				ensureDirectory(path.dirname(newLoc), function(){
					fs.writeFile(newLoc, UglifyJS.minify(file).code, doErr);
				});
			});

			//data files to copy
			console.log(copyFiles.length + ' files to copy in app');
			
			copyFiles.forEach(function(file){
				var newLoc = file.replace(from, production);

				ensureDirectory(path.dirname(newLoc), function(){
					copyFile(file, newLoc);
				});
			});

			//default files to plug in
			var folder = path.join(from, 'defaults');
			fs.readdir(folder, function(err, files){
				if(files && files.length > 0){ //if theres defaults
					console.log(files.length + ' default files to copy in app');

					ensureDirectory(folder, function(){
						files.forEach(function(file){
							copyFile(path.join(folder, file), path.join(production, path.basename(file)));
						});
					});
				}
			});
		});
	});
})();

(function(){ //front-end
	var production = webTo;
	var from = webFrom;

	//deletes old code if any
	rimraf(production, function(err){
		//compile jade
		exec('node compile.js', {cwd: path.join(from, '..')}, function(err, stdout, stderr){
			if(err)
				console.log(err.stack);
			if(stderr)
				console.log(stderr);
			console.log(stdout);

			//copy files over (but .js scrambled)
			find.file(/.+/, from, function(files){
				console.log(files.length + ' total files in web directory ' + from);

				files.forEach(function(file){
					var newLoc = file.replace(from, production);
					ensureDirectory(path.dirname(newLoc), function(){
						if(path.extname(file) == '.js'){
							fs.writeFile(newLoc, UglifyJS.minify(file).code, doErr);
						}else{
							copyFile(file, newLoc);
						}
					});
				});
			});

		});
	});
})();


(function(){ // copy additional files for this project
	var production = productionFolder;
	var from = home;

	var files = ['README.md', 'install.js'];

	console.log(files.length + ' project files to copy');
	ensureDirectory(production, function(){
		files.forEach(function(file){
			file = path.join(from, file);
			copyFile(file, file.replace(from, production));
		});
	});
})();