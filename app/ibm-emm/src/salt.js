// Nodejs encryption with CTR
var crypto = require('crypto');

var us = {
	algorithm: 'aes-256-ctr',
	password: '7b03fc3e91723167dd187ace150cb3d78572b46daae0fb410de598df74bdd0cf',
	toString: function(){
		return ' Module Crypto AES256';
	},
	encrypt: function(txt){
		var cipher = crypto.createCipher(us.algorithm, us.password);
		return cipher.update(txt, 'utf8', 'hex') + cipher.final('hex');
	},
	decrypt: function(txt){
		var decipher = crypto.createDecipher(us.algorithm, us.password);
		return decipher.update(txt, 'hex', 'utf8') + decipher.final('utf8');
	}
};

module.exports = us;