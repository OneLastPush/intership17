/**
 * This is a mocha test suite
 *
 * > npm install -g mocha
 *
 * to run:
 * > mocha
 * or
 * > mocha test/test.js
 *
 * then you will see if passes
 */
var fs = require('fs');
var config = require('../index');

var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var hash = '7b03fc3e91723167dd187ace150cb3d78572b46daae0fb410de598df74bdd0cf';
function encrypt(value){
	var cipher = crypto.createCipher(algorithm, hash);
	var res = cipher.update(value, 'utf8', 'hex');
	res += cipher.final('hex');
	return res;
}
function decrypt(value){
	var decipher = crypto.createDecipher(algorithm, hash);
	var res = decipher.update(value, 'hex', 'utf8');
	res += decipher.final('utf8');
	return res;
}

var assert = require('assert');

describe('smart-config', function(){
	describe('defaults', function(){
		before(function(){
			config.setFile('./test/config.json');
		});
		after(function(done){
			fs.unlink('./test/config.json', done);
		});
		after(function(done){
			fs.unlink('./test/config2.json', done);
		});
		it('set default', function(){
			config.default('application', {
				host: '127.0.0.1',
				port: '221'
			});
			config.default('General', {
				port: '3333',
				session_passphrase: 'ergfgefgregergfrger'
			});
		});
		it('loading with error gets default', function(done){
			config.load(function(err){
				if(!err)
					return done(new Error('expected error but did not get one'));
				config.save();
				assert.deepEqual(config.get('application'), {
					host: '127.0.0.1',
					port: '221'
				});
				assert.deepEqual(config.get('General'), {
					port: '3333',
					session_passphrase: 'ergfgefgregergfrger'
				});
				done();
			});
		});
		it('loading existing sets defaults', function(){
			config.setFile('./test/config2.json');
			config.save();
			config.load(function(err){
				if(err)
					return done(err);
				assert.deepEqual(config.get('application'), {
					host: '127.0.0.1',
					port: '221'
				});
				assert.deepEqual(config.get('General'), {
					port: '3333',
					session_passphrase: 'ergfgefgregergfrger'
				});
				done();
			});
		});
		it('adding default in runtime', function(){
			assert.deepEqual(config.get('newDefault'), undefined);
			config.default('newDefault',{
				description: 'HAHAHAHA'
			});
			assert.deepEqual(config.get('newDefault'), {
				description: 'HAHAHAHA'
			});
		});
		it('changing defaulted key\'s value', function(){
			assert.deepEqual(config.get('application'), {
				host: '127.0.0.1',
				port: '221'
			});
			config.set('application.host', 'localhost');
			assert.deepEqual(config.get('application'), {
				host: 'localhost',
				port: '221'
			});
		});
		it('default for existing value', function(){
			config.default('application.port', 80);
			assert.equal(config.get('application.port'), '221');
		});
	});
	describe('set', function(){
		before(function(){
			config.setFile('./test/configSet.json', true);
		});
		after(function(done){
			fs.unlink('./test/configSet.json', done);
		});
		it('new values: string, number, array', function(){
			config.set('string', 'vstring');
			assert.equal('vstring', config.rawData.string);
			config.set('number', 1);
			assert.equal(1, config.rawData.number);
			config.set('array', [1,2]);
			assert.deepEqual([1,2], config.rawData.array);
		});
		it('overwrite old values: string, number array', function(){
			config.set('string', 'vstring2');
			assert.equal('vstring2', config.rawData.string);
			config.set('number', 2);
			assert.equal(2, config.rawData.number);
			config.set('array', [2,3]);
			assert.deepEqual([2,3], config.rawData.array);
		});
		it('deeply new value', function(){
			config.set('deep.new.value', 'vvalue');
			assert.equal('vvalue', config.rawData.deep.new.value);
		});
		it('another deeply new value in same obj', function(){
			config.set('deep.new.value2', 'vvalue2');
			assert.equal('vvalue', config.rawData.deep.new.value);
			assert.equal('vvalue2', config.rawData.deep.new.value2);
		});
		//EMPTY STRING SAVE RETRUNS TO NROMAL VALUE BUG
		// it('empty string', function(){
		// 	config.set('name', '');
		// 	assert.equal('', config.rawData.name);
		// });
		// it('empty string save bug', function(){
		// 	config.set('name', '');
		// 	//config.save();
		// 	assert.equal('', config.rawData.name);
		// });
	});
	describe('get', function(){
		var data = {
			string: 'vstring',
			string2: '',
			number: 123,
			number2: 0,
			array: [1, 2, 3],
			array2: [],
			obj: {hi: 'hihi'},
			obj2: {},
		};
		before(function(){
			config.setFile('./test/configGet.json', true);
			for(var f in data)
				config.set(f, data[f], false);
		});
		after(function(done){
			fs.unlink('./test/configGet.json', done);
		});
		var tests = [{
			name: 'unsaved',
			before: function(done){
				done();
			}
		},{
			name: 'saved & reloaded',
			before: function(done){
				config.save(function(err){
					if(err) throw err;
					config.load(function(err){
						done(err);
					});
				});
			}
		}];
		tests.forEach(function(t){
			describe(t.name, function(){
				before(t.before);
				Object.keys(data).forEach(function(f){
					it('retrieve ' + f + ': ' + JSON.stringify(data[f]), function(){
						assert.deepEqual(data[f], config.get(f));
					});
				})
				it('retrieve non existing value', function(){
					assert.equal(undefined, config.get('noexisting'));
				});
				it('retriev deep non existing value', function(){
					assert.equal(undefined, config.get('no.exist.ing'));
				});
				it('get all', function(){
					assert.deepEqual(data, config.get());
				});
			});
		});
	});
	describe('change event', function(){
		before(function(){
			config.setFile('./test/configChange.json', true);
		});
		after(function(done){
			fs.unlink('./test/configChange.json', done);
		});
		it('change a value', function(){
			var ran = false;
			var onChange = function(value, origValue){
				ran = true;
				if(value != 'changed')
					throw new Error('new value does not match, expected sup but got ' + value);
				if(origValue !== undefined)
					throw new Error('original value was expected to be undefined, got '+origValue);
			};
			config.once('change.test', onChange);
			config.set('test', 'changed');
			if(!ran)
				throw new Error('change event was never called');
		});
		it('change a value to the same value', function(){
			var onChange = function(key, value, origValue){
				throw new Error('change event was called even though value did not change');
			};
			config.once('change.test', onChange);
			config.set('test', 'changed');
			config.removeListener('change.test', onChange);
		});
		it('change value type to object with subobjects', function(){
			var tests = [{
				k: 'test',
				o: 'changed',
				v: {deeper: {}}
			},{
				k: 'test.deeper',
				o: undefined,
				v: {}
			}];
			tests.forEach(function(t){
				config.once('change.'+t.k, function(v, o){
					assert.deepEqual(t.o, o);
					assert.deepEqual(t.v, v);
					t.ran = true;
				});
			});
			config.set(tests[0].k, tests[0].v);
			tests.forEach(function(t){
				if(!t.ran)
					throw new Error('Did not call change event for ' + t.k);
			});
		})
		it('change deeper value and get each change event', function(){
			var tests = [{
				k: 'test.deeper.change',
				o: undefined,
				v: 'yes'
			},{
				k: 'test.deeper',
				o: {},
				v: {
					change: 'yes'
				}
			},{
				k: 'test',
				o: {deeper: {}},
				v: {deeper: {
					change: 'yes'
				}}
			}];
			tests.forEach(function(t){
				config.once('change.'+t.k, function(v, o){
					assert.deepEqual(t.o, o, 'Expected key ' + t.k + ' to have old value ' + t.o + ' but it is ' + o);
					assert.deepEqual(t.v, v);
					t.ran = true;
				});
			});
			config.set(tests[0].k, tests[0].v);
			tests.forEach(function(t){
				if(!t.ran)
					throw new Error('Did not call change event for ' + t.k);
			});
		});
		it('change deeper values and get each change event', function(){
			var tests = [{
				k: 'test.deeper',
				o: {
					change: 'yes'
				},
				v: {
					change: 'ofc',
					change2: 'yep'
				}
			},{
				k: 'test',
				o: {deeper: {
					change: 'yes'
				}},
				v: {deeper: {
					change: 'ofc',
					change2: 'yep'
				}}
			},{
				k: 'test.deeper.change',
				o: 'yes',
				v: 'ofc'
			},{
				k: 'test.deeper.change2',
				o: undefined,
				v: 'yep'
			}];
			tests.forEach(function(t){
				config.once('change.'+t.k, function(v, o){
					assert.deepEqual(t.o, o);
					assert.deepEqual(t.v, v);
					t.ran = true;
				});
			});
			config.set(tests[0].k, tests[0].v);
			tests.forEach(function(t){
				if(!t.ran)
					throw new Error('Did not call change event for ' + t.k);
			});
		});
	});
	describe('preSave & postLoads', function(){
		before(function(done){
			config.setFile('./test/configPrePostLoads.json', true);
			config.on('preSave', function(data, save){
				function parseObj(obj){
					for(var key in obj){
						if(typeof obj[key] == 'object')
							parseObj(obj[key]);
						else if(key.match(/password/i))
							obj[key] = encrypt(obj[key]);
					}
				}
				parseObj(save);
			});
			config.on('postLoad', function(data){
				function parseObj(obj){
					for(var key in obj){
						if(typeof obj[key] == 'object')
							parseObj(obj[key]);
						else if(key.match(/password/i))
							obj[key] = decrypt(obj[key]);
					}
				}
				parseObj(data);
			});
			config.set('passwording', 'supsup123', false, done);
		});
		after(function(done){
			fs.unlink('./test/configPrePostLoads.json', done);
		});
		it('check if file encrypted', function(done){
			config.save(function(err){
				if(err) throw err;
				var data = require('./configPrePostLoads.json');
				if(decrypt(data.passwording) !== 'supsup123')
					throw new Error('save data not encrypted correctly');
				done();
			});
		});
		it('check if config data unencrypted', function(done){
			config.load(function(err){
				if(config.get('passwording') !== 'supsup123')
					throw new Error('config file not loaded sanitized values correctly');
				done();
			});
		});
	});
});