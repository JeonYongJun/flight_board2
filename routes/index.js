var express = require('express');
var passport = require('passport');
var router = express.Router();

var login = require('./login');
login();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'EastarJet Flight Plotting Board!',
    message: req.flash('loginMessage'),
    tab_index: 1
  });
});
router.get('/board', function(req, res, next) {
  console.log('flight_board');
  console.log(req.session);
  if(req.session.passport != undefined || process.env.DB_CONFIG != 'real'){
    var auth = req.session.passport != undefined?req.session.passport.user.auth:'W';
    console.log(auth);
    res.render('flight_board', {
      title: 'EastarJet Flight Plotting Board!',
      message: req.flash('loginMessage'),
      tab_index: 2,
      auth: auth
    });
  }else{
    // login page
    req.flash('loginMessage', '정상적으로 접속해주세요.');
    res.redirect("/");
  }
});
router.get('/help', function(req, res, next) {
  res.render('help', { title: 'EastarJet Flight Plotting Board System!',
  tab_index: 4
  });
});

router.get('/report', function(req, res, next) {
  console.log('flight_board');
  console.log(req.session);
  if(req.session.passport != undefined || process.env.DB_CONFIG != 'real'){
    var auth = req.session.passport != undefined?req.session.passport.user.auth:'W';
    console.log(auth);
    res.render('report', { title: 'EastarJet Flight Plotting Board System!',
    message: req.flash('loginMessage'),
    tab_index: 3,
    auth: auth
  });
  }else{
    // login page
    req.flash('loginMessage', '정상적으로 접속해주세요.');
    res.redirect("/");
  }
});

router.post('/login',passport.authenticate('login',{
    successRedirect:'/board',
    failureRedirect:'/',
    failureFlash: true
  }),(req,res)=>{
    console.log(req);
});

console.log("Index.js ready!")
module.exports = router;
