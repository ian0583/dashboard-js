var express = require('express')
var router = express.Router()
const config = require('../../config')
var request = require('request-promise')

const dashboards = config.models.dashboards
const widgets = config.models.widgets
const users = config.models.users

// new dashboard
router.get('/', async function (req, res, next) {
	// auth
	if (!req.session.userid) {
		res.redirect('/login')
	}
	else {

		var widget, dashboard, datapoints
		await widgets.find({ user: req.session.userid }, (err, data) => {
			widget = data
		})

		await dashboards.find({ user: req.session.userid }, (err, data) => {
			dashboard = data
		})

		var options = {
			method: 'get',
			url: '',
			auth: {
				user: req.session.username,
				pass: req.session.password,
			},
			json: true,
			headers: {
				"Content-Type": "application/json"
			},
			uri: config.api.data + 'points'
		}
		var datapoints = await request.get(options)

		res.render('settings', {
			title: config.app.title,
			dashboard: dashboard,
			widgets: widget,
			user: req.session.userid,
			datapoints: datapoints,
			api: config.api.data
		})
	}
})

// load existing dashboard
router.get('/:id', function (req, res, next) {
	// auth
	if (!req.session.userid) {
		res.redirect('/login')
	}
	var dashboardId = req.params.id

	// test dashboard data
	var dashboard = {
		c1: ['Widget1', 'Widget3', 'Widget5'],
		c2: ['Widget2', 'Widget4', 'Widget6'],
		c3: ['Widget9', 'Widget8', 'Widget7']
	}

	res.render('settings', {
		title: config.app.title,
		dashboard: JSON.stringify(dashboard)
	})
})

router.post('/dashboard', function (req, res, next) {
	var data = req.body
	dashboards.find({ user: data.user }, (err, dashboard) => {
		if (err) {

		}
		users.findById(data.user, (e, user) => {
			if (e) {

			}
			if (dashboard.length == user.sub.dashboard) {
				res.send({ errMsg: 'Dashboard limit has been reached' })
			} else {
				data.user = new config.mongoose.mongo.ObjectId(data.user)

				dashboards.create(data, (err, obj) => {
					res.send(obj)
				})
			}
		})
	})
})

router.put('/dashboard', function (req, res, next) {
	var data = req.body

	var savedata = {
		name: data.name,
		user: new config.mongoose.mongo.ObjectId(data.user)
	}
	dashboards.findByIdAndUpdate(data._id, { $set: savedata }, (err, widget) => {
		res.send(widget)
	})
})

router.delete('/dashboard/:id', function (req, res, next) {
	var data = req.params.id

	dashboards.findByIdAndRemove(data, (err, widget) => {
		res.send(widget)
	})
})

router.delete('/widget/:id', function (req, res, next) {
	var data = req.params.id

	widgets.findByIdAndRemove(data, (err, widget) => {
		if (err) {
			console.log(err)
		}
		res.send(widget)
	})
})

router.post('/widget', function (req, res, next) {
	var data = req.body
	data.user = new config.mongoose.mongo.ObjectId(data.user)
	delete data._id

	widgets.create(data, (err, obj) => {
		res.send(obj)
	})
})

router.put('/widget', function (req, res, next) {
	var data = req.body

	data.user = new config.mongoose.mongo.ObjectId(data.user)

	var uid = data._id
	delete data._id

	widgets.findByIdAndUpdate(uid, { $set: data }, (err, widget) => {
		res.send(widget)
	})
})

router.post('/', function (req, res, next) {
	var data = req.body
	data.user = new config.mongoose.mongo.ObjectId(data.user)
	var containers = data.containers
	for (var i = 0; i < containers.length; i++) {
		for (var j = 0; j < containers[i].length; j++) {
			containers[i][j] = new config.mongoose.mongo.ObjectId(containers[i][j])
		}
	}
	if (!!data._id) {
		dashboards.findByIdAndUpdate(data._id, { $set: { containers: containers } }, (err, dashboard) => {
			res.send(dashboard)
		})
	} else {
		data.name = 'New Dashboard'
		dashboards.create(data, (err, obj) => {
			res.send(obj)
		})
	}
})

module.exports = router
