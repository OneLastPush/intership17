var escape = require('escape-string-regexp');

var log = require('smart-tracer');
var config = require('smart-config');

var express = require('express');

var manager = require('./boot/application_manager');
var group = require('./db/internal').collection.group;

var us = {};
us.router = express.Router();
us.fsRouter = express.Router();
us.fsRouter.all('*', function(req, res, next){
	var requestPath = req.body.folder || req.body.file || req.body.uploadTo;
	if(req.url.match(/^\/download|\/upload|\/archive|\/delete/i)){
		group.getPathPermissions(req.session.username, requestPath, function(err, perms){
			if(err)
				return res.error(err);
			if(!perms['Can download'] && req.url.match('^/download'))
				return res.error(new Error('not authorized'));
			else if(!perms['Can upload'] && req.url.match('^/upload'))
				return res.error(new Error('not authorized'));
			else if(!perms['Can archive'] && req.url.match('^/archive'))
				return res.error(new Error('not authorized'));
			else if(!perms['Can delete'] && req.url.match('^/delete'))
				return res.error(new Error('not authorized'));

			next();
		});
	}else
		next();
});

us.router.all('/db/internal/:collection/*', function(req, res, next){
	if(req.params.collection === 'user' || req.params.collection === 'group'){
		group.getPermission(req.session.username, 'add / remove / modify users', function(err, permission){
			if(err)
				return res.error(err);
			if(permission && permission.length > 0)
				return next();

			if(req.body.username === req.session.username){
				return next();
			} else if(req.url.match(/(\/blueprint$)|(\/get\/emails$)|(\/get\/all\/emails$)/i)){
				return next();
			}

			res.error(new Error('not authorized'));
		});
	}else{
		next();
	}
});

us.router.all('/config/get', function(req, res, next){
	var item = req.body.item;
	if(item && item.match(/^Watched Servers List/)){
		group.getPermission(req.session.username, 'view server stats', function(err, permission){
			if(err) return res.error(err);

			if(permission && permission.length > 0)
				next();
			else
				res.error(new Error('not authorized'));
		});
	}else
		next();
});
us.start_stop = function(req, res, next){
	group.getPermission(req.session.username, 'start & stop the environment', function(err, permission){
		if(err) return res.error(err);
		if(permission && permission.length > 0)
			next();
		else
			res.error(new Error('not authorized'));
	});
};
us.router.all('/:app/app/start', us.start_stop);
us.router.all('/:app/app/stop', us.start_stop);
us.router.all('/:app/app/listener/:subapp/start', us.start_stop);
us.router.all('/:app/app/listener/:subapp/stop', us.start_stop);
us.router.all('/emm/app/console', function(req, res, next){
	group.getPermission(req.session.username, 'access console', function(err, permission){
		if(err) return res.error(err);
		if(permission && permission.length > 0)
			next();
		else
			res.error(new Error('not authorized'));
	});
});
us.router.all('/emm/app/process/:action', function(req, res, next){
	var action = req.params.action;
	if(['run', 'status'].indexOf(action) >= 0)
		return next();
	var pid = req.body.pid;
	var username = req.body.username;
	group.getPermission(req.session.username, 'manage sessions', function(err, permission){
		if(err) return res.error(err);
		if(permission && permission.length > 0)
			next();
		else if(config.get('IBM EMM').active){
			manager.forward(manager.applications['IBM EMM'], '/status', ['svradm', 'status', 'get'], {
				username: req.body.username,
				password: req.body.password
			}, function(err, response){
				if(err) return res.error(err);
				var ownSession = false;
				if(response && response.data){
					var data = response.data;
					data.forEach(function(s){
						if(s.pid == pid && s.user == username)
							ownSession = true;
					});
				}
				if(ownSession)
					next();
				else
					res.error(new Error('not authorized'));
			});
		}else{
			res.error(new Error('not authorized'));
		}
	});
});
//TODO untested
us.router.all('/emm/app/recompute', function(req, res, next){
	group.getPermission(req.session.username, 'recompute catalogs/flowcharts', function(err, permission){
		if(err) return res.error(err);
		if(permission && permission.length > 0)
			next();
		else
			res.error(new Error('not authorized'));
	});
});

module.exports = us;