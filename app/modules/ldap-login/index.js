/**
 * var ldapLogin = require('ldap-login');
 *
 * ldapLogin.url = 'localhost';
 * ldapLogin.port = '389';
 *
 * ldapLogin.bindDN = undefined; //leave undefined for anonymous
 * ldapLogin.bindPassword = undefined; //leave undefined for anonymous
 * ldapLogin.baseDN = 'dc=abc,dc=com';
 *
 * //you can change filter or scope too
 * //successData too! This determiens what success data a successful login will return form the ldap
 * ldapLogin.successData = {
 * 		lastname: 'sn'
 * }
 *
 * var login = require('login-engine');
 *
 * login.register(ldapLogin);
 * login.log('username', 'password', function(err, successData){
 * 		if(successData)
 * 			console.log('logged in');
 * });
 */
var ldap = require('ldapjs');

function saneError(err){
	var newErr = {};
	for(var key in err) //fix these getters man
		newErr[key] = err[key];
	return newErr;
}

var us = {
	active: true,
	url: '',
	port: '',
	bindDN: undefined,
	bindPassword: undefined,
	baseDN: '',
	filter: '(&(|(objectClass=posixAccount)(objectClass=person))(uid={0}))',
	scope: 'sub',
	successData: {
		firstname: 'givenName',
		lastname: 'sn'
	},
	login: function(username, password, cb){
		if(!us.active) return cb();
		var client = ldap.createClient({
			url: 'ldap://'+us.url+':'+us.port,
			bindDN: us.bindDN,
			bindCredentials: us.bindPassword
		});

		var entry;
		client.search(us.baseDN, {
			filter: us.filter.replace('{0}', username),
			scope: us.scope
		}, function(err, res){
			if(err) return cb(saneError(err));
			res.on('searchEntry', function(res){
				entry = res.raw;
			});
			res.on('end', function(res){
				if(entry){
					client.bind(entry.dn, password, function(err){
						if(err) return cb(saneError(err));
						var data = {};
						for(var key in us.successData)
							data[key] = entry[us.successData[key]] && entry[us.successData[key]].toString();
						cb(err, data);
					});
				}else{
					cb();
				}
			});
		});
	}
};

module.exports = us;