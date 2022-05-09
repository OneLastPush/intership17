var express = require('express');
var log = require('smart-tracer');

var collection = require('./internal').collection;

var router = express.Router();
router.use('/user', require('./router_user'));
router.use('/group', require('./router_group'));
router.all('/permission/get/all', function(req, res){
	collection.permission.getAll(function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/product_info/blueprint', function(req, res){
	res.send(collection.product_info.blueprint);
});
router.all('/product_info/get/all', function(req, res){
	collection.product_info.get({}, function(err, data){
		if(err)
			return res.error(err);
		res.send(data);
	});
});
router.all('/product_info/set', function(req, res){
	var product = req.body.product;
	var data = req.body.data;
	if(!data) return new res.error('missing field', 'data');
	var what = null;
	if(product)
		what = {Product: product};
	collection.product_info.update(what, data, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});
router.all('/product_info/remove', function(req, res){
	var product = req.body.product;
	if(!product) return new res.error('missing field', 'product');
	collection.product_info.remove({
		Product: product
	}, function(err, data){
		if(err)
			return res.error(err);
		res.send(data? true: false);
	});
});

module.exports = router;