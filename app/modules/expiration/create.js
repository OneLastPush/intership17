/**
 * node create.js "John Smith"
 *
 * node create.js "John Smith" "December 25, 2017"
 *
 * node create.js "John Smoth" "December 25, 2017" "license.json"
 */

var fs = require('fs');
var exp = require('./index');

var args = process.argv;
var file = args[4] || 'license.json';
exp.create(args[2], args[3], function(err, license){
	if(err) throw err;
	fs.writeFile(file, JSON.stringify(license, null, ' '), function(err){
		exp.validate(file, function(err, license){
			if(err) throw err;
			console.log(license);
		});
	});
});