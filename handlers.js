var mysql = require('mysql');
var pool  = mysql.createPool({
  host     : 'localhost',
  port 	   : '3306',
  database : 'coupon',
  user     : 'root',
  password : '123456'
});
var queryProsSql = 'select project_id, MAX(PROJECT_NAME) as project_name from tbl_coupon where MERCHANT_ID = ? GROUP BY PROJECT_ID';

module.exports.queryPros = function(merchantId, callback) {
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log('err: ' + err);
			connection.release();
			callback(null);
			return;
		}
		connection.query(queryProsSql, merchantId, function(err, rows) {
			if (err) {
				console.log('err: ' + err);
				connection.release();
				callback(null);
				return;
			}
			var projectResult = new ProjectResultDTO({
				merchantId: merchantId,
				projectList: []
			});
			for (var i in rows) {
				var project = new ProjectModel({
					projectId: rows[i].project_id,
					projectName: rows[i].project_name
				});
				projectResult.projectList.push(project);
			}
			connection.release();
			callback(null, projectResult);
			return;
		});
	});
}

module.exports.query = function(queryParam, callback) {
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log('err: ' + err);
			connection.release();
			callback(null);
			return;
		}

		if (queryParam.couponId) {

		} else if (queryParam.shortAlias) {

		} else {
			var queryResult = new QueryResultDTO();
			queryResult.isValidity = false;
			callback(null, queryResult);
			return;
		}
		connection.query(sql, merchantId, function(err, rows) {
			if (err) {
				console.log('err: ' + err);
				connection.release();
				callback(null);
				return;
			}
			var projectResult = new ProjectResultDTO({
				merchantId: merchantId,
				projectList: []
			});
			for (var i in rows) {
				var project = new ProjectModel({
					projectId: rows[i].project_id,
					projectName: rows[i].project_name
				});
				projectResult.projectList.push(project);
			}
			connection.release();
			callback(null, projectResult);
			return;
		});
	});
}