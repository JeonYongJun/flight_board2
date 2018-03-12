var express = require('express');
var router = express.Router();

var connection = require('./db/connection');

/* GET home page. */
router.get('/',function(req,res,next){
  console.log('/job_depts',req.params);
  var query = `select DeptCode,DeptName, EmpCode,EmpName,eMail,TelNo,MobileNo
  from DeptMaster dept, EmpMaster emp
  where dept.DeptCode = emp.DefaultDeptCode and EmpStatus = 'NORM'`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
})

router.get('/workers/:dept',function(req,res,next){
  var dept = req.params.dept;
  console.log('/job_depts',req.params);
  var query = `SELECT EmpCode, EmpName
              FROM EmpMaster
              WHERE DefaultDeptCode = ${dept}
              ORDER BY EmpName`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
})
module.exports = router;
