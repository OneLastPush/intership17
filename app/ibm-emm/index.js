var os = require('os');
var path = require('path');
var fs = require('fs');

var envVars = require('env-vars');
var express = require('express');
var errors = require('errors');
var config = require('smart-config');
var ma = require('manage-application');

var log = require('smart-tracer');
var loadConfig = require('./src/configuration');
var db = require('./src/db');

var us = {};
us.errors = errors.addErrors('ibm-emm', path.join(__dirname, 'errors.ini'), [
	['404-0', /not configured/i],
	['404-1', /missing field/i],
	['400-0', /jdbc/i],
	['400-9', /version file/i],

	['401-0', /error 10553/i],

	['409-1', /flowchart is not active/i],

	['404-2', /invalid flowchart/i],
	['404-3', /invalid campaign\s?code/i]
]).middleware;

us.emm = require('./src/emm');
us.version = require('./src/version');
us.svradm = require('./src/emm/svradm');
us.report = require('./src/emm/report');
us.trigger = require('./src/emm/trigger');
us.acsesutil = require('./src/emm/acsesutil');
us.listeners = require('./src/emm/listeners');
us.process = new ma.ApplicationManager("IBM Campaign Flowcharts");

us.init = function(cb){ //MUST be called at least once
	loadConfig(function(){
		var vars = {
			CAMPAIGN_HOME: config.get('IBM Campaign.root')
		};
		vars[os.type() === 'Windows_NT'? 'PATH': 'LD_LIBRARY_PATH'] = '+'+config.get('IBM Campaign._bin');
		envVars.read(vars); //sets vars
		db.init(cb);
		us.db = db;
	});
	return us;
};
us.getRouter = function(){
	if(us.router)
		return us.router;
	us.router = new express.Router();
	us.router.use(us.listeners.campaign.getRouter()); //emm by default is a campaign application
	us.router.use('/listener/campaign', us.listeners.campaign.getRouter());
	us.router.use('/listener/optimizer', us.listeners.optimizer.getRouter());

	//DATABASE ROUTES
	us.router.all('/db/users', function(req, res){
		us.db.getUsers(function(err, users){
			if(err)
				return res.error(err);
			res.send(users);
		});
	});
	us.router.all('/db/policies', function(req, res){
		us.db.getPolicies(function(err, policies){
			if(err)
				return res.error(err);
			res.send(policies);
		});
	});
	us.router.all('/db/campaigncode/validate', function(req, res){
		var code = req.body.code;
		if(!code) return res.error('missing field', 'code');
		us.db.validateCampaignCode(code, function(err, valid){
			if(err)
				return res.error(err);
			res.send(valid);
		});
	});
	us.router.all('/db/flowchartname/validate', function(req, res){
		var name = req.body.name;
		if(!name) return res.error('missing field', 'name');
		us.db.validateFlowchartName(name, function(err, valid){
			if(err)
				return res.error(err);
			res.send(valid);
		});
	});
	us.router.all('/db/version', function(req, res){
		us.db.getVersions(function(err, dbVersions){
			if(err)
				return res.error(err);
			res.send(dbVersions);
		});
	});

	//MISC ROUTES
	us.router.all('/version', function(req, res){
		us.version.getVersions(function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});

	//SVRADM ROUTES
	us.router.all('/login', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.svradm.login(username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/cli/version', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.svradm.version(username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/loglevel', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		var level = req.body.level;
		us.svradm.logLevel(level, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/env', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.svradm.envVars.view(username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/env/set', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		var variable = req.body.variable;
		if(!variable) return res.error('missing field', 'variable');
		var value = req.body.value;
		if(!value) return res.error('missing field', 'value');
		us.svradm.envVars.set(variable, value, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/owner', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		var oldUserId = req.body.oldUserId;
		if(!oldUserId) return res.error('missing field', 'oldUserId');
		var newUserId = req.body.newUserId;
		if(!newUserId) return res.error('missing field', 'newUserId');
		var policyId = req.body.policyId;
		if(!policyId) return res.error('missing field', 'policyId');

		us.svradm.changeOwner(oldUserId, newUserId, policyId, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/console', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		var cmd = req.body.cmd;
		if(!cmd) return res.error('missing field', 'cmd');

		us.svradm.console(cmd, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/status', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		var filter = req.body.filter;

		us.svradm.status.get(username, password, function(err, out){
			if(err) return res.error(err);
			if(filter && filter.match(/(client)|(active)|(suspended)/)){
				for(var i=0; i<out.data.length; i++){
					if(out.data[i].section != filter){
						out.data.splice(i, 1);
						i--;
					}
				}
			}
			res.status(200).send(out);
		});
	});
	us.router.all('/process/run', function(req, res){
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		var flowchartPath = req.body.flowchartPath;
		if(!flowchartPath) return res.error('missing field', 'flowchartPath');

		us.svradm.control.run(flowchartPath, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/process/status', function(req, res){
		var flowchartPath = req.body.flowchartPath;
		if(!flowchartPath) return res.error('missing field', 'flowchartPath');

		us.svradm.control.status(flowchartPath, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.all('/process/:action', function(req, res, next){
		var action = req.params.action.toLowerCase();
		if(['save', 'suspend', 'resume', 'stop', 'kill'].indexOf(action) === -1)
			return next(); //must not be for us. Will 404 eventually if nothing else catches this request.

		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		var pid = req.body.pid;
		var all = req.body.all;
		if(!all && !pid) return res.error('missing field', 'pid');

		action = us.svradm.control[action];
		action({
			pid: pid,
			force: req.body.force
		}, username, password, function(err, out){
			if(err) return res.error(err);
			res.status(200).send(out);
		});
	});
	us.router.use('/process', us.process.getRouter()); // for flowchart logs
	//ACSESUTIL ROUTES
	us.router.all('/campaign/export', function(req, res){
		var exportFile = req.body.exportFile;
		if(!exportFile) return res.error('missing field', 'exportFile');
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.acsesutil.campaign.export(exportFile, username, password, function(err, out){
			if (err) return res.error(err);
			var stream = fs.createReadStream(out.zipFile);
			res.setHeader('content-type', 'application/zip');
			res.setHeader('content-disposition', 'attachment; filename=' + path.basename(out.zipFile));
			stream.pipe(res);
		});
	});

	us.router.all('/campaign/import', function(req, res){
		var zipFile = req.body.zipFile;
		if(!zipFile) return res.error('missing field', 'zipFile');
		var dest = req.body.dest;
		if(!dest) return res.error('missing field', 'dest');
		var opts = req.body.opts || {};
		var policy = req.body.policy;
		if(!policy) return res.error('missing field', 'policy');
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.acsesutil.campaign.import(zipFile, dest, opts, policy, username, password, function(err, out){
			if (err) return res.error(err);
			res.status(200).send(out);
		});
	});

	us.router.all('/catalog/export', function(req, res){
		var catFile = req.body.catFile;
		if(!catFile) return res.error('missing field', 'catFile');
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');
		us.acsesutil.catalog.export(catFile, username, password, function(err, out){
			if (err) return res.error(err);
			var stream = fs.createReadStream(out.exportedCatalog);
			res.setHeader('content-type', 'application/zip');
			res.setHeader('content-disposition', 'attachment; filename=' + path.basename(out.exportedCatalog));
			stream.pipe(res);
		});
	});

	//ACGENRPT ROUTES
	us.router.all('/report/cells', function(req, res){
		var flowchart = req.body.flowchart;
		if(!flowchart) return res.error('missing field', 'flowchart');
		var opts = req.body.opts || {};
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		us.report.cells.getCells(flowchart, opts, username, password, function(err, result){
			if (err)
				return res.error(err);
			res.send(result);
		});
	});
	us.router.all('/report/fields', function(req, res){
		var flowchart = req.body.flowchart;
		if(!flowchart) return res.error('missing field', 'flowchart');
		var opts = req.body.opts || {};
		var audience = req.body.audience;
		if(!audience) return res.error('missing field', 'audience');
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		us.report.fields.getFields(flowchart, opts, audience, username, password, function(err, result){
			if (err)
				return res.error(err);
			res.send(result);
		});
	});
	us.router.all('/report/generate', function(req, res){
		var flowchart = req.body.flowchart;
		if(!flowchart) return res.error('missing field', 'flowchart');
		var opts = req.body.opts || {};
		var cell = req.body.cell;
		if(!cell) return res.error('missing field', 'cell');
		var fields = req.body.fields;
		if(!fields) return res.error('missing field', 'fields');
		var username = req.body.username;
		if(!username) return res.error('missing field', 'username');
		var password = req.body.password;
		if(!password) return res.error('missing field', 'password');

		us.report.report.doReport(flowchart, cell, fields, opts, username, password, function(err, result){
			if (err)
				return res.error(err);
			res.send(result);
		});
	});
	//ACCLEAN ROUTES
	//ACTRG ROUTES
	us.router.all('/trigger', function(req, res){
		var campaignCode = req.body.campaignCode;
		var flowchartName = req.body.flowchartName;
		if(!campaignCode && !flowchartName) return res.error('missing field', 'campaignCode', 'flowchartName');

		var triggerMsg = req.body.triggerMsg;
		if(!triggerMsg) return res.error('missing field', 'triggerMsg');
		us.trigger(campaignCode, flowchartName, triggerMsg, function(err, result){
			if(err)
				return res.error(err);
			res.send(result);
		});
	});
	return us.router;
}
module.exports = us;