var sql = require('mssql');
// for db processing
var config = require('./db_info');
// development || production
var connect_info = process.env.DB_CONFIG == 'real'?config.real:config.dev;
console.log('DB Connection Information : ',connect_info);

var for_query_connection;

function ConnectMsSQL(callback) {
  var connection = new sql.ConnectionPool(connect_info, function(err) {
    console.log('create connection');
    if(err) {
      return callback(err);
    }
    callback(null, connection);
  })
}

function runQuery(sqlquery, callback) {
  console.log('run query');
  if(!for_query_connection) {
    ConnectMsSQL(function(err, conn) {
      if(err) {
        return callback(err);
      }
      for_query_connection = conn;
      runQuery(sqlquery,callback);
    })
    return;
  }
  var request = new sql.Request(for_query_connection);
  request.query(sqlquery, callback);
}

exports.runQuery = runQuery;
