var crypto = require('crypto');
function auth(pw, shuffle, cb){
	crypto.pbkdf2(pw, shuffle, 1000, 128, cb);
}
module.exports = auth;