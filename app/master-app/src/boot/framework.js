var path = require('path');

var license = require('expiration');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var errors = require('errors');
var master = require('master-slave').master;

var config = require('smart-config');
var log = require('smart-tracer');

var JadeMaster = require('../jade_master');

/**
 * Framework for creating an empty licensed json & session enabled backend web application with basic authentication checking
 * @param  {string[]}   publicRoutes these routes will not require authentication
 * @param  {Function} cb           will be called on init complete with express app & master.router
 */
function make(publicRoutes, env_mode, cb){
	//expiration / licensing
	license.validate(path.join(__dirname, '..', '..', 'license.json'), function(err, license){
		if(err) throw err;
		log.warn(license.daysLeft+' days left in '+license.type+' for '+license.name);
	});
	//environmental variables / for tools to work properly
	require('env-vars').read('./env.ini');

	var app = express();
	app.set('env', env_mode);
	//front-end
	app.set('views', path.join('..', '..', 'web', 'jade'));
	app.set('view engine', 'jade');
	app.use(express.static(path.join('..', '..', 'web', 'public')));
	//back-end
	app.use(express.static(path.join(config.get('Node.public_folder'))));
	//middleware
	app.use(morgan('dev', {
		immediate: false,
		skip: function(req, res){ //only logs errors or if in debug or trace mode.
			var print = false;
			print |= log._config.level.match(/(debug)|(trace)/i)? true: false;
			print |= log._config.level.match(/(info)|(warn)/i)? res.statusCode >= 400: false;
			print |= res.statusCode >= 500;
			return !print;
		}
	}));
	var cookieAlive = 1000*60 *20; //20 minutes
	app.use(session({
		secret: config.get('Node.*session_password'),
		cookie: {
			secure: app.get('env') === 'test'? false: config.get('SSL.active'), //unit tests don't work with secure on
			expires: new Date(Date.now() + cookieAlive),
			maxAge: cookieAlive
		},
		resave: false, //if resaves every req
		rolling: true,
		saveUninitialized: false, //won't save session unless we edit session first. Makes it faster not to save.
		store: new FileStore(),
		unset: 'destroy'
	}));

	require('../db/internal').init(app.get('env') === 'test'? 'test/data': 'data', function(err){
		if(err) throw err;
		var jade = new JadeMaster('dashboard.html', function(err, jade){
			if(err) throw err;
			app.use(jade.router);

			master = master();
			master.config.auth = config.get('Master.auth');
			config.on('change.Master.auth', function(v, o){
				master.config.auth = v;
			});
			app.use(master.router);
			app.use(errors.addErrors('maestro', path.join(__dirname, '..', '..', 'errors.ini'), [
				//authorization
				['401-0', /not logged in/i],
				['401-1', /authentication service unrecognized/i],

				['401-2', /internal login failed/i],
				['401-3', /ldap login failed/i],

				['404-1', /(user not found)|(username or password do not match records)/i],
				['401-1', /user suspended/i],

				['401-4', /failed login/i],
				['401-5', /username or token not valid/i],

				['400-10', /invalid email/i],
				['400-11', /invalid password reset/i],
				['403-0', /not authorized/i],

				//file related
				['400-10', /invalid path/i],

				//missing
				['404-1', /missing field/i],
				['404-2', /missing collection/i],
				['404-3', /missing email/i],
				['404-4', /missing log/i],

				//misc
				['400-4', /database/i],
				['400-6', /email/i],

				//feature
				['400-9', /not enabled/i],
				['404-5', /not supported/i]
			]).middleware);

			function processOrigins(value){
				value = value.split(',');
				value.forEach(function(v, i, a){
					a[i] = v.trim();
				});
				config.set('Node._allowed_origins', value);
			}
			config.on('change.Node.allowed_origins', function(v, o){
				processOrigins(v);
			});
			processOrigins(config.get('Node.allowed_origins'));
			app.use(function(req, res, next){
				res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization, Content-Length');
				res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
				res.header('Access-Control-Allow-Credentials', true);
				res.header("Cache-Control", "no-cache, no-store, must-revalidate");

				var origins = config.get('Node._allowed_origins');
				if(origins.indexOf('*') >= 0 || origins.indexOf(req.get('origin')) >= 0)
					res.header("Access-Control-Allow-Origin", req.get('origin'));

				if(req.method == 'OPTIONS') //firefox compatibility
					return res.send(200);

				var needSession = true;
				publicRoutes.forEach(function(regex){
					if(req.url.match(regex))
						needSession = false;
				});
				if(needSession && !req.session.username)
					return res.error(new Error('not logged in'));

				next();
			});

			app.all('/license', function(req, res){
				res.send(license.license.daysLeft+""); //because express takes numebrs as status code
			});

			app.use(bodyParser.urlencoded({ extended: true }));
			app.use(bodyParser.json());

			cb(app);
		});
	});
}
module.exports = make;