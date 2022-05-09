var path = requrie('path');
var log = require('smart-tracer');
var pack = require('./package.json');

var logErr = function(err){
	log.error(err);
};

if(require('os').type() == 'Windows_NT'){
	log.info('Windows system detected; launching as service');
	var svc = new (require('node-windows').Service)({
		name: pack.name,
		description: pack.description,
		script: path.join(__dirname, pack.entrance)
	});

	svc.on('invalidinstallation', logErr);
	svc.on('error', logErr);
	svc.on('install', function(){
		log.info('Installed Windows Service ', pack.name);
		svc.start();
	});
	svc.on('start', function(){
		log.info('Starts Windows Service ', pack.name);
	});
	svc.on('uninstall', function(){
		log.info('Uninstalled as Windows Service ', pack.name);
	});
	svc.on('alreadyinstalled', function(){
		svc.start();
	});

	svc.install();
}else{
	log.info('Non-windows system detected; defaulting to xNix launch');
	require('child_process').exec('nohup node '+pack.entrance+' > output.log &', function(err){
		if(err)
			logErr(err);
		else
			log.info('STARTED ', pack.name, ' as nohup > output.log');
	});
}