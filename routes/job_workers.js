var express = require('express');
var router = express.Router();

var connection = require('./db/connection');
var util = require('./lib/util');

//yyyy-mm-dd 형식 데이터와 날짜 차이값을 받아 해당 날짜 리턴
//예 getDate('2017-11-11',2)
function getDate(dd,delta){
  var moment = require('moment');
  var _date = moment(dd,'YYYY-MM-DD');
  _date.add(delta,'days');
  return _date.format('YYYY-MM-DD');
}

function check_dept(port){
  var info = {
    ALL:"('5100','5200','5300','6100','6200','6300','3300','3200','3400','3000','3100')",
    GMP:"('5100','5200','5300')",
    ICN:"('6100','6200','6300')",
    CJU:"('3300')",
    CJJ:"('3200')",
    PUS:"('3400')",
    ETC:"('3000','3100')"
  }
  if(info[port]){
    return info[port];
  }else{
    return info['ETC'];
  }
}

/* GET home page. */
router.get('/:station', function(req, res, next) {
  var port = req.params.station;
  var dept_code = check_dept(port);
  console.log('/job_workers',req.params);
  var query = `SELECT EmpCode, EmpName
              FROM EmpMaster
              WHERE DefaultDeptCode in  ${dept_code}
              ORDER BY EmpName`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
});

router.get('/info/:empcd',function(req,res,next){
  var empcd = req.params.empcd;
  console.log('/job_workers/info',req.params);
  var query = `SELECT EmpCode, EmpName, eMail, MobileNo
              FROM EmpMaster
              WHERE EmpCode =  '${empcd}'`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });

});

router.get('/workers/:date/:station',function(req,res,next){
  var date = req.params.date;
  var port = req.params.station;
  console.log('/flight_plan',req.params);
  var date1 = getDate(date,0);
  var date2 = getDate(date,1);
  //var date2 = getDate(date,1);
  var query = `DECLARE @Station NVARCHAR(3) SET @Station = '${port}';
    DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
    DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
    DECLARE @UTCValue TINYINT SET @UTCValue = 9
    DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
    DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
    SELECT p.FlightPlanID, ACNumber, FlightNumber, e.EmpCode, OperationType, ResponsibilityType, em.EmpName
    FROM FlightPlan p, FlightPlotEmployee e, EmpMaster em
    WHERE
    ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    AND ( RouteFrom = @Station OR RouteTo = @Station )
    AND p.FlightPlanID = e.FlightPlanID
    AND e.EmpCode = em.EmpCode
    AND e.Used = 'Y'
    ORDER BY FlightKey ASC`
  if(port == 'ALL'){
    query = `DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
      DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
      DECLARE @UTCValue TINYINT SET @UTCValue = 9
      DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
      DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
      SELECT p.FlightPlanID, ACNumber, FlightNumber, e.EmpCode, OperationType, ResponsibilityType, em.EmpName
      FROM FlightPlan p, FlightPlotEmployee e, EmpMaster em
      WHERE
      ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
      AND p.FlightPlanID = e.FlightPlanID
      AND e.EmpCode = em.EmpCode
      AND e.Used = 'Y'
      ORDER BY FlightKey ASC`
  }
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['recordset'] = recordset;
     res.send(result);
  });
});

router.post('/save',function(req,res,next){
  //request.accepts('application/json');
  console.log("save workers");
  let worker_data = req.body;
  console.log(worker_data);
  // 각 값을 읽어서 필요한 쿼리 생성 & 실행
  let query = "";
  for(let i in worker_data.WorkerList){
    if(worker_data.WorkerList[i][0]!=""){
      query +=
      `MERGE FlightPlotEmployee AS T
      USING ( SELECT 1 AS FlightPlotEmployeeID, ${worker_data.FlightPlanID} AS FlightPlanID,
        '${worker_data.WorkerList[i][1]}' AS OperationType, '${worker_data.WorkerList[i][2]}' AS ResponsibilityType) S
      ON T.FlightPlanID = S.FlightPlanID AND T.OperationType = S.OperationType
      AND T.ResponsibilityType = S.ResponsibilityType	AND T.Used = 'Y'
      WHEN MATCHED THEN
        UPDATE SET EmpCode = ${worker_data.WorkerList[i][0]}, UpdateID = '${util.getUserId(req.session)}', UpdateDate = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT( FlightPlanID, EmpCode, OperationType, ResponsibilityType, Used, InsertID, InsertDate)
        VALUES ( ${worker_data.FlightPlanID}, '${worker_data.WorkerList[i][0]}',
        '${worker_data.WorkerList[i][1]}', '${worker_data.WorkerList[i][2]}', 'Y', '${util.getUserId(req.session)}', GETDATE())
      OUTPUT INSERTED.FlightPlotEmployeeID AS FlightPlotEmployeeID;\n`
    }else{
      query +=
      `UPDATE FlightPlotEmployee SET Used = 'N', UpdateID = '${util.getUserId(req.session)}', UpdateDate = GETDATE()
      WHERE FlightPlanID =  ${worker_data.FlightPlanID}
      AND OperationType = '${worker_data.WorkerList[i][1]}' and ResponsibilityType = '${worker_data.WorkerList[i][2]}';\n`
    }
  }
  console.log(query);
  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
});

module.exports = router;
