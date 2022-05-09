/*Use:

var login = require('login-engine');
var ldap = require('ldap-login');
var campaign = require('campaign');
var internalUsers = require('internal_db').users;

//let's look inside:
internalUsers.login = function(username, password, cb){
	internalUser.encrypt(password, function(err, password){
		if(err) return cb(err);
		internalUsers.get({
			id: username,
			password: password
		}, cb); //function(err){...}
	});
};
internalUsers.requestReset = function(username, ip, email, cb){
	internalUsers.insert({
		id: username,
		email: email,
		ip: ip
	}, function(err, user){
		if(err) return cb(err);
		user.token = internalUsers.generateToken(username, new Date());
		internalUsers.set(user, cb);
	});
};
internalUsers.reset = function(username, password, token, cb){
	internalUsers.get({
		id: username,
		token: token
	}, function(err, user){
		if(err) return cb(err);
		internalUser.authToken(user.token, username, function(err){
			if(err) return cb(err);
			internalUser.encrypt(password, function(err, password){
				if(err) return cb(err);
				user.password = password;
				internalUsers.set(user, cb);
			});
		});
	});
};

//put in order you want them to be called
login.register('internalUsers', internalUsers);
login.register('ldap', ldap);
login.register('campaign', campaign);

//attach to something
app.post('/login', function(req, res){
	var username = req.body.username;
	if(!username) return res.error('missing field', 'username');
	var password = req.body.password;
	if(!password) return res.error('missing field', 'password');

	login.login(username, password, function(errs, data){
		if(data){
			req.session.username = username;
			res.status(200).send();
		}else{
			res.error(errs.internalUsers || errs.ldap || errs.campaign || new Error('could not authenticate'));
		}
	});
});
app.post('/login/reset/request', function(req, res){
	var username = req.body.username;
	var email = req.body.email;
	login.requestReset(username, email, function(errs, data){
		if(data)
			res.status(200).send();
		else
			res.error(errs.internalUsers || errs.ldap || errs.campaign || new Error('could not authenticate'));
	});
});
app.post('/login/reset', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	var token = req.body.token;
	login.reset(username, password, token, function(errs, data){
		if(data)
			res.status(200).send();
		else
			res.error(errs.internalUsers || errs.ldap || errs.campaign || new Error('could not authenticate'));
	});
});*/
var async = require('async');
var services = {};

function doAction(fn, service, args, cb){
	if(service && service.module[fn]){
		args.push(function(err, data){
			if(data)
				data._service = service.name;
			cb(err, data);
		});
		service.module[fn].apply(service.module, args);
	}else{
		async.mapSeries(services, function(service, cb){
			if(service.module[fn]){
				var theseArgs = [];
				args.forEach(function(arg){
					theseArgs.push(arg);
				});
				theseArgs.push(function(err, success){
					if(success)
						success._service = service.name;
					cb(success, err);
				});
				service.module[fn].apply(service.module, theseArgs);
			}else{
				cb(undefined, new Error('Service method ' + fn + ' not found'));
			}
		}, function(success, errs){ //this errs object is all messed & looks like an array when printed...
			var errors = {};
			for(var key in errs){
				if(errs[key])
					errors[key] = errs[key];
			}
			cb(errors, success);
		});
	}
}

var us = {};
us.register = function(name, service){
	services[name] = {name: name, module: service};
};
us.login = function(){ //([service], username, password, cb)
	var args = Array.prototype.slice.call(arguments);
	var service;
	if(args.length == 4)
		service = services[args.shift()];
	var cb = args.pop();
	doAction('login', service, args, cb);
};
us.requestReset = function(){ //([service], ip, username, email, cb)
	var args = Array.prototype.slice.call(arguments);
	var service;
	if(args.length == 5)
		service = services[args.shift()];
	var cb = args.pop();
	doAction('requestReset', service, args, cb);
};
us.reset = function(){ //([service], username, password, token, cb)
	var args = Array.prototype.slice.call(arguments);
	var service;
	if(args.length == 5)
		service = services[args.shift()];
	var cb = args.pop();
	doAction('reset', service, args, cb);
};
module.exports = us;