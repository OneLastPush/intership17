/**
 * Meat of app
 *
 * what this does:
 * - sets up framework: normal express modules, our middleware, licensing or whatever
 * - call configuration manager to load config or make new config.json file
 * - set up mandatory modules (more complex things like login system, browse, etc)
 * - calls application manager to setup optional or remote/embedded apps/functionality
 * - launches app
 *
 * returns function with 2 params (for testing):
 *  - mode -- string that if says 'tester' app will launch in test mode
 *  - callback that will be called when app starts (& will send app)
 * ei:
 *	require('./app')(function(mode, app){
 *		console.log('app is running');
 *	});
 */
var log = require('smart-tracer');
log.logToFiles(true);
log.setAudit(true);
process.on('uncaughtException', function(err){
	log.error(err.stack); //cacthes unexpected errors outside of express
});

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var us = new EventEmitter();

var env_mode;
module.exports = function(mode, cb){
	env_mode = mode;
	us.once('started', cb);
};

var async = require('async');
var moment = require('moment');
var configuration = require('./src/boot/configuration');
var framework = require('./src/boot/framework');
var meta = require('./package');

configuration(function onLoadApp(config){
	framework([
		/^\/$/,
		/^\/license$/i,
		/^\/redirect/i,
		/^\/login*/i,
		/^\/sys*/i
	], env_mode, function(app){
		log.info('Framework launched');
		app.useVerb = function(verb, url, router){ //TODO as of this date, express does not let you mount a router on a verb. This is the workaround.
			verb = verb.toUpperCase();
			app.use(url, function(req, res, next){
				if(req.method === verb)
					return router(req, res, next);
				return next();
			});
		};

		/*	Router for the QA Module
		 *	@author Jacob Brooker
		 *	@version 1.0 - April 17th, 2017
		 */
		var qaModuleRouter = require('./routes/qa/qa_module_router');
		app.use('/qa_module', qaModuleRouter);

		//compatibiltiy to give ibm-emm credentials in request for emm requests
		var internalDB = require('./src/db/internal');
		app.post('/emm*', function(req, res, next){ //needs to be done before permissions because permissions needs username
			internalDB.collection.user.get({
				Username: new RegExp('^'+escape(req.session.username)+'$', 'i')
			}, function(err, data){
				if(err)
					return res.error(err);
				if(data && data.length > 0){
					data = data[0];
					req.body.username = data['IBM Marketing'].Username;
					req.body.password = data['IBM Marketing'].Password;
				}
				next();
			});
		});
		//audits
		app.use(require('./src/audit'));

		//	login & permission features	//
		var login = require('./src/login').setTest(env_mode == 'test');
		app.useVerb('post', '/login', login.router);
		var route_permissions = require('./src/router_permission');
		app.use(route_permissions.router);
		app.all('/logout', function(req, res){
			req.session.destroy();
			res.redirect('login.html');
		});

		// config //
		config.on('change.Node.logging_level', function(v, o){
			log.setLevel(v);
		});
		log.setLevel(config.get('Node.logging_level'));
		app.post('/config/get', function(req, res){
			var item = req.body.item;
			res.status(200).send(config.get(item));
		});
		app.post('/config/set', function(req, res){
			var item = req.body.item;
			var value = req.body.value;
			config.set(item, value);
			res.status(200).send();
		});

		// server date time //
		app.post('/date', function(req, res){
			res.send(moment().format('YYYY.MM.DD HH:mm:ss A'));
		});

		// emailing //
		var email = require('./src/emailer').setup(config.get('Email'));
		app.useVerb('post', '/email', email.router);
		config.on('change.Email', function(v, o){
			email.setup(v);
		});

		//	mandatory features/modules	//
		var internalDBRouter = require('./src/db/router');
		var watchedPaths = config.get('System Monitoring.watched_paths').split(',').forEach(function(v, i, a){
			a[i] = v.trim();
		});
		var systemInfo = require('system_info_monitoring')(watchedPaths);
		var browse_fs = require('browse_fs');
		var browse_ftp = require('browse_ftp')(config.get('FTP'));
		config.on('change.FTP', function(v, o){
			browse_ftp.setServers(v);
		});

		app.useVerb('post', '/db/internal', internalDBRouter);
		app.useVerb('post', '/sys', systemInfo.router);
		browse_fs.postMiddlewareMiddleware = route_permissions.fsRouter;
		app.post('/fs/archive', function(req, res, next){
			req.body['archiveTo'] = config.get('Node.archive_folder');
			next();
		});
		app.useVerb('post', '/fs', browse_fs.router);
		app.useVerb('post', '/ftp', browse_ftp.router);

		// Internship 2017 routes
		require('./routes/qa/qa_component_routes').setRoutes(app);

		// plugs applications //
		var manager = require('./src/boot/application_manager');
		config.default('Apache.log_extension', '');
		async.forEachOf({
			'/emm': 'IBM EMM',
			'/cognos': 'IBM Cognos',
			'/websphere': 'IBM WebSphere',
			'/weblogic': 'Oracle WebLogic',
			'/apache': 'Apache',
			'/iis': 'Microsoft IIS'
		}, function(v, k, cb){
			manager.register(app, k, v, function(err, data){
				if(err)
					log.error(v +': '+ err);
				else
					log.info(v + ': ' + (data.instance? 'embedded': 'slave') + ' on ' + data.mount);
				cb(undefined, data);
			});
		}, function(err, res){
			if(err)
				throw err;
			app.post('/apps', function(req, res){
				var apps = manager.applications;
				var data = [];
				for(var f in apps)
					data.push({name: f, mount: apps[f].mount});
				res.send(data);
			});
			app.post('/apps/logs', function(req, res){
				var apps = manager.applications;
				var logApps = [];
				for(var f in apps){
					if(f == 'IBM EMM'){
						logApps.push({
							name: f + ' Flowcharts',
							mount: '/emm/app/process',
							value: apps[f],
							logs: { url: 'logs', method: ['process', 'hasLogs'] },
							installLogs: { url: 'logs/install', method: ['process', 'hasInstallLogs'] }
						});
						logApps.push({
							value: apps[f],
							logs: { url: 'logs', method: ['listeners', 'campaign', 'hasLogs'] },
							installLogs: { url: 'logs/install', method: ['listeners', 'campaign', 'hasInstallLogs'] }
						});
					}else{
						logApps.push({
							value: apps[f],
							logs: { url: 'logs', method: ['hasLogs'] },
							installLogs: { url: 'logs/install', method: ['hasInstallLogs'] }
						});
					}
				}

				async.map(logApps, function(v, cb){
					async.parallel([function(cb){
						manager.forward(v.value, v.logs.url, v.logs.method, [], function(err, hasLogs){
							if(err) log.error(err);
							cb(undefined, hasLogs);
						});
					}, function(cb){
						manager.forward(v.value, v.installLogs.url, v.installLogs.method, [], function(err, hasLogs){
							if(err) log.error(err);
							cb(undefined, hasLogs);
						});
					}], function(err, res){
						cb(err, {
							logs: res[0],
							installLogs: res[1],
							name: v.name? v.name: v.value.name,
							mount: v.mount? v.mount: (v.value.mount + '/app'),
							fs: v.value.mount
						});
					});
				}, function(err, data){
					if(err)
						return res.error(err);
					res.send(data);
				});
			});

			// Generic error catcher & run application as http/https //
			//THIS HAS TO GO LAST. Will catch all errors caught in express routes that came before it.
			app.use(function(err, req, res, next){
				log.error(err.stack); //will log
				res.sendStatus(500); //and send 500 like normal behaviour
			});
			app.set('port', process.env.PORT || config.get('Node.*port'));
			var ssl = config.get('SSL');
			if(ssl.active){
				server = require('https').createServer({
					key: fs.readFileSync(ssl.key),
					cert: fs.readFileSync(ssl.cert),
					ca: fs.readFileSync(ssl.ca),
					passphrase: ssl.passphrase,
					requestCert: true,
					rejectUnauthorized: false
				}, app).listen(app.get('port'));
				app.set('protocol', 'https');
			}else{
				app.listen(app.get('port'));
				app.set('protocol', 'http');
			}
			log.info(meta.name.toUpperCase(), 'listening at', app.get('protocol'), app.get('port'));
			us.emit("started", app);
		});
	});
});