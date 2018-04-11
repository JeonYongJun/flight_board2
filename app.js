var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var fs = require('fs');

var app = express();
// production
app.settings.env = 'production';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('short'));
// app.use(logger('dev'));
// app.use(logger({
//   format: 'short',
//   stream: fs.createWriteStream(path.join(__dirname,'logs','app.log'), {'flags': 'w'})
// }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// session
app.use(session({
  secret:'%%flight_board$$',
  resave:true,
  saveUninitialized:true
}));
//passport
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


var index = require('./routes/index');
var user_info = require('./routes/user_info');
var flight_board = require('./routes/flight_board');
var job_workers = require('./routes/job_workers');
var job_descs = require('./routes/job_descriptions');
var detail_info = require('./routes/other_info');
var job_depts = require('./routes/job_depts');
var code_info = require('./routes/code_info');
var geneva = require('./routes/geneva');
var report = require('./routes/report');
var nrc_info = require('./routes/nrc_info');
//var static = require('./routes/static');

app.use('/', index);
app.use('/user', user_info);
app.use('/flight_board', flight_board);
app.use('/job_workers', job_workers);
app.use('/job_descs', job_descs);
app.use('/info',detail_info);
app.use('/depts',job_depts);
app.use('/code',code_info);
app.use('/geneva',geneva);
app.use('/flight_report',report);
app.use('/nrc_info',nrc_info);
//app.use('/static',static);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log('app ready!');
module.exports = app;
