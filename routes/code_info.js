var express = require('express');
var router = express.Router();

var connection = require('./db/connection');

/* GET home page. */
router.get('/station', function(req, res, next) {
  var hl = req.params.hl;
  console.log('/code_info/station',req.params);
  var query = `SELECT CodeCode FROM CodeMaster
  WHERE CodeCodeID = 'Airport' AND CodeDescr3 = 'Y' AND CodeUse = 'Y'
  ORDER BY SortKey`;
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
