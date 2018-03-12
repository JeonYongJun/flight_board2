var sql = require('mssql');

function err_handler(err,msg,callback){
  // console log
  console.log(err);
  var result = {};
  result['result'] = 0;
  result['message'] = msg;
  callback(result);
  process.exit(1);
}
//yyyy-mm-dd 형식 데이터와 날짜 차이값을 받아 해당 날짜 리턴
//예 getDate('2017-11-11',2)
function getDate(dd,delta){
  var moment = require('moment');
  var _date = moment(dd,'YYYY-MM-DD');
  _date.add(delta,'days');
  return _date.format('YYYY-MM-DD');
}

module.exports = (function (config,date,port,callback){
  sql.connect(config, err => {
      if(err){err_handler(err,'connection error!',callback);}//error checks
      // Plan List
      //var query = `select * from FlightPlan where FlightPlanID = 107004 and LOGDate = '${date}'`;
      var date1 = getDate(date,0);
      var date2 = getDate(date,1);
      //var date2 = getDate(date,1);
      var query = `DECLARE @Station NVARCHAR(3) SET @Station = '${port}';
                  DECLARE @FromDate DATETIME SET @FromDate = '${date1} 04:00:00.000';
                  DECLARE @ToDate DATETIME SET @ToDate = '${date2} 04:00:00.000';
                  SELECT FlightPlanID, FlightKey, ACNumber,
                  dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
                  LOGDate, FlightNumber, RouteFrom, RouteTo,
                  StandardTimeDeparture, StandardTimeArrival
                  FROM FlightPlan
                  WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
                  AND ( RouteFrom = @Station OR RouteTo = @Station )
                  ORDER BY FlightKey ASC`;
      if(port == 'ALL'){
        query = `DECLARE @FromDate DATETIME SET @FromDate = '${date1} 04:00:00.000';
                DECLARE @ToDate DATETIME SET @ToDate = '${date2} 04:00:00.000';
                SELECT FlightPlanID, FlightKey, ACNumber,
                dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
                LOGDate, FlightNumber, RouteFrom, RouteTo,
                StandardTimeDeparture, StandardTimeArrival
                FROM FlightPlan
                WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
                ORDER BY FlightKey ASC`;
      }
      console.log(query);
      var request = new sql.Request();
      var result = {};
      var rows = [];
      request.stream = true;
      request.input('date1',sql.VarChar(10),date1);
      request.input('date2',sql.VarChar(10),date2);
      request.input('port',sql.VarChar(3),port);
      request.query(query);
      request.on('row',(row) => {
        rows.push(row);
      });
      request.on('error',(err) => {//error checks
        if(err){err_handler(err,'select error!',callback);}
      });
      request.on('done',(retVal) => {
        //console.log(retVal);
        result['result'] = 1;
        result['plan'] = rows;
        callback(result);
        //connection close
        process.exit(0);
        //process.exit(1);
      });
  });
  sql.on('error', err => {// ... error handler
      err_handler(err,'sql server error!',callback)
  })
});
