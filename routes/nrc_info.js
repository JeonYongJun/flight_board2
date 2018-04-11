var express = require('express');
var router = express.Router();
var connection = require('./db/connection');

/*
  Check user when login
  GET user Info.
*/
router.get('/', function(req, res, next) {
  console.log('/nrc_info',req.params);
  var query = `SELECT d.ACNumberID, d.ACNumber, b.DeferType, b.DefCategory, b.DeferReason, b.ATAChapterCode, b.DueDate
    ,CASE WHEN ISNULL(b.LogNumber, '') = ''
         THEN CAST(c.NRCID AS NVARCHAR(20) )
         ELSE b.LogNumber + '-' + b.LogItemNumber
    END AS TaskNumber,
    e.WorkOrderID, e.OrderDate, e.Company, e.Shift, e.Station, f.WIPcode,
    CASE WHEN b.DeferType = 'MEL'
         THEN 1 WHEN b.DeferType = 'CDL'
         THEN 2 WHEN b.DeferType = 'NEF'
         THEN 3
         ELSE 4
    END AS DeferTypeRanking

FROM ToBeMaster a JOIN ToBeNRC b
ON a.ToBeMasterID = b.ToBeMasterID
JOIN NonRoutineCreate c
ON CAST(c.NRCID AS NVARCHAR(20) ) = a.TaskCardNumber
JOIN ACNumber d
ON a.ACNumberID = d.ACNumberID
LEFT OUTER JOIN WorkOrder e
ON a.ToBeMasterID = e.ToBeMasterID
LEFT OUTER JOIN ( SELECT S.Action, S.WorkOrderID, S.ActionTotalMH, S.WIPcode, S.WorkInProcessID, S.LogNumber, S.LogItemNumber
             FROM WorkInProcess S JOIN ( SELECT MAX(WorkInProcessID) AS WorkInProcessID, WorkOrderID
                                         FROM WorkInProcess 
                                         GROUP BY WorkOrderID 
                                       ) T 
             ON S.WorkInProcessID = T.WorkInProcessID
                AND S.WorkOrderID = T.WorkOrderID
           ) f
ON e.WorkOrderID = f.WorkOrderID
WHERE a.Used = 'Y'
 AND a.Complete = 'N'
 --AND a.ToBeStatus = 'N'
 AND b.DeferType IN ( 'MEL', 'CDL', 'NEF' )
 AND d.Used = 'Y'
ORDER BY d.ACNumberID ASC, DeferTypeRanking ASC, b.OriginOrderDate ASC
`;
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
