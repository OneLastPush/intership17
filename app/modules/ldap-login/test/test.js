/**
 * mocha
 */

var ldapLogin = require('../index');

var username = 'ganna';
var password = 'Cleargoals1';

describe('ldap-login', function(){
	before(function(){
		ldapLogin.url = '10.0.0.243';
		ldapLogin.port = '389';

		ldapLogin.baseDN = 'dc=cleargoals,dc=com';
	});

	it('login', function(done){
		ldapLogin.login(username, password, function(err, data){
			if(data.firstname != 'Ganna')
				throw new Error('unexpected first name');
			if(data.lastname != 'Shmatova')
				throw new Error('unexpected last name');
			done(err);
		});
	});

	it('login with wrong credentials', function(done){
		ldapLogin.login(username, password+"123", function(err, data){
			if(data)
				throw new Error('invalid credentials were accepted');
			done();
		});
	});
});