var path = require('path');

var express = require('express');

var log = require('smart-tracer');

var router = express.Router();

function auditOnSuccess(url, doAudit){
	router.all(url, function(req, res, next){
		var params = req.params; //for some reason req.params are flushed when finish is called
		var write = res.write; //can't get what res saved, but we can cache it
		var allData = '';
		res.write = function(data){
			allData += data.toString();
			write.apply(res, arguments);
		}
		res.on('finish', function(){
			req.params = params;
			if(res.statusCode == 200)
				doAudit(req, res, allData);
		});
		next();
	});
}

// FILE SYSTEM //
auditOnSuccess('/fs/delete', function(req){ //deleting a file/folder
	var file = req.body.file;
	if(file) file = path.normalize(file);
	var folder = req.body.folder;
	if(folder) folder = path.normalize(folder);
	log.audit('delete', {
		who: req.session.username,
		file: file,
		folder: folder
	});
});
auditOnSuccess('/fs/archive', function(req){ //archiving a file
	var file = req.body.file;
	if(file) file = path.normalize(file);
	var archiveTo = req.body.archiveTo;
	if(archiveTo) archiveTo = path.normalize(archiveTo);
	log.audit('archive', {
		who: req.session.username,
		file: file,
		to: archiveTo
	});
});
// IBM-EMM //
auditOnSuccess('/emm/app/process/run', function(req){ //run flowchart
	var file = req.body.flowchartPath;
	if(file) file = path.normalize(file);
	log.audit('run', {
		who: req.session.username,
		file: file
	});
});
auditOnSuccess('/emm/app/process/kill', function(req, res, text){ //kill flowchart
	var file = req.body.pid;
	if(text){
		try{
			var json = JSON.parse(text);
			file = json.data.filename? path.normalize(json.data.filename): json.data.user;
		}catch(err){
			log.error(new Error(err + '\n' + text));
		};
	}
	log.audit('kill', {
		who: req.session.username,
		file: file
	});
});
// APPLICATION CONTROL //
auditOnSuccess('/:app/app/start', function(req){ //starting an application
	log.audit('start', {
		who: req.session.username,
		application: req.params.app
	})
});
auditOnSuccess('/:app/app/listener/:subapp/start', function(req){ //starting an application
	log.audit('start', {
		who: req.session.username,
		application: req.params.app + '/' + req.params.subapp
	})
});
auditOnSuccess('/:app/app/stop', function(req){ //stopping an application
	log.audit('stop', {
		who: req.session.username,
		application: req.params.app
	})
});
auditOnSuccess('/:app/app/listener/:subapp/stop', function(req){ //stopping an application
	log.audit('stop', {
		who: req.session.username,
		application: req.params.app + '/' + req.params.subapp
	})
});

module.exports = router;