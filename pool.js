var mysql = require('mysql');
module.exports = mysql.createPool({
  host     : 'localhost',
  port 	   : '3306',
  database : 'coupon',
  user     : 'root',
  password : '123456'
});