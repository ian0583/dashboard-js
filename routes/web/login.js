var express = require('express')
var session = require('express-session')
var router = express.Router()
var request = require('request')
const config = require('../../config')


/* GET home page. */
router.get('/', function (req, res, next) {
  //destroy session
  req.session.destroy((err) => {
    //
  })
  res.render('login', {
    title: config.app.title,
    errMsg: false
  })
})

router.post('/', async (req, res, next) => {

  var model = config.models.users
  model.findOne({
    username: req.body.username,
    password: req.body.password,
    status: {
      $gte: 1
    }
  }).exec((err, data) => {
    if (!!data) {
      req.session.userid = data._id
      req.session.status = data.status
      req.session.username = data.username
      req.session.password = data.password
      res.redirect('/home')
    }
    else {
      res.render('login', {
        title: config.app.title,
        errMsg: 'Invalid username or password.'
      })
    }
  })

})

module.exports = router
