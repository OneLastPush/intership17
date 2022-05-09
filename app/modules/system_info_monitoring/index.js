/**
 * either
 * > npm start
 * or
 * app.get('/info', require('system-info-monitoring')(['c:\', 'd:\']).router);
 */
var express = require('express');

var log = require('smart-tracer');
var paths = require('./watchedPaths.json');
var info = require('./src/info')(paths);
var router = express.Router();

router.all('/', function(req, res){
	info.updateInfo(function(info){
		res.status(200).send(info);
	});
});
router.all('/uptime', function(req, res){
	info.getUptime(function(err, data){
		res.status(err? 400: 200).send(data);
	});
});
router.all('/cpu', function(req, res){
	info.getCPUUsage(1000, function(err, data){
		res.status(err? 400: 200).send(data);
	});
});
router.all('/ram', function(req, res){
	info.getRAM(function(err, data){
		res.status(err? 400: 200).send(data);
	});
});
router.all('/swap', function(req, res){
	info.getSwap(function(err, data){
		res.status(err? 400: 200).send(data);
	});
});
router.all('/disk', function(req, res){
	info.getDiskUsage(function(err, data){
		res.status(err? 400: 200).send(data);
	});
});
router.all('/network', function(req, res){
	info.getNetworkUsage(function(err, data){
		res.status(err? 400: 200).send(data);
	});
});

module.exports = function(paths){
	if(paths)
		info.setPaths(paths);
	return {
		info: info,
		router: router
	};
};