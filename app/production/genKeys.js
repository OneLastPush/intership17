/**
* Generates keys.
* 
* Use:
* generate trial:
* node genKeys.js "John Smith"
* generate license:
* node genKeys.js "John Smith" "December 25, 2014"
* 
*/
var args = process.argv;
// node args[0]
// genKeys.ks args[1]
var license = {
	name: args[2],
	date: args[3],
	type: 'Trial'
};

if(license.date){
	license.type = 'License';
	license.date = new Date(license.date);
}else{
	license.date = new Date();
	license.date = new Date(license.date.getTime() + 30/*days*/*24*60*60*1000);
}

var key = [license.name, license.date.toISOString()].join(',');
require('crypto').pbkdf2(key, license.type, 10000, 128, function(err, key){
	if(err)
		console.log(err.stack);

	license.key = key.toString('hex');
	require('fs').writeFile('license.json', JSON.stringify(license, null, ' '));
	console.log(license);
});