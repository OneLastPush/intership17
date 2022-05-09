var emm = require('../../emm');
var path = require('path');
var config = require('smart-config');

var us = {
	export: function(catFile, username, password, cb){
		catFile = path.join(config.get('IBM Campaign._default_partition'), catFile);
		var dest = path.join(config.get('General.public_folder'));
		emm.call('unica_acsesutil', ['-t', catFile, '-h', config.get('IBM Campaign.default_partition'), '-x', '-o', dest], {
			user: username,
			pw: password
		}, function(err, res){
			var exportedCatalog = path.join(config.get('General.public_folder'), path.basename(catFile, '.cat') + '.xml');
			if(res)
				res.exportedCatalog = path.join(dest, path.basename(catFile, '.cat') + '.xml');
			cb(null, res);
		});
	}
};
module.exports = us;