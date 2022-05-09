var url = require('url');

var express = require('express');
var expressBrute = require('express-brute');
var request = require('request');
var config = require('smart-config');
var login = require('login-engine');
var ldapLogin = require('ldap-login');
var log = require('smart-tracer');

var internalDB = require('./db/internal');
var emailer = require('./emailer');
var manager = require('./boot/application_manager');

var test = false;

ldapLogin.successData = {
	firstName: 'givenName',
	lastName: 'sn',
	email: 'mail',
	officePhone: 'homePhone',
	mobile: 'mobile'
};
function setLDAPConfigs(ldap){
	ldapLogin.active = ldap.active;
	ldapLogin.url = ldap.url;
	ldapLogin.port = ldap.port;
	ldapLogin.baseDN = ldap.baseDN;
	if(!config.anonymousBind){
		ldapLogin.bindDN = ldap.bindDN;
		ldapLogin.bindPassword = ldap.bindPassword;
	}
}
config.on('change.LDAP', function(v, o){
	setLDAPConfigs(v);
});
setLDAPConfigs(config.get('LDAP'));

login.register('knownUsers', {
	login: function(username, password, cb){
		internalDB.collection.user.get({
			Username: new RegExp('^'+escape(username)+'$', 'i')
		}, function(err, data){
			if(err) return cb(err);
			if(!data || data.length == 0)
				return cb(new Error('User not found: ' + username));
			var service = data['Authentication Service'];
			switch(service){
				case 'IBM EMM': login.login('emm', username, password, cb); break;
				case 'LDAP': login.login('ldap', username, password, cb); break;
				case 'Internal': login.login('internal', username, password, cb); break;
				default:
					cb(new Error('User\'s authentication service not recognized: ' + username));
			}
		});
	}
});
login.register('ibm-emm', {
	login: function(username, password, cb){
		if(config.get('IBM EMM').active){
			manager.forward(manager.applications['IBM EMM'], '/login', ['svradm', 'login'], {
				username: username,
				password: password
			}, function(err, res){
				if(err) return cb(err);
				cb(err, res);
			});
		}else{
			cb(new Error('Not implemented'));
		}
	}
});
login.register('ldap', ldapLogin);
login.register('internal', internalDB.login);

