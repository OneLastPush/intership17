var log = require('smart-tracer');

module.exports = function(db, cb){
	db.createCollection('product_info', {
		Product: '',
		'Date purchased': '',
		'Customer number': '',
		Description: '',
		Support: {
			Name: '',
			Email: '',
			Phone: ''
		}
	}, {
		indexes: [{fields: {Product: 1}, opts: {unique: true}}],
		preUpdate: function(what, data, cb){
			if(data){
				var purchased = data['Date purchased'];
				if(purchased && !(purchased instanceof Date)){
					try{
						data['Date purchased'] = new Date(purchased);
					}catch(err){
						return cb(err);
					}
				}
			}
			cb(undefined, data);
		}
	}, function(err, product_info){
		if(err)
			return cb(err);
		cb(err, product_info);
	});
};