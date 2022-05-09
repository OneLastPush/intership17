var fs = require('fs');
var path = require('path');

var express = require('express');
var async = require('async');
var config = require('smart-config');
var log = require('smart-tracer');

var meta = require('../package.json');
var internal = require('./db/internal');

function JadeMaster(index, cb){
	var us = this;
	us.index = index;
	us.loc = [];

	us.group = internal.collection.group;
	us.user = internal.collection.user;

	us.router = new express.Router();
	us.router.get('/', function(req, res){
		res.redirect('/'+us.index);
	});
	us.router.get('/*.(html)|(jade)', function(req, res){ //catches only html or jade links
		var page = req.url;
		if(req.session && req.session.lastPage && page.indexOf('login') == -1){
			page = req.session.lastPage;
			delete req.session.lastPage;
			return res.redirect(page+'.html');
		}
		page = page.replace(/^\//, ''); //remove first slash
		page = page.replace(/.html.*$/, ''); //remove html & any query after

		//set default jade render data
		var captcha = config.get('Captcha');
		req.app.locals = {
			//jade configs
			pretty: false,
			debug: false,
			compileDebug: false,

			//website data
			name: "CLEARGOALS Maestro",
			description: meta.description,
			version: meta.version,
			captcha: captcha.active? captcha.key: undefined,
			gBookmarks: config.get('Global Bookmarks List'),

			//default user data
			loc: us.loc.english,
			permissions: []
		};

		us.render(page, req, res);
	});

	fs.readdir('./lang', function(err, files){ //load available localizations
		if(err) return cb(err);
		files.forEach(function(file){
			var name = file.replace(/\.js$/, '');
			var data = require(path.join('..', 'lang', file));
			us.loc[name] = data;
		});
		cb(undefined, us);
	});
	return us;
};

JadeMaster.prototype.getUserData = function(session, cb){
	var us = this;
	if(session.username){
		async.applyEach([
			function(session, cb){ //localization
				if(session.loc)
					return cb();
				us.user.getLanguage(session.username, function(err, language){
					if(err) log.error(err);
					if(!language || language.length === 0)
						log.error(new Error('user does not have language in db: ' + session.username));
					else
						session.loc = us.loc[language[0].toLowerCase()];
					cb();
				});
			}, function(session, cb){ //permissions
				if(session.permissions)
					return cb();
				us.group.getPermissions(session.username, function(err, permissions){
					if(err) log.error(err);
					session.permissions = permissions;
					cb();
				});
			}, function(session, cb){ //misc user data
				var transfer = ['Username', 'Bookmarks', 'Name', 'Pinned'];
				var retrieve = false;
				transfer.forEach(function(f){
					if(!session[f])
						retrieve = true;
				});
				if(!retrieve)
					return cb();
				us.user.getUser(session.username, function(err, record){
					if(err) log.error(err);
					transfer.forEach(function(f){
						session[f] = record[f];
					});
					cb();
				});
			}
		], session, function(err){
			cb(err, session);
		});
	}else{
		cb(undefined, session);
	}
};

JadeMaster.prototype.render = function(page, req, res){
	if((!req.session || !req.session.username) && page.indexOf('login') == -1){
		if(req.session)
			req.session.lastPage = page;
		res.render('login', {page: 'login'});
	}else{
		this.getUserData(req.session, function(err, data){
			if(err) throw err;
			data.page = page;
			res.render(page, data);
		});
	}
};

module.exports = JadeMaster;