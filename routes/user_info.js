var express = require('express');
var router = express.Router();
var axios = require('axios');

var connection = require('./db/connection');

/*
  Check user when login
  GET user Info.
*/
router.get('/:userid', function(req, res, next) {
  var userid = req.params.userid;
  console.log('/user',req.params);
  var query = `SELECT EmpCode, EmpName, eMail, MobileNo, FlightPlotAuthority
              FROM EmpMaster
              WHERE EmpCode =  '${userid}'`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
});

router.get('/login/:userid', function(req, res, next) {
  var userid = req.params.userid;
  console.log('/user',req.params);
  var query = `SELECT EmpCode, EMpName, 
  PWDCOMPARE('1234', Password) as chk
  FROM EmpMaster WHERE EmpCode = '${userid}'`;
  console.log(query);

  connection.runQuery(query, function(err, recordset) {
     // call callback
     var result = {};
     result['result'] = 1;
     result['data'] = recordset;
     res.send(result);
  });
});

// group ware login test
router.post('/gwlogin',function(req,res,next){
  console.log(req.body);
  axios.post('https://gw.eastarjet.com/api/login', {
    username: req.body.userid,
    password: req.body.password,
    captcha:"",
    returnUrl:""
  })
  .then( result => {
    console.log(result);
    res.send(result.data);
  })
  .catch( result => {
    console.log(result);
    res.send(result.response.data);
  });
  //res.send("ok");
});

module.exports = router;
