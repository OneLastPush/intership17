/**
 * Mocha test suite:
 * mocha
 * to run tests
 */

var login = require('../index');

var service1 = {
	db: {
		user: { password: 'password' }
	},
	login: function(username, password, cb){
		var user = service1.db[username];
		if(!user)
			return cb(new Error('no user found'));
		if(user.password != password)
			return cb(new Error('username or password is incorrect'));
		cb(undefined, {result:true});
	},
	requestReset: function(username, ip, email, cb){
		var user = service1.db[username];
		if(!user)
			return cb(new Error('no user found'));
		user.token = email;
		user.ip = ip;
		cb(undefined, {user: user});
	},
	reset: function(username, password, token, cb){
		var user = service1.db[username];
		if(!user)
			return cb(new Error('no user found'));
		if(token != user.token)
			return cb(new Error('token is incorrect'));
		user.password = password;
		cb(undefined, {result:true});
	}
};
var service2 = {
	db: {
		user2: { password: 'password' }
	},
	login: function(username, password, cb){
		var user = service2.db[username];
		if(!user)
			return cb(new Error('no user found'));
		if(user.password != password)
			return cb(new Error('username or password is incorrect'));
		cb(undefined, {});
	},
	requestReset: function(username, ip, email, cb){
		var user = service2.db[username];
		if(!user)
			return cb(new Error('no user found'));
		user.token = email;
		user.ip = ip;
		cb(undefined, {user: user});
	},
	reset: function(username, password, token, cb){
		var user = service2.db[username];
		if(!user)
			return cb(new Error('no user found'));
		if(token != user.token)
			return cb(new Error('token is incorrect'));
		user.password = password;
		cb(undefined, {});
	}
};

