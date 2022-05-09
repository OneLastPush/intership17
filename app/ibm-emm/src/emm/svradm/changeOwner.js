var emm = require('../../emm');

module.exports = function(oldUserId, newUserId, policyId, username, password, cb){
	var x = 'changeowner -o '+oldUserId+ ' -n '+newUserId+' -p '+policyId;
	emm.call('unica_svradm', ['-x', x], {
		user: username,
		pw: password
	}, cb);
};