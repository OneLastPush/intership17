var path = require('path');
var exec = require('child_process').exec;
var log = require('smart-tracer');
var browse = require('./browse');

module.exports = function splitFile(file, outputFolder, opts, cb){ //-t, default is same as input
	var c = {
		column: opts.column || 'segment', //-s
		delim: opts.delim || ',', //-d
		quoteChar: opts.quoteChar || '"', //-q
		caseSensitive: opts.caseSensitive || false, //-cs
		force: opts.force || false //-f
	};

	browse.ensureDirectory(outputFolder, function(err){
		if(err) return cb(err);

		file = path.normalize(file);
		if(!path.isAbsolute(file))
			file = path.join(__dirname, '..', file);

		function param(k, v){
			var str = '';
			if(k) str += k;
			if(v){
				v = v.replace(/\/|\s|"/g, function(v){
					return '\\'+v;
				});
				str += ' \"'+v+'\"';
			}
			str += ' ';
			return str;
		}

		var cmd = param('python', path.join(__dirname, 'file_split.py'));
		cmd += param('-s', c.column);
		cmd += param('-t', path.join(__dirname, '..', outputFolder));
		if(c.caseSensitive)
			cmd += param('-cs');
		if(c.force);
			cmd += param('-f');
		cmd += param('-d', c.delim);
		cmd += param('-q', c.quoteChar);
		cmd += param(undefined, file);

		log.trace(cmd);
		exec(cmd, function(err, stdout, stderr){
			if(err)
				return cb(err);
			if(stderr)
				return cb(stderr);
			cb(undefined, stdout);
		});
	});
};