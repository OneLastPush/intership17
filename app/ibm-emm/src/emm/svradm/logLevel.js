var emm = require('../../emm');

module.exports = function(level, username, password, cb){
	emm.call('unica_svradm', ['-x', 'loglevel', level], {
		user: username,
		pw: password
	}, cb);
};