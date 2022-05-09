module.exports = function(db, cb){
	db.createCollection('permission', {
		Permission: ''
	}, {
		indexes: [{fields: {Permission: 1}, opts: {unique: true}}],
		setDefaults: function(cb){
			var permList = [
				'manage sessions',
				'review log files',
				'recompute catalogs/flowcharts',
				'view server stats',
				'access console',
				'start & stop the environment',
				'add / remove / modify users',
				'read / write config'
			];
			var index = permList.length +1;
			function done(err){
				if(err)
					cb(err);
				if(--index===0)
					cb();
			}
			for(var i in permList){
				this.insert({
					Permission: permList[i]
				}, done);
			}
			done();
		}
	}, function(err, permission){
		if(err)
			return cb(err);
		permission.getAll = function(cb){
			this.getProp({
				Permission: {'$exists': true, '$ne': ''}
			}, 'Permission', cb);
		};
		cb(err, permission);
	});
};