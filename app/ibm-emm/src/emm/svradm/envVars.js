var emm = require('../../emm');

var us = {};

us.envVarRegex = /^(.*)=(.*)$/gm;

us.set = function(variable, value, username, password, cb){
	emm.call('unica_svradm', ['-x', 'set '+variable+'='+value], {
		user: username,
		pw: password
	}, cb);
};
us.view = function(username, password, cb){
	emm.call('unica_svradm', ['-x', 'set'], {
		user: username,
		pw: password
	}, function(err, res){
		if(err) return cb(err);
		res.env = {};

		var toParse = res.stdout;
		var parsed;
		while((parsed = us.envVarRegex.exec(toParse)) !== null){
			res.env[parsed[1]] = parsed[2];
			toParse = toParse.substring(parsed.lastIndex);
		}

		cb(err, res);
	});
};


module.exports = us;