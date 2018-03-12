/*
    check username and password on local db
*/
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var login_passport = require('./passport/login')

module.exports = function(){
    // create session
    passport.serializeUser(function(sess,done){
        console.log('serializeUser');
        console.dir(sess);
        //session - 객체 형태로 저장
        done(null,sess);
    });

    passport.deserializeUser(function(sess,done){
        console.log('deserializeUser');
        console.dir(sess);
        //session - 객체 형태의 세션
        done(null,sess);
    });

    passport.use('login',login_passport);

    console.log("login ready!")
}
