var moment = require('moment');
var express = require('express');
var mailer = require('nodemailer');
var log = require('smart-tracer');

var config = {};

function send(email, cb){
	if(!config.active || !config.address)
		return cb(new Error('Missing email configurations'));
	email.from = config.display_name + ' <'+config.address+'>';

	var transport = {
		service: config.service,
		auth: {
			user: config.address,
			pass: config.password
		}
	};
	log.trace('Sending email with: '+ transport.service + ' [' + transport.auth.user + ']\n', email);
	mailer.createTransport(transport).sendMail(email, cb);
}

function applyVariables(s){
	if(!s)
		return s;
	s = s.replace(/{server time}/g, moment().format('YYYY.MM.DD HH:mm:ss A'));
	return s;
}

var router = express.Router();
router.use('/send', function(req, res){
	var subject = req.body.subject;
	var body = req.body.body;
	var emails = req.body.emails;

	subject = applyVariables(subject);
	body = applyVariables(body);

	send({
		to: emails,
		subject: subject,
		html: body
	}, function(err, info){
		log.trace(info);
		if(err){
			log.error(err);
			res.error('Email error');
		}else
			res.sendStatus(200);
	});
});

module.exports = {
	setup: function setup(emailConfig){
		config = emailConfig;
		return this;
	},
	router: router,
	send: send
};
