var log = require('smart-tracer');
var emm = require('../../emm');

var versionRegex = /^(.*) version: (.*)$/gm;

module.exports = function(username, password, cb){
	emm.call('unica_svradm', ['-x', 'version'], {
		user: username,
		pw: password
	}, function(err, r){
		r.version = {};

		var toParse = r.stdout;
		var parsed;
		while((parsed = versionRegex.exec(toParse)) !== null){
			r.version[parsed[1]] = parsed[2];
			toParse = toParse.substring(parsed.lastIndex);
		}

		cb(err, r);
	});
};