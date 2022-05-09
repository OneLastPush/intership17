var emm = require('../../emm');

module.exports = function(username, password, cb){
	emm.call('unica_svradm', ['-x', 'quit'], {
		user: username,
		pw: password
	}, cb);
};