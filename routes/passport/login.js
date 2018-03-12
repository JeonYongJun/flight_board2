var LocalStrategy = require('passport-local').Strategy;
var connection = require('../db/connection');
var axios = require('axios');

module.exports = new LocalStrategy({
		usernameField : 'userid',
		passwordField : 'password',
		session: true,
		passReqToCallback: true
	}, function(req, userid, password, done) { 
		console.log('login process : ' + userid + ', ' + password);

		var query = `SELECT EmpCode, EMpName, eMail, MobileNo, FlightPlotAuthority,
		PWDCOMPARE('${password}', Password) as chk
		FROM EmpMaster WHERE EmpCode = '${userid}'`;
		console.log(query);

		connection.runQuery(query, function(err, recordset) {
			if (err) { return done(err); }
			var result = recordset.recordset;
			//console.log(result)
			// user check
			if(result.length <= 0){
				return done(null, false, req.flash('loginMessage', '정비본부 소속이 아닙니다. 관리자에게 문의하시기 바랍니다!')); 
			}

			//**** 정비DB 이용
			// if(result[0].chk !== 1){
			// 	return done(null, false, req.flash('loginMessage', 'Incorrect password!'));
			// }
			// // result
            // var sess = {
			// 	userid: result[0].EmpCode,
			// 	username: result[0].EmpName,
            //     tel: result[0].MobileNo,
            //     email: result[0].eMail,
            //     auth: result[0].FlightPlotAuthority
            // }
			// return done(null, sess); 
			//**** 정비DB 이용

			//**** groupware login 이용
			axios.post('https://gw.eastarjet.com/api/login', {
				username: userid,
				password: password,
				captcha:"",
				returnUrl:""
			  })
			  .then( gwreq => {
				// console.log(gwreq.data);
				var sess = {
					userid: result[0].EmpCode,
					username: result[0].EmpName,
					tel: result[0].MobileNo,
					email: result[0].eMail,
					auth: result[0].FlightPlotAuthority
				}
				return done(null,sess)
			  })
			  .catch(gwreq => {
				// console.log(gwreq.response.data);
				return done(null, false, req.flash('loginMessage', gwreq.response.data.message)); 
			  });
			//**** groupware login 이용
		});
	}
);

