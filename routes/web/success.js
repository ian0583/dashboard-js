var express = require('express')
var session = require('express-session')
var router = express.Router()
var moment = require('moment')
const config = require('../../config')
const messages = require('../../messages')

/* GET home page. */
router.get('/', function (req, res, next) {

	res.render('success', {
		title: config.app.title,
		email: !!req.query.email ? req.query.email : ''
	})

})

router.post('/', function (req, res, next) {

	const data = req.body
	var userdb = config.models.users
	var billingdb = config.models.billings
	var subdate = moment([])

	let billingdata = {
		user: new config.mongoose.mongo.ObjectId(data.custom),
		date: subdate,
		amount: data.amount,
		unit: data.currency
	}

	billingdb.create(billingdata, (err, bill) => {
		if (err) {
			console.log(err)
		}
	})

	let userupdate = {
		ref: {
			subsId: data.paymentID,
			payerId: data.payerID
		},
		status: 1,
		next: subdate.add(data.quantity, 'M').format('DD-MM-YYYY HH:mm:ss')
	}
	userdb.findByIdAndUpdate(data.custom, { $set: { payment: userupdate } }, (err, user) => {
		if (err) {
			// curl paypal to cancel
		}
		var nodemailer = config.nodemailer
		var transporter = config.transporter
		transporter.sendMail({
			from: 'support@bulletproofdev.com',
			to: user.email,
			subject: messages.email.subscription.subject,
			text: messages.email.subscription.plain.replace('||Name||', user.username),
			html: messages.email.subscription.html.replace('||Name||', user.username)
		}, (error, info) => {
			if (error) {
			}
		})
	})

	var single = data.amount / data.quantity
	var substype = ((single) - 20) / 5
	let subs = {
		type : substype,
		dashboard : substype + 5,
		datasource : (substype * 5) + 25
	}

	userdb.findByIdAndUpdate(data.custom, { $set: { sub: subs } }, (err, user) => {
		if (err) {
			// curl paypal to cancel
		}
	})
	res.send(data)
	// res.render('success', {
	// 	title: config.app.title,
	// })

})

module.exports = router
