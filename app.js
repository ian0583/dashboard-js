var express = require('express')
var session = require('express-session')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

const config = require('./config')

var app = express()
var sess

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// use session
app.use(session({
  secret: 'minalmalnijabornsinyen',
  resave: false,
  saveUninitialized: true
}))

// helmet headers protection
var helmet = require('helmet')
app.use(helmet())
app.disable('x-powered-by')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
if (config.env == 'dev') {
  app.use(logger('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// web routes
app.use('/', require('./routes/web/index'))
app.use('/login', require('./routes/web/login'))
app.use('/home', require('./routes/web/home'))
app.use('/settings', require('./routes/web/settings'))
app.use('/dashboard', require('./routes/web/dashboard'))
app.use('/components', require('./routes/web/components'))
app.use('/register', require('./routes/web/register'))
app.use('/validation', require('./routes/web/validation'))
app.use('/verify', require('./routes/web/verify'))
app.use('/forgotpassword', require('./routes/web/forgotpassword'))
app.use('/subscribe', require('./routes/web/subscribe'))
app.use('/account', require('./routes/web/account'))
app.use('/success', require('./routes/web/success'))
app.use('/cancel', require('./routes/web/cancel'))
app.use('/docs', require('./routes/web/docs'))
app.use('/contact', require('./routes/web/contact'))
app.use('/privacypolicy', require('./routes/web/privacypolicy'))
app.use('/termsofuse', require('./routes/web/termsofuse'))
app.use('/aboutus', require('./routes/web/aboutus'))

// api routes
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/data', require('./routes/api/data'))
app.use('/api/graph/pie', require('./routes/api/graph/pie'))
app.use('/api/graph/radar', require('./routes/api/graph/radar'))
app.use('/api/graph/default', require('./routes/api/graph/default'))
app.use('/api/graph/boxplot', require('./routes/api/graph/boxplot'))
app.use('/api/graph/candlestick', require('./routes/api/graph/candlestick'))
app.use('/api/graph/heatmap', require('./routes/api/graph/heatmap'))
app.use('/api/graph/gauge', require('./routes/api/graph/gauge'))
app.use('/api/graph/tree', require('./routes/api/graph/tree'))
app.use('/api/graph/treemap', require('./routes/api/graph/treemap'))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