var router = express.Router();
//brute force protection
var bruteProtection = new expressBrute(new expressBrute.MemoryStore(), {
	freeRetries: 1,
	minWait: 5*60*1000, // 5 minutes
	maxWait: 60*60*1000, // 1 hour
	failCallback: function(req, res, next, nextValidRequestDate){
		if(test)
			return next(); //if in test mode, skip 429/captcha stuff
		if(!req.body['g-recaptcha-response'])//no captcha
			return res.status(429).send();
		//validate captcha
		request.post('https://www.google.com/recaptcha/api/siteverify', {
			form: {
				secret: config.get('Captcha').secret,
				response: req.body['g-recpathca-response']
			}
		}, function(err, res2, body){
			if(!err && res2.statusCode == 200){
				var verified = JSON.parse(body);
				if(verified.success)
					return req.brute.reset(next); //no err, 200, & verified = reset logins & ok
			}
			res.status(429).send(); //err, not 200, or not verified = captcha again
		});
	}
});
router.all('/', bruteProtection.prevent, function(req, res){
	var username = req.body.username;
	if(!username) return new res.error('missing field', 'username');
	var password = req.body.password;
	if(!password) return new res.error('missing field', 'password');

	login.login(username, password, function(errs, successData){
		if(Object.keys(errs).length > 0){
			for(var service in errs)
				log.warn('login[' + service + '].login(' + username + '): ' + errs[service]);
		}
		if(!successData){
			res.error(new Error('failed login'));
		}else{
			var done = function(){
				req.session.username = successData.Username || username;
				log.info('Logged in with ' + successData._service + ' as ' + req.session.username);
				res.status(200).send({
					username: req.session.username
				});
			};
			if(successData._service === 'internal')
				return done();
			//adds/updates external login data
			internalDB.collection.user.get({
				Username: new RegExp('^'+escape(username)+'$', 'i')
			}, function(err, data){
				if(err)
					return res.error(err);
				var userData = {};
				var who;
				if(data.length > 0)
					userData = data[0];
				if(userData.username)
					who = {Username: userData.Username};
				switch(successData._service){
					case 'ldap':
						internalDB.collection.user.update(who,{ //update existing record, or add new
							Username: username,
							'Authentication Service': userData['Authentication Service'] || 'LDAP',
							Email: successData.email,
							Name: {
								First: successData.firstName,
								Last: successData.lastName,
							},
							Phone: {
								Office: successData.officePhone,
								Mobile: successData.mobile
							}
						}, function(err, data){
							if(err)
								return res.error(err);
							done();
						});
						break;
					case 'ibm-emm':
						internalDB.collection.user.update(who,{ //update existing record, or add new
							Username: username,
							'Authentication Service': userData['Authentication Service'] || 'IBM EMM',
							'IBM Marketing': {
								Username: username,
								Password: password
							}
						}, function(err, data){
							if(err)
								return res.error(err);
							done();
						});
						break;
					default:
						log.error('Unrecognized service! ' + successData._service);
						done();
				}
			});
		}
	});
});
router.all('/reset/token', function(req, res){
	var username = req.body.username;
	if(!username) return new res.error('missing field', 'username');
	var email = req.body.email;
	if(!email) return new res.error('missing field', 'email');

	login.requestReset(username, req.ip, email, function(errs, data){
		if(Object.keys(errs).length > 0){
			for(var service in errs)
				log.warn('login[' + service + '].requestReset(' + username + '): ' + errs[service]);
		}
		if(!data || data.length === 0)
			return res.error(new Error('invalid password reset'));
		data = data[0]; //get first record
		var link = url.parse(req.get('referer') || (req.app.get('protocol') + '://127.0.0.1:' + req.app.get('port')));
		link.search = link.query = link.pathanem = link.path = link.href = null;
		link.pathname = '/login_reset.html';
		link.query = {token: data.Token, user: data.Username};
		link.href = url.format(link);
		var insertVar = function insertVar(value){
			return '<strong>'+value+'</strong>';
		};
		emailer.send({
			to: data.Email,
			subject: 'Password reset request',
			html: '<p>Reset was request on ' + insertVar(data.Date) +
				' for user ' + insertVar(data.Username) +
				' from IP ' + insertVar(data.IP) + '.</p>' +

				'<p>If this was not you, ignore this email.</p>' +

				'<p>Password reset token generated is: ' + insertVar(data.Token) +
				'<br>It is valid for 24 hours.</p>' +

				'<p>To reset your password follow this link: ' +
				insertVar('<a href="'+link.href+'">'+link.href+'</a>') +
				'</p>'
		}, function(err, emailData){
			if(test){
				if(err)
					log.error(err);
				return res.send(data.Token);
			}
			if(err)
				return res.error(new Error('Issue emailing ' + err));
			res.status(200).send(true);
		});
	});
});
router.all('/reset/pw', function(req, res){
	var username = req.body.username;
	if(!username) return new res.error('missing field', 'username');
	var password = req.body.password;
	if(!password) return new res.error('missing field', 'password');
	var token = req.body.token;
	if(!token) return new res.error('missing field', 'token');

	login.reset(username, password, token, function(errs, data){
		if(Object.keys(errs).length > 0){
			for(var service in errs)
				log.warn('login[' + service + '].reset(' + username + '): ' + errs[service]);
		}
		if(!data || data.length === 0)
			return res.error(errs.internal? errs.internal: new Error('invalid password reset'));
		res.status(200).send();
	});
});
router.all('/logout', function(req, res){
	if(req.session)
		req.session.destroy();
	res.status(200).send();
});


var us = {
	setTest: function(isTest){
		test = isTest;
		return us;
	},
	router: router
};
module.exports = us;