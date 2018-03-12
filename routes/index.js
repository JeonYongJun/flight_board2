var express = require('express');
var passport = require('passport');
var router = express.Router();

var login = require('./login');
login();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'EastarJet Flight Plotting Board!',
    message: req.flash('loginMessage')
  });
});
router.get('/board', function(req, res, next) {
  console.log('flight_board');
  res.render('flight_board', {
    title: 'EastarJet Flight Plotting Board!',
    message: req.flash('loginMessage')
  });
});
router.get('/help', function(req, res, next) {
  res.render('help', { title: 'EastarJet Flight Plotting Board System!' });
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
