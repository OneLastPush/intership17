var express = require('express');
var log = require('smart-tracer');

var group = require('./internal').collection.group;

var router = express.Router();

router.all('/blueprint', function(req, res){
	res.send(group.blueprint);
});
router.all('/get/all', function(req, res){
	group.get({}, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get', function(req, res){
	var groupName = req.body.group;
	if(!groupName) return new res.error('missing field', 'group');
	group.get({Name: groupName}, function(err, data){
		if(err)
			return res.error(err);
		if(data.length === 0)
			return res.status(404).send();
		var record = data[0];
		res.send(record);
	});
});
router.all('/set', function(req, res){
	var groupName = req.body.group;
	var data = req.body.data;
	if(!data) return new res.error('missing field', 'data');
	var what = null;
	if(groupName)
		what = {Name: groupName};
	group.update(what, data, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/sync', function(req, res){
	var groups = req.body.groups;
	if(!groups)
		groups = [];
	var username = req.body.username || req.session.username;
	group.sync('Name', groups, 'Users', [username], function(err){
		if(err)
			return res.error(err);
		res.send();
	});
});
router.all('/remove', function(req, res){
	var groupName = req.body.group;
	if(!groupName) return new res.error('missing field', 'group');
	group.remove({
		Name: groupName
	}, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/get/all/name', function(req, res){
	group.getAllGroups(function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/permissions', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	group.getPermissions(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/path/permissions', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	var path = req.body.path;
	group.getPathPermissions(username, path, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/filetypes', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	group.getFiletypes(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/user', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	group.getGroups(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/emails', function(req, res){
	var groupName = req.body.group;
	if(!groupName) return new res.error('missing field', 'group');
	group.getGroupEmails(groupName, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});

module.exports = router;