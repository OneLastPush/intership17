var EventEmitter = require('events').EventEmitter;
var express = require('express');
var bodyParser = require('body-parser');
var auth = require('./auth');

module.exports = function(config, setup){
	var us = new EventEmitter();
	us.router = express.Router();
	us.config = config;

	if(setup) setup(us.router);
	us.router.use(function(req, res, next){
		var key = req.headers.authorization;
		if(key){
			auth(us.config.auth, req.url, function(err, auth){
				if(err) return res.error(err);
				if(key.localeCompare(auth.toString('hex')) === 0)
					next();
				else
					res.error(new Error('master-slave authentication key mismatch'));
			});
		}else
			res.error(new Error('master did not provide Dobby with auth key'));
	});

	us.router.all('/routes', function(req, res){
		function getPaths(mount, stack){
			var available = [];
			stack.forEach(function(stackee){
				if(!stackee.regexp || stackee.regexp.source.localeCompare('^\\/?(?=\\/|$)') === 0)
					return; //skip this, must be middleware.
				var thisMount = mount? [].concat(mount): [];
				thisMount.push(stackee.regexp.source);
				if(stackee.handle && stackee.handle.stack){
					var deeperAvailable = getPaths(thisMount, stackee.handle.stack);
					available = available.concat(deeperAvailable);
				}else
					available.push(thisMount);
			});
			return available;
		}
		res.status(200).send(getPaths(undefined, us.router.stack));
	});
	us.router.use(bodyParser.json());
	us.router.all('/config', function(req, res){
		if(!req.body)
			return res.error('missing field');
		res.sendStatus(200);
		us.emit('config', req.body);
	});
	return us;
};