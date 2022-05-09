var express = require('express');
var escape = require('escape-string-regexp');
var log = require('smart-tracer');

var user = require('./internal').collection.user;

var router = express.Router();

router.all('/blueprint', function(req, res){
	res.send(user.blueprint.internal);
});
router.all('/get/all', function(req, res){
	user.get({}, function(err, data){
		if(err)
			return res.error(err);
		data.forEach(function(record){
			if(record){
				if(record['IBM Marketing'] && record['IBM Marketing'].Password)
					record['IBM Marketing'].Password = '******';
			}
		});
		res.send(data);
	});
});
router.all('/get', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	user.getUser(username, function(err, record){
		if(err)
			return res.error(err);
		res.send(record);
	});
});
router.all('/set', function(req, res){
	var username = req.body.username;
	var data = req.body.data;
	if(!data) return new res.error('missing field', 'data');
	var what = null;
	if(username)
		what = {Username: new RegExp('^'+escape(username)+'$', 'i')};
	user.update(what, data, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/remove', function(req, res){
	var username = req.body.username;
	if(!username) return new res.error('missing field', 'username');
	user.remove({
		Username: new RegExp('^'+escape(username)+'$', 'i')
	}, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/get/all/name', function(req, res){
	user.getAllUsernames(function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/all/emails', function(req, res){
	user.getAllEmails(function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/email', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	user.getEmail(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/language', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	user.getLanguage(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/bookmarks', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	user.getBookmarks(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/get/pinned', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	user.getPinnedItems(username, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/is/pinned', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	var pinned = req.body.pinned;
	if(!pinned) return new res.error('missing field', 'pinned');
	user.isPinnedItem(username, pinned, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/add/pinned', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	var pinned = req.body.pinned;
	if(!pinned) return new res.error('missing field', 'pinned');
	user.addPinnedItem(username, pinned, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/remove/pinned', function(req, res){
	var username = req.body.username || req.session.username;
	if(!username) return new res.error('missing field', 'username');
	var pinned = req.body.pinned;
	if(!pinned) return new res.error('missing field', 'pinned');
	user.removePinnedItem(username, pinned, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});

module.exports = router;