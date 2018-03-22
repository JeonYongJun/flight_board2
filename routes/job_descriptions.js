var express = require('express');
var router = express.Router();

var connection = require('./db/connection');
var util = require('./lib/util');

router.get('/:date/:station',function(req,res,next){
  var date = req.params.date;
  var port = req.params.station;
  console.log('/job_descriptions',req.params);
  var date1 = util.getdate(date,0);
  var date2 = util.getdate(date,1);
  //var date2 = getDate(date,1);
  // DECLARE @FromDate DATETIME SET @FromDate = '${date1} 04:00:00.000';
  // DECLARE @ToDate DATETIME SET @ToDate = '${date2} 04:00:00.000';
  var query = `DECLARE @Station NVARCHAR(3) SET @Station = '${port}';
    DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
    DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
    DECLARE @UTCValue TINYINT SET @UTCValue = 9
    DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
    DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
    SELECT p.FlightPlanID, ACNumber, FlightNumber, OperationType, Remarks
    FROM FlightPlan p, FlightPlot d
    WHERE
    ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    AND ( RouteFrom = @Station OR RouteTo = @Station )
    AND p.FlightPlanID = d.FlightPlanID
    AND d.Used = 'Y'
    ORDER BY FlightKey ASC`
  if(port == 'ALL'){
    query = `DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
      DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
      DECLARE @UTCValue TINYINT SET @UTCValue = 9
      DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
      DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
      SELECT p.FlightPlanID, ACNumber, FlightNumber, OperationType, Remarks
      FROM FlightPlan p, FlightPlot d
      WHERE
      ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
      AND p.FlightPlanID = d.FlightPlanID
      AND d.Used = 'Y'
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
  console.log("save descriptions");
  let desc_data = req.body;
  console.log(desc_data);
  // 각 값을 읽어서 필요한 쿼리 생성 & 실행
  let query = "";
  //if(desc_data.Remarks!="")
  {
    query +=
    `MERGE FlightPlot AS T
    	USING ( SELECT ${desc_data.FlightPlanID} AS FlightPlanID, '${desc_data.OperationType}' AS OperationType) S
    	  ON T.FlightPlanID = S.FlightPlanID AND T.OperationType = S.OperationType
    	WHEN MATCHED THEN
    	  UPDATE SET Remarks = '${desc_data.Remarks}', UpdateID = '${util.getUserId(req.session)}', UpdateDate = GETDATE()
    	WHEN NOT MATCHED THEN
    	  INSERT( FlightPlanID, OperationType, Remarks, Used, InsertID, InsertDate)
    	  VALUES ( ${desc_data.FlightPlanID}, '${desc_data.OperationType}',
        '${desc_data.Remarks}', 'Y', '${util.getUserId(req.session)}', GETDATE())
    OUTPUT INSERTED.FlightPlotID AS FlightPlotID;`

    console.log(query);
    connection.runQuery(query, function(err, recordset) {
       // call callback
       var result = {};
       result['result'] = 1;
       result['data'] = recordset;
       res.send(result);
    });
  // }else{
  //   var result = {};
  //   result['result'] = 0;
  //   result['data'] = 'null description';
  //   res.send(result);
  //
  }
});

router.post('/daily_check',function(req,res,next){
  //request.accepts('application/json');
  console.log("daily check");
  let desc_data = req.body;
  console.log(desc_data);
  // 각 값을 읽어서 필요한 쿼리 생성 & 실행
  let query =  `MERGE FlightPlot AS T
  	USING ( SELECT ${desc_data.FlightPlanID} AS FlightPlanID, '${desc_data.OperationType}' AS OperationType) S
  	  ON T.FlightPlanID = S.FlightPlanID AND T.OperationType = S.OperationType
  	WHEN MATCHED THEN
  	  UPDATE SET Remarks = '${desc_data.Remarks}', Used='${desc_data.Used}', UpdateID = '${util.getUserId(req.session)}', UpdateDate = GETDATE()
  	WHEN NOT MATCHED THEN
  	  INSERT( FlightPlanID, OperationType, Remarks, Used, InsertID, InsertDate)
  	  VALUES ( ${desc_data.FlightPlanID}, '${desc_data.OperationType}',
      '${desc_data.Remarks}', '${desc_data.Used}', '${util.getUserId(req.session)}', GETDATE())
  OUTPUT INSERTED.FlightPlotID AS FlightPlotID;`

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
