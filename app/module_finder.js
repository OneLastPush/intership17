var path = require('path');

var find = require('find');

module.exports = function(searchPath){
	var files = find.fileSync(/test\.js/, searchPath);

	files = files.filter(function(file, index, array){
		if(file.match('node_modules') || file.match('jdbc-generic')) //TODO jdbc module is broken. Again.
			return false;
		if(file === __filename)
			return false;
		return true;
	});
	files.forEach(function(file, index, array){
		array[index] = path.join(file, '..', '..');
	});

	return files;
};