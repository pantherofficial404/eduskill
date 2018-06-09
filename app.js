var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose')
var indexRouter = require('./routes/index');
var adminRoutes = require('./routes/adminRoutes')
var bodyparser = require('body-parser')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var flash = require('connect-flash')
var passport = require('passport')
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(session({
  secret: 'Panther Defense',
  resave: false,
  saveUninitialized: true,
  store : new MongoStore({mongooseConnection : mongoose.connection}),
}))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use(function (req,res,next) {
    res.locals.login = req.isAuthenticated();
    if(req.isAuthenticated()){
      if(req.user.email){
        res.locals.user = req.user.email
      }else{
        res.locals.user = req.user.username
      }
    }
    res.locals.session = req.session;
    next();
})

app.use('/web',adminRoutes);
app.use('/', indexRouter);
// Databse Setup

mongoose.connect('mongodb://panther:Pappa@ds151431.mlab.com:51431/student_academy',(err)=>{
  if(err){
    console.log(`Unable to Connect With Database`)
  }else{
    console.log('Connected To The database')
  }
})


require('./config/passport')
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
