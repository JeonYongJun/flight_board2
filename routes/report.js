var express = require('express');
var router = express.Router();

var connection = require('./db/connection');
var util = require('./lib/util');

/* GET report data. */
router.get('/:date/:station', function(req, res, next) {
    var date = req.params.date;
    var port = req.params.station;
    console.log('/report',req.params);
    var date1 = util.getdate(date,0);
    var date2 = util.getdate(date,1);
    //var date2 = getDate(date,1);
    var query = `DECLARE @Station NVARCHAR(3) SET @Station = '${port}';
      DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
      DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
      DECLARE @UTCValue TINYINT SET @UTCValue = 9
      DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
      DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
      SELECT data.*, EmpCode, OperationType, ResponsibilityType,
        (SELECT EmpName FROM EmpMaster WHERE EmpCode = emp.EmpCode) EmpName,
        (SELECT Remarks FROM FlightPlot WHERE FlightPlanID = data.FlightPlanID AND OperationType = 'C' AND Used = 'Y') Remarks
      FROM
      (SELECT pln.FlightPlanId, pln.FlightNumber,pln.ACNumber,
          sch.StandardTimeDeparture, sch.RampOut, sch.StandardTimeArrival, sch.RampIn,
          pln.RouteFrom, pln.RouteTo
      FROM FlightPlan AS pln, FlightSchedule AS sch
      WHERE  pln.FlightKey = sch.FlightKey
          AND ( pln.StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR pln.StandardTimeArrival BETWEEN @FromDate AND @ToDate)
          AND ( pln.RouteFrom = @Station OR pln.RouteTo = @Station ) AND pln.USED = 'Y') as data
      LEFT OUTER JOIN FlightPlotEmployee AS emp
      ON data.FlightPlanID = emp.FlightPlanId AND emp.Used = 'Y'`;

    //   `SELECT data.EmpName,data.EmpCode,data.OperationType,data.ResponsibilityType,data.FlightNumber,data.ACNumber,
	//   data.StandardTimeDeparture,data.RampOut,data.StandardTimeArrival,data.RampIn,data.RouteFrom,data.RouteTo,msg.Remarks
    //   FROM
    //     (SELECT emp.EmpName, data.*
    //         FROM EmpMaster AS emp,
    //         (SELECT pln.FlightPlanId, EmpCode, OperationType, ResponsibilityType, pln.FlightNumber, pln.ACNumber,
    //             sch.StandardTimeDeparture, sch.RampOut, sch.StandardTimeArrival, sch.RampIn,
    //             pln.RouteFrom, pln.RouteTo
    //             FROM FlightPlotEmployee AS emp, FlightPlan AS pln, FlightSchedule AS sch
    //             WHERE emp.Used = 'Y' AND emp.FlightPlanId = pln.FlightPlanID AND pln.FlightKey = sch.FlightKey
    //                 AND ( pln.StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR pln.StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    //                 AND ( pln.RouteFrom = @Station OR pln.RouteTo = @Station )
    //             ) AS data
    //         WHERE emp.EmpCode = data.EmpCode) AS data
    //     LEFT OUTER JOIN
    //     (SELECT * FROM FlightPlot WHERE Used = 'Y' and OperationType = 'M') AS msg
    //     ON data.FlightPlanID = msg.FlightPlanID`;
    if(port == 'ALL'){
      query = `DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
      DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
      DECLARE @UTCValue TINYINT SET @UTCValue = 9
      DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
      DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
      SELECT data.*, EmpCode, OperationType, ResponsibilityType,
        (SELECT EmpName FROM EmpMaster WHERE EmpCode = emp.EmpCode) EmpName,
        (SELECT Remarks FROM FlightPlot WHERE FlightPlanID = data.FlightPlanID AND OperationType = 'C' AND Used = 'Y') Remarks
      FROM
      (SELECT pln.FlightPlanId, pln.FlightNumber,pln.ACNumber,
          sch.StandardTimeDeparture, sch.RampOut, sch.StandardTimeArrival, sch.RampIn,
          pln.RouteFrom, pln.RouteTo
      FROM FlightPlan AS pln, FlightSchedule AS sch
      WHERE  pln.FlightKey = sch.FlightKey
          AND ( pln.StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR pln.StandardTimeArrival BETWEEN @FromDate AND @ToDate)
          AND pln.USED = 'Y') as data
      LEFT OUTER JOIN FlightPlotEmployee AS emp
      ON data.FlightPlanID = emp.FlightPlanId AND emp.Used = 'Y'`;


    //   `SELECT data.EmpName,data.EmpCode,data.OperationType,data.ResponsibilityType,data.FlightNumber,data.ACNumber,
	//   data.StandardTimeDeparture,data.RampOut,data.StandardTimeArrival,data.RampIn,data.RouteFrom,data.RouteTo,msg.Remarks
    //   FROM
    //     (SELECT emp.EmpName, data.*
    //         FROM EmpMaster AS emp,
    //         (SELECT pln.FlightPlanId, EmpCode, OperationType, ResponsibilityType, pln.FlightNumber, pln.ACNumber,
    //             sch.StandardTimeDeparture, sch.RampOut, sch.StandardTimeArrival, sch.RampIn,
    //             pln.RouteFrom, pln.RouteTo
    //             FROM FlightPlotEmployee AS emp, FlightPlan AS pln, FlightSchedule AS sch
    //             WHERE emp.Used = 'Y' and emp.FlightPlanId = pln.FlightPlanID AND pln.FlightKey = sch.FlightKey
    //                 AND ( pln.StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR pln.StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    //             ) AS data
    //         WHERE emp.EmpCode = data.EmpCode) AS data
    //     LEFT OUTER JOIN
    //     (SELECT * FROM FlightPlot WHERE Used = 'Y' and OperationType = 'M') AS msg
    //     ON data.FlightPlanID = msg.FlightPlanID`;
    }
  
    console.log(query);
  
    connection.runQuery(query, function(err, recordset) {
       // call callback
       var result = {};
       result['result'] = 1;
       result['report'] = recordset;
       res.send(result);
    });
  });

  module.exports = router;