var express = require('express')
var session = require('express-session')
var router = express.Router()
var moment = require('moment')
const config = require('../../config')
const messages = require('../../messages')

router.post('/', function (req, res, next) {

	const data = req.body
	var userdb = config.models.users
	var billingdb = config.models.billings
	var subdate = moment([])

	let billingdata = {
		user: new config.mongoose.mongo.ObjectId(data.id),
		date: subdate,
		amount: 0,
		unit: 'USD'
	}

	billingdb.create(billingdata, (err, bill) => {
		if (err) {
			console.log(err)
		}
	})

	let userupdate = {}

	userdb.findByIdAndUpdate(data.id, { $set: { payment: userupdate } }, (err, user) => {
		if (err) {
			// curl paypal to cancel
		}
		var nodemailer = config.nodemailer
		var transporter = config.transporter
		transporter.sendMail({
			from: 'support@bulletproofdev.com',
			to: user.email,
			subject: message.email.unsubscription.subject,
			text: messages.email.unsubscription.plain.replace('||Name||', user.username),
			html: messages.email.unsubscription.html.replace('||Name||', user.username)
		}, (error, info) => {
			if (error) {
			}
		})
	})

	let subs = {
		type : -4,
		dashboard : 1,
		datasource : 5
	}

	userdb.findByIdAndUpdate(data.id, { $set: { sub: subs } }, (err, user) => {
		if (err) {
			// curl paypal to cancel
		}
	})
	res.send(data)

})

module.exports = router
