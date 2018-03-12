var express = require('express');
var router = express.Router();

var connection = require('./db/connection');

//yyyy-mm-dd 형식 데이터와 날짜 차이값을 받아 해당 날짜 리턴
//예 getDate('2017-11-11',2)
function getDate(dd,delta){
  var moment = require('moment');
  var _date = moment(dd,'YYYY-MM-DD');
  _date.add(delta,'days');
  return _date.format('YYYY-MM-DD');
}

/* GET home page. */
router.get('/plan/:date/:station', function(req, res, next) {
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
    SELECT FlightPlanID, FlightKey, ACNumber,
    dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
    CONVERT( VARCHAR(10), DATEADD(HH, @UTCValue, CONVERT(DATETIME, LogDate) ), 121) AS LogDate,
    FlightNumber, RouteFrom, RouteTo,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeDeparture) ) AS StandardTimeDeparture,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeArrival) ) AS StandardTimeArrival
    FROM FlightPlan
    WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    AND ( RouteFrom = @Station OR RouteTo = @Station )
    ORDER BY FlightKey ASC`;
  if(port == 'ALL'){
    query = `DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
    DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
    DECLARE @UTCValue TINYINT SET @UTCValue = 9
    DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
    DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
    SELECT FlightPlanID, FlightKey, ACNumber,
    dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
    CONVERT( VARCHAR(10), DATEADD(HH, @UTCValue, CONVERT(DATETIME, LogDate) ), 121) AS LogDate,
    FlightNumber, RouteFrom, RouteTo,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeDeparture) ) AS StandardTimeDeparture,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeArrival) ) AS StandardTimeArrival
    FROM FlightPlan
    WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
            ORDER BY FlightKey ASC`;
  }

  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['plan'] = recordset;
     res.send(result);
  });
});

router.get('/schedule/:date/:station', function(req, res, next) {
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
    SELECT FlightScheduleID, FlightKey, ACNumber,
    dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
    CONVERT( VARCHAR(10), DATEADD(HH, @UTCValue, CONVERT(DATETIME, LogDate) ), 121) AS LogDate,
    FlightNumber, RouteFrom, RouteTo,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeDeparture) ) AS StandardTimeDeparture,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeArrival) ) AS StandardTimeArrival,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, RampOut) ) AS RampOut,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, TakeOff) ) AS TakeOff,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, Landing) ) AS Landing,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, RampIn) ) AS RampIn
    FROM FlightSchedule
    WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    AND ( RouteFrom = @Station OR RouteTo = @Station )    ORDER BY FlightKey ASC`
  if(port == 'ALL'){
    query = `DECLARE @SelFromDate DATETIME SET @SelFromDate = '${date1} 04:00:00.000';
    DECLARE @SelToDate DATETIME SET @SelToDate = '${date2} 04:00:00.000';
    DECLARE @UTCValue TINYINT SET @UTCValue = 9
    DECLARE @FromDate DATETIME SET @FromDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelFromDate));
    DECLARE @ToDate DATETIME SET @ToDate = DATEADD(HH,-@UTCValue,CONVERT(DATETIME,@SelToDate));
    SELECT FlightScheduleID, FlightKey, ACNumber,
    dbo.FN_GET_AC_NUMBERID(ACNumber) AS ACNumberID,
    CONVERT( VARCHAR(10), DATEADD(HH, @UTCValue, CONVERT(DATETIME, LogDate) ), 121) AS LogDate,
    FlightNumber, RouteFrom, RouteTo,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeDeparture) ) AS StandardTimeDeparture,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, StandardTimeArrival) ) AS StandardTimeArrival,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, RampOut) ) AS RampOut,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, TakeOff) ) AS TakeOff,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, Landing) ) AS Landing,
    DATEADD(HH, @UTCValue, CONVERT(DATETIME, RampIn) ) AS RampIn
    FROM FlightSchedule
    WHERE ( StandardTimeDeparture BETWEEN @FromDate AND @ToDate OR StandardTimeArrival BETWEEN @FromDate AND @ToDate)
    ORDER BY FlightKey ASC`
  }

  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['schedule'] = recordset;
     res.send(result);
  });
});

module.exports = router;
