//index.js
var thrift = require('thrift');
var couponServices = require('./gen-nodejs/CouponServices');
var ttypes = require('./gen-nodejs/coupon_types');
var handlers = require('./handlers');

var queryCoupon = function(queryParam, callback) {
	console.log('queryCoupon');
	callback('ok');
	return;
}

var consumeCoupon = function(consumeParam, callback) {
	console.log('consumeCoupon');
	callback('ok');
	return;
}

var connection = thrift.createServer(couponServices,{
	queryCoupon: queryCoupon,
	consumeCoupon: consumeCoupon,
	queryProjects: handlers.queryPros
});

connection.listen(9090);

console.log("server listenning 9090");