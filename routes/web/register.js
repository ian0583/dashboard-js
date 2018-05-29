var express = require('express')
var session = require('express-session')
var router = express.Router()
const config = require('../../config')
const messages = require('../../messages')


/* GET home page. */
router.get('/', function (req, res, next) {

	res.render('register', {
		title: config.app.title,
		substype: 'free',
		email: !!req.query.email ? req.query.email : ''
	})

})

/* GET home page. */
router.get('/:substype', function (req, res, next) {

	res.render('register', {
		title: config.app.title,
		substype: req.params.substype,
		email: !!req.query.email ? req.query.email : ''
	})

})

router.post('/', function (req, res, next) {

	var userModel = config.models.users

	var user = req.body
	var subtype = user.type ? user.type : 'free'

	delete user.type
	delete user.password2
	user.status = 1
	user.sub = config.packages[subtype]

	userModel.create(user, (err, result) => {

		var hostname = req.headers.host; // hostname = 'localhost:8080'
		var verificationLink = 'http://' + hostname + '/verify/' + result._id

		var nodemailer = config.nodemailer
		var transporter = config.transporter
		transporter.sendMail({
			from: 'support@bulletproofdev.com',
			to: result.email,
			subject: 'Verify your Hermes Dashboard account',
			text: messages.email.registration.plain.replace('||URL||', verificationLink),
			html: messages.email.registration.html.replace('||URL||', verificationLink)
		}, (error, info) => {
			if (error) {

			}
		})
	})

	res.redirect('/login')
})

module.exports = router
