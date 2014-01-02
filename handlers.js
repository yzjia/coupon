var pool  = require('./pool');

//sql strings
var queryProsSql = 'select project_id, MAX(PROJECT_NAME) as project_name from tbl_coupon where MERCHANT_ID = ? GROUP BY PROJECT_ID;';

var selectStr = 'id,publish_record_id,merchant_id,project_id,project_name,support_scope,balance,validity_begin,validity_end,min_amount,is_cycle,privilege_amount,privilege_discount,rebate_amount,referer_rebate_amount,referer_rebate_ratio,status,last_modify_time,creator,creator_ip,create_time,remark,deleted';

var queryCouponSql = 'select ' + selectStr + ' from tbl_coupon where balance > 0 and validity_begin <= now() and validity_end >= now() and id = ? for update;';

var queryAliasSql = 'select coupon_id from tbl_coupon_shortalias where id = ?;';

var updateCouponSql = 'update tbl_coupon set balance = ? where id = ?;';

module.exports.queryPros = function(merchantId, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      connection.release();
      console.log('err: ' + err);
      callback(err);
      return;
    }
    connection.query(queryProsSql, merchantId, function(err, rows) {
      if (err) {
        connection.release();
        console.log('err: ' + err);
        callback(err);
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
};

module.exports.query = function(queryParam, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      connection.release();
      console.log('err: ' + err);
      callback(err);
      return;
    }
    if (queryParam.couponId) {
      queryByCouponId(connection, queryParam.couponId, callback);
      return;
    }
    if (queryParam.shortAlias) {
      connection.query(queryAliasSql, queryParam.shortAlias, function(err, rows) {
        if (err) {
          connection.release();
          console.log('err: ' + err);
          callback(err);
          return;
        }
        if (rows.length <= 0) {
          //无结果
          connection.release();
          console.log('短码无对应长码: ' + queryParam.shortAlias);
          var queryResult = new QueryResultDTO();
          queryResult.isValidity = false;
          callback(null, queryResult);
          return;
        }
        queryByCouponId(connection, rows[0].coupon_id, callback);
      });
    } else {
      console.log('neither couponId or shortAlias is set');
      connection.release();
      var queryResult = new QueryResultDTO();
      queryResult.isValidity = false;
      callback(null, queryResult);
      return;
    }
  });
};

function queryByCouponId(connection, couponId, callback) {
  connection.beginTransaction(function(err) {
    if (err) {
      console.log(err);
      throw err;
    }
    connection.query(queryCouponSql, couponId, function(err, rows) {
      if (err) {
        connection.rollback(function(){
          throw err;
        });
        connection.release();
        console.log('err: ' + err);
        callback(err);
        return;
      }
      connection.commit(function(err) {
        if (err) {
          connection.rollback(function(){
            throw err;
          });
        }
      });
      connection.release();
      if (rows.length <= 0) {
        //无结果
        console.log('优惠券不存在: ' + couponId);
        var queryResult = new QueryResultDTO();
        queryResult.isValidity = false;
        callback(null, queryResult);
        return;
      }
      var queryResult = new QueryResultDTO();
      var coupon = new CouponModel(
      {
        couponId: rows[0].id,
        merchantId: rows[0].merchant_id,
        projectId: rows[0].project_id,
        projectName: rows[0].project_name,
        supportScope: rows[0].support_scope,
        minAmount: rows[0].min_amount,
        isCycle: rows[0].is_cycle == 1 ? true: false,
        privilegeAmount: rows[0].privilege_amount,
        privilegeDiscount: rows[0].privilege_discount,
        rebateAmount: rows[0].rebate_amount,
        refererRebateAmount: rows[0].referer_rebate_amount,
        refererRebateRatio: rows[0].referer_rebate_ratio,
        status: rows[0].status
      });
      queryResult.coupon = coupon;
      queryResult.isValidity = true;
      console.log('优惠券已返回: ' + coupon);
      callback(null, queryResult);
      return;
    });
  });
}

module.exports.consume = function(consumeParam, callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      connection.release();
      console.log('err: ' + err);
      callback(err);
      return;
    }
    if (consumeParam.couponId) {
      consumeByCouponId(connection, consumeParam.couponId, callback);
      return;
    }
    if (consumeParam.shortAlias) {
      connection.query(queryAliasSql, consumeParam.shortAlias, function(err, rows) {
        if (err) {
          connection.release();
          console.log('err: ' + err);
          callback(err);
          return;
        }
        if (rows.length <= 0) {
          //无结果
          connection.release();
          console.log('短码无对应长码: ' + consumeParam.shortAlias);
          var queryResult = new QueryResultDTO();
          queryResult.isValidity = false;
          callback(null, queryResult);
          return;
        }
        consumeByCouponId(connection, rows[0].coupon_id, callback);
      });
    } else {
      console.log('neither couponId or shortAlias is set');
      connection.release();
      var queryResult = new QueryResultDTO();
      queryResult.isValidity = false;
      callback(null, queryResult);
      return;
    }
  });
};

function consumeByCouponId(connection, couponId, callback) {
  connection.beginTransaction(function(err) {
    if (err) {
        connection.release();
      console.log(err);
      throw err;
    }
    connection.query(queryCouponSql, couponId, function(err, rows) {
      if (err) {
        connection.rollback(function(){
          throw err;
        });
        connection.release();
        console.log('err: ' + err);
        callback(err);
        return;
      }
      if (rows.length <= 0) {
        //无结果
        connection.commit(function(err) {
          if (err) {
            connection.rollback(function(){
              throw err;
            });
          }
        });
        connection.release();
        console.log('优惠券不存在: ' + couponId);
        var consumeResult = new ConsumeResultDTO();
        consumeResult.result = 'FAIL';
        consumeResult.resultInfo = '优惠券不存在或数量不足';
        callback(null, consumeResult);
        return;
      }

      connection.query(updateCouponSql, [(Number(rows[0].balance - 1)), rows[0].id], function(err) {
        if (err) {
          connection.rollback(function(){
            connection.release();
            throw err;
          });
          connection.release();
          console.log('err: ' + err);
          callback(err);
          return;
        }

        connection.commit(function(err) {
          if (err) {
              connection.rollback(function(){
              connection.release();
              throw err;
            });
          }
            var consumeResult = new ConsumeResultDTO();
          var coupon = new CouponModel(
          {
            couponId: rows[0].id,
            merchantId: rows[0].merchant_id,
            projectId: rows[0].project_id,
            projectName: rows[0].project_name,
            supportScope: rows[0].support_scope,
            minAmount: rows[0].min_amount,
            isCycle: rows[0].is_cycle == 1 ? true: false,
            privilegeAmount: rows[0].privilege_amount,
            privilegeDiscount: rows[0].privilege_discount,
            rebateAmount: rows[0].rebate_amount,
            refererRebateAmount: rows[0].referer_rebate_amount,
            refererRebateRatio: rows[0].referer_rebate_ratio,
            status: rows[0].status
          });
          consumeResult.coupon = coupon;
          consumeResult.result = 'SUCCESS';
          consumeResult.resultInfo = '交易成功';
          console.log('交易成功: ' + coupon.couponId);
          callback(null, consumeResult);
        });
        connection.release();
        return;
        });
      
    });
  });
}