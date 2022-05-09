var emm = require('../../emm');

module.exports = function(cmd, username, password, cb){
	emm.call('unica_svradm', ['-x', cmd], {
		user: username,
		pw: password
	}, cb);
};