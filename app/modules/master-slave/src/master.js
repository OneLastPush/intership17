var express = require('express');
var request = require('request');
var log = require('smart-tracer');
var auth = require('./auth');

module.exports = function(setup){
	var us = {};
	us.request = request;
	us.router = express.Router();
	us.config = {
		auth: 'default',
		autoForward: true, //if this provides automatic forwarding or assumes you will manually make forwards
		servers: {} //try using addServer and removeServer. Don't forget to sniff
	};

	setup(us.router);
	us.deMountUrl = function(server, url){
		if(server && server.mount){
			var mountIndex = url.indexOf(server.mount);
			if(mountIndex === 0 || mountIndex === 1) // has mount or /mount url
				return url.substring(server.mount.length + mountIndex); //remove mount portion
		}
		return url;
	};
	us.getServer = function(serverUrl){
		var rtnServer;
		for(var name in us.config.servers){
			var server = us.config.servers[name];
			var url = us.deMountUrl(server, serverUrl);
			for(var i=0; i<server.routes.length; i++){
				var route = server.routes[i];
				var testMount = url;
				var rightPath = true;
				for(var j=0; j<route.length; j++){
					var part = route[j];
					var regex = new RegExp(part);
					var res = regex.exec(testMount);
					if(!res)
						rightPath = false;
					else
						testMount = testMount.substring(res[0].length);
				}
				if(rightPath)
					rtnServer = server;
			}
		}
		return rtnServer;
	};
	us.getForwardData = function(url, server, cb){ //url,[ server,] cb
		if(typeof server === 'function'){
			cb = server;
			server = undefined;
		}
		if(server)
			server = us.config.servers[server];
		if(!server){
			server = us.getServer(url);
			url = us.deMountUrl(server, url);
		}
		if(server){
			auth(server.auth || us.config.auth, url, function(err, auth){
				cb(err, {
					server: server.name,
					url: server.url + url,
					headers: {
						'authorization': auth.toString('hex')
					}
				});
			});
		}else
			cb(new Error('server not found'));
	};
	us.sniffAll = function(cb){
		var index = 1;
		function done(err){
			if(err){
				index = -1;
				return cb(err);
			}
			if(--index===0)
				cb(undefined, us.config.servers);
		}
		for(var name in us.config.servers){
			index++;
			us.sniffServer(us.config.servers[name], done);
		}
		done();
	};
	us.sniffServer = function(server, cb){ //accepts name or server object (which has name)
		if(typeof server === 'string')
			server = us.config.servers[server];
		us.getForwardData('/routes', server.name, function(err, connOpts){
			if(err) return cb(err);
			us.request.post(connOpts, function(err, res, body){
				if(res.statusCode != 200 || err)
					return cb(err || body);
				us.config.servers[server.name].routes = JSON.parse(body);
				cb(undefined, server);
			});
		});
	};
	//name, url, auth, [mount], [cb]
	//if cb provided will sniff
	us.addServer = function(name, url, auth, mount, cb){
		if(mount && typeof mount === 'function'){
			mount = undefined;
			cb = mount;
		}
		var server = {
			name: name,
			mount: mount,
			url: url,
			auth: auth,
			routes: []
		};
		us.config.servers[name] = server;
		if(cb)
			sniffServer(server, cb);
	};
	us.removeServer = function(name){
		delete us.config.servers[name];
	};
	us.router.use(function(req, res, next){ //forwards to slaves automatically
		if(!us.config.autoForward) return next(); //if configured to
		us.getForwardData(req.url, function(err, connOpts){
			if(!connOpts) return next();
			log.debug('piping ' + req.url + ' to ' + connOpts.server + ': ' + connOpts.url);
			req.pipe(us.request(connOpts)).pipe(res);
		});
	});
	return us;
};