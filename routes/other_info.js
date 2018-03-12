var express = require('express');
var router = express.Router();

var connection = require('./db/connection');

/* GET home page. */
router.get('/flight_info/:hl', function(req, res, next) {
  var hl = req.params.hl;
  console.log('/flight_info',req.params);
  var query = `SELECT b.ACTypeID, b.ACType, b.Remark
	       , a.ACNumberID, a.ACNumber, a.ACModel, a.ACSerialNumber, a.EffectivityIPC, a.EffectivityOtherManual
	       , a.ManufactureDate, a.SELCALCode, a.Engine1Type, a.Engine1SerialNumber, a.Engine2Type, a.Engine2SerialNumber
	       , a.APUType, a.APUSerialNumber
	       , a.SeatCapacity, a.Wheel
	FROM ACNumber a JOIN ACType b
	     ON a.ACTypeID = b.ACTypeID
	WHERE a.Used = 'Y' AND b.Used = 'Y' and ACNumber='{hl}}'`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
});

router.get('/flight_info',function(req,res,next){
  console.log('/flight_info',req.params);
  var query = `SELECT b.ACTypeID, b.ACType, b.Remark
	       , a.ACNumberID, a.ACNumber, a.ACModel, a.ACSerialNumber, a.LineNumber, a.EffectivityIPC, a.EffectivityOtherManual
	       , a.ManufactureDate, a.SELCALCode, a.Engine1Type, a.Engine1SerialNumber, a.Engine2Type, a.Engine2SerialNumber
	       , a.APUType, a.APUSerialNumber
	       , a.SeatCapacity, a.Wheel
	FROM ACNumber a JOIN ACType b
	     ON a.ACTypeID = b.ACTypeID
	WHERE a.Used = 'Y' AND b.Used = 'Y'`;
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