describe('login-engine', function(){
	describe('empty system', function(){
		it('login', function(done){
			login.login('user', 'password', function(errs, data){
				if(errs.length > 0)
					throw new Error('threw errors');
				if(data)
					throw new Error('Authenticated when had nothing to authenticate against');
				done();
			});
		});
		it('request reset', function(done){
			login.requestReset('user', 'ip', 'email', function(errs, data){
				if(errs.length > 0)
					throw new Error('threw errors');
				if(data)
					throw new Error('Authenticated when had nothing to authenticate against');
				done();
			});
		});
		it('reset', function(done){
			login.reset('user', 'newpassword', 'token', function(errs, data){
				if(errs.length > 0)
					throw new Error('threw errors');
				if(data)
					throw new Error('Authenticated when had nothing to authenticate against');
				done();
			});
		});
	});
	describe('events & propogation', function(){
		it('attach authentication systems', function(){
			login.register('service1', service1);
			login.register('service2', service2);
		});
		describe('login', function(){
			it('right inputs', function(done){
				login.login('user', 'password', function(errs, data){
					if(Object.keys(errs).length > 0)
						throw new Error('an authentication service had an error when it shouldnt have ' + JSON.stringify(errs));
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service1')
						throw new Error('Did not authenticate against the right service. Expected service1, got ' + data._service);
					done();
				});
			});
			it('wrong inputs', function(done){
				login.login('user', 'password123', function(errs, data){
					if(Object.keys(errs).length != 2)
						throw new Error('Not all services returned an error');
					if(data)
						throw new Error('something authenticated');
					done();
				});
			});
			it('right inputs for deeper hook', function(done){
				login.login('user2', 'password', function(errs, data){
					if(Object.keys(errs).length < 1)
						throw new Error('preceeding authentication service dod not throw an error');
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service2')
						throw new Error('Did not authenticate against the right service. Expected service2, got ' + data._service);
					done();
				});
			});
			it('call by service name', function(done){
				login.login('service2', 'user2', 'password', function(errs, data){
					if(data._service !== 'service2')
						throw new Error('Did not authenticate against the right service. Expected service2, got ' + data._service);
					done();
				});
			});
		});
		describe('request reset', function(){
			it('right inputs', function(done){
				login.requestReset('user', 'ip', 'doesnt matter', function(errs, data){
					if(Object.keys(errs).length > 0)
						throw new Error('an authentication service had an error when it shouldnt have ' + JSON.stringify(errs));
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service1')
						throw new Error('Did not call the right service. Expected service1, got ' + data._service);
					if(data.user.ip != 'ip')
						throw new Error('wrong ip:' + data.user.ip +' != ip');
					service1.token = data.user.token; //used later
					done();
				});
			});
			it('wrong inputs', function(done){
				login.requestReset('user123', 'ip', 'doesnt matter', function(errs, data){
					if(Object.keys(errs).length != 2)
						throw new Error('Not all services returned an error');
					if(data)
						throw new Error('something authenticated');
					done();
				});
			});
			it('right inputs for deeper hook', function(done){
				login.requestReset('user2', 'ip', 'doesnt matter', function(errs, data){
					if(Object.keys(errs).length < 1)
						throw new Error('preceeding authentication service dod not throw an error');
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service2')
						throw new Error('Did not call the right service. Expected service2, got ' + data._service);
					if(data.user.ip != 'ip')
						throw new Error('wrong ip:' + data.user.ip +' != ip');
					service2.token = data.user.token; //used later
					done();
				});
			});
			it('call by service name', function(done){
				login.requestReset('service2', 'user2', 'ip', 'doesnt matter', function(errs, data){
					if(data._service !== 'service2')
						throw new Error('Did not call the right service. Expected service2, got ' + data._service);
					if(data.user.ip != 'ip')
						throw new Error('wrong ip:' + data.user.ip +' != ip');
					done();
				});
			});
		});
		describe('reset', function(){
			it('right inputs', function(done){
				login.reset('user', 'password123', service1.token, function(errs, data){
					if(Object.keys(errs).length > 0)
						throw new Error('an authentication service had an error when it shouldnt have ' + errs.service1);
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service1')
						throw new Error('Did not call the right service. Expected service1, got ' + data._service);
					if(service1.db.user.password != 'password123')
						throw new Error('password was not changed');
					done();
				});
			});
			it('wrong inputs', function(done){
				login.reset('user', 'supersecretpassword', service1.token+'a', function(errs, data){
					if(Object.keys(errs).length != 2)
						throw new Error('Not all services returned an error');
					if(data)
						throw new Error('something authenticated');
					if(service1.db.user.password == 'supersecretpassword' || service2.db.user2.password == 'supersecretpassword')
						throw new Error('password was changed');
					done();
				});
			});
			it('right inputs for deeper hook', function(done){
				login.reset('user2', 'newpassword', service2.token, function(errs, data){
					if(Object.keys(errs).length < 1)
						throw new Error('preceeding authentication service did not throw an error');
					if(!data)
						throw new Error('not authenticated');
					if(data._service !== 'service2')
						throw new Error('Did not call the right service. Expected service2, got ' + data._service);
					if(service2.db.user2.password != 'newpassword')
						throw new Error('password was not changed');
					done();
				});
			});
			it('call by service name', function(done){
				login.reset('service2', 'user2', 'newpasswordagain', service2.token, function(errs, data){
					if(data._service !== 'service2')
						throw new Error('Did not call the right service. Expected service2, got ' + data._service);
					done();
				});
			});
		});
		describe("through services without function", function(done){
			it('login', function(done){
				delete service1.login;
				login.login('user2', 'newpasswordagain', function(errs, data){
					if(!errs.service1)
						throw new Error("Didn't throw not implemented error");
					done();
				});
			});
			it('request reset', function(done){
				delete service1.requestReset;
				login.requestReset('user2', 'ip', 'something', function(errs, data){
					if(!errs.service1)
						throw new Error("Didn't throw not implemented error");
					service2.token = data.user.token; //used later
					done();
				});
			});
			it('reset', function(done){
				delete service1.reset;
				login.reset('user2', 'newpassword2', service2.token, function(errs, data){
					if(!errs.service1)
						throw new Error("Didn't throw not implemented error");
					done();
				});
			});
		});
	});
});