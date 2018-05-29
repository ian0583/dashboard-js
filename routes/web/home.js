var express = require('express')
var router = express.Router()
const config = require('../../config')
const messages = require('../../messages')
const request = require('request-promise')

router.get('/', async function (req, res, next) {
  // auth
  if (!req.session.userid) {
    res.redirect('/login')
  }
  else {

    // get all user dashboards
    var dashboardModel = config.models.dashboards

    var dashboards = await dashboardModel.find({
      user: req.session.userid
    }).exec()

    // get all user data points
    var options = {
      method: 'GET',
      uri: config.api.data + 'points',
      auth: {
        user: req.session.username,
        pass: req.session.password
      },
      json: true,
      timeout: 30000
    }

    var points = await request(options)

    res.render('home', {
      title: config.app.title,
      status: req.session.status,
      dashboards: dashboards,
      points: points
    })
  }
})

router.get('/resend', async function (req, res, next) {
  // auth
  if (!req.session.userid) {
    res.redirect('/login')
  }
  else {

    var userModel = config.models.users

    userModel.findById(req.session.userid, (err, result) => {

      var hostname = req.headers.host; // hostname = 'localhost:8080'
      var verificationLink = 'http://' + hostname + '/verify/' + result._id

      // TODO: add code here to send email to user for verification
      var nodemailer = config.nodemailer
      var transporter = config.transporter
      transporter.sendMail({
        from: 'support@bulletproofdev.com',
        to: result.email,
        subject: 'Verify your Hermes Dashboard account',
        text: messages.email.registration.plain.replace('||URL||', verificationLink),
        html: messages.email.registration.html.replace('||URL||', verificationLink)
      }, (error, info) => {
      })
    })

    res.redirect('/home')
  }
})

module.exports = router
