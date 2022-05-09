/**
 * mocha
 */
var db = require('../index');

var override = {
	name: 'override',
	opts: {
		jar: './test/ojdbc6.jar',
		url_override: true,
		url: 'jdbc:oracle:thin:INTPROFILE/Cleargoals2014'+
			'@10.0.0.168:1521'+
			':ORCL'
	},
	query: 'SELECT SYSDATE FROM DUAL'
};
var jdbcs = [
{
	name: 'Oracle',
	opts: {
		jar: './test/ojdbc6.jar',
		host: '10.0.0.168',
		port: '1521',
		sid: 'ORCL',

		user: 'INTPROFILE',
		password: 'Cleargoals2014'
	},
	query: 'SELECT SYSDATE FROM DUAL'
},{
	name: 'DB2',
	opts: {
		jar: './test/db2jcc4.jar',
		host: '10.0.0.192',
		port: '50000',
		dbname: 'TEST',

		username: 'EMM',
		password: 'CG!3575001'
	},
	query: 'VALUES current date'
// },{
// 	name: 'MySQL',
// 	opts: {
// 		jar: './test/mysql-connector-java-5.1.32-bin.jar',
// 		host: '10.0.0.168', //t10
// 		port: '',
// 		sid: '',

// 		user: '',
// 		password: ''
// 	},
// 	query: ''
// },{
// 	name: 'SQL Server',
// 	opts: {
// 		jar: './test/sqljdbc4.jar',
// 		host: '10.0.0.192', //t11
// 		port: '',
// 		dbname: '',

// 		user: 'emm',
// 		password: ''
// 	},
// 	query: ''
}];

describe('jdbc-generic', function(){
	it('register unknown jar', function(done){
		var err;
		try{
			db.init('iamnotthere.jar');
		}catch(e){
			err = e;
			done();
		}
		if(!err)
			done(new Error('unrecognized jar passed without issue'));
	});
	describe('using', function(){
		before(function(){
			var jars = [];
			jdbcs.forEach(function(test){
				jars.push(test.opts.jar);
			});
			db.init(jars);
		});
		it('url override', function(done){
			db.create(override.name, override.opts, function(err){
				if(err)
					return done(err);
				db.query(override.name, override.query, function(err, data){
					if(err)
						return done(err);
					if(!data)
						return done(new Error('No data returned'));
					console.log(data);
					done(err);
				});
			});
		});
		describe('database types', function(){
			jdbcs.forEach(function(test){
				describe(test.name, function(){
					it('create', function(done){
						db.create(test.name, test.opts, done);
					});
					it('query', function(done){
						db.query(test.name, test.query, function(err, data){
							if(err)
								return done(err);
							if(!data)
								return done(new Error('No data returned'));
							console.log(data);
							done(err);
						});
					});
					it('erronous query', function(done){
						db.query(test.name, 'SELECT abc FROM i-dont-exist', function(err, data){
							if(!err)
								return done(new Error('no error was returned'));
							if(data)
								return done(new Error('data was returned', data));
							done();
						});
					});
					it('version', function(done){
						db.getVersion(test.name, function(err, version){
							if(err)
								return done(err);
							if(!version)
								return done(new Error('No version returned'));
							console.log(version);
							done(err);
						});
					});
				});
			});
		});
	});
});