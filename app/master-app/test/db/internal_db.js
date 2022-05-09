var path = require('path');
var assert = require('assert');
var os = require('os');

var rimraf = require('rimraf');

var isWindows = os.platform() === 'win32';

module.exports = function(d){
	describe('internal_db', function(){
		after(function(done){
			rimraf(path.join('test', 'data', '*'), done);
		});
		require('./user')(d);
		require('./group')(d);
		require('./referencial_integrity')(d);
		require('./permission')(d);
		require('./product_info')(d);
	});
};