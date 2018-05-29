var express = require('express')
var router = express.Router()
var request = require('request-promise')
const config = require('../../config')

const users = config.models.users
const dashboards = config.models.dashboards

// new dashboard
router.get('/', async function (req, res) {
	// auth
	if (!req.session.userid) {
		res.redirect('/login')
	}
	else {

		let user = {}
		users.findById(req.session.userid, async (err, result) => {
			user = result
			dashboards.find({ user: user._id }, async (err, dashboard) => {
				var options = {
					method: 'GET',
					uri: config.api.data + 'points',
					auth: {
						user: req.session.username,
						pass: req.session.password
					},
					json: true
				}

				var points = await request(options)
				var minBasedOnPoints = parseInt((points.length - 25) / 5) > -4 && parseInt((points.length - 25) / 5) < 0 ? 0 : parseInt((points.length - 25) / 5)
				var minBasedOnDashboards = (dashboard.length - 5) > -4 && (dashboard.length - 5) < 0 ? 0 : dashboard.length - 5

				var minVal = minBasedOnDashboards > minBasedOnPoints ? minBasedOnDashboards : minBasedOnPoints
				var loop = minVal + 1

				if (minVal < 0) loop = 0

				var options = []
				for (var i = (minVal < 0 ? 0 : minVal); i < loop + 6; i++) {
					if (minVal == user.sub.type) {
						minVal = minVal < 0 ? 0 : minVal + 1
						i--
						continue
					}
					options.push({
						amount: minVal < 0 ? 0 : 20 + (minVal * 5),
						value: minVal,
						text: (minVal < 0 ? 'Free' : 'Paid') + (minVal > 0 ? ' +' + minVal : '')
					})
					minVal = minVal < 0 ? 0 : minVal + 1
				}
				res.render('account', {
					title: config.app.title,
					user: user,
					errMsg: false,
					options: options
				})
			})
		})
	}
})

router.post('/', function (req, res) {
	// auth
	if (!req.session.userid) {
		res.redirect('/login')
	}
	else {
		var data = req.body
		delete data.oldpassword
		delete data.password2


		let user = {}
		users.findById(req.session.userid, async (err, result) => {
			user = result
			dashboards.find({ user: user._id }, async (err, dashboard) => {
				var options = {
					method: 'GET',
					uri: config.api.data + 'points',
					auth: {
						user: req.session.username,
						pass: req.session.password
					},
					json: true
				}

				var points = await request(options)

				var minBasedOnPoints = parseInt((points.length - 25) / 5) > -4 && parseInt((points.length - 25) / 5) < 0 ? 0 : parseInt((points.length - 25) / 5)
				var minBasedOnDashboards = (dashboard.length - 5) > -4 && (dashboard.length - 5) < 0 ? 0 : dashboard.length - 5

				var minVal = minBasedOnDashboards > minBasedOnPoints ? minBasedOnDashboards : minBasedOnPoints
				var loop = minVal + 1

				if (minVal < 0) loop = 0

				var options = []
				for (var i = (minVal < 0 ? 0 : minVal); i < loop + 6; i++) {
					if (minVal == user.sub.type) {
						minVal = minVal < 0 ? 0 : minVal + 1
						i--
						continue
					}
					options.push({
						amount: minVal < 0 ? 0 : 20 + (minVal * 5),
						value: minVal,
						text: (minVal < 0 ? 'Free' : 'Paid') + (minVal > 0 ? ' +' + minVal : '')
					})
					minVal = minVal < 0 ? 0 : minVal + 1
				}

				if (user.password == data.password) {
					users.findByIdAndUpdate(req.session.userid, { $set: data }, (err, result) => {
						if (err) {
						}
						res.render('account', {
							title: config.app.title,
							user: result,
							errMsg: false,
							options: options
						})
					})
				}
				else {
					res.render('account', {
						title: config.app.title,
						user: result,
						errMsg : 'Old password is invalid',
						options: options
					})

				}
			})
		})
	}
})

module.exports = router
