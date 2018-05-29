var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')
const moment = require('moment')

router.get('/:device/:point/:type', async (req, res, next) => {
	var credentials = auth(req) || false

	if (!!credentials && !!credentials.name && !!credentials.pass) {
		var dataModel = config.models.users
		var users = await dataModel.find({
			username: credentials.name,
			password: credentials.pass
		}).exec()

		if (users.length > 0) {
			// handle data here
			var username = credentials.name
			var device = req.params.device
			var point = req.params.point
			var type = req.params.type

			// require APIMongo
			const APIMongo = require('../apimongo')

			const apimongo = new APIMongo(username)
			apimongo.setModel(device + '_points')
			const end = req.query.end || []

			var tslimit
			var xAxis = {
				type: 'category',
				data: []
			}
			var yAxis = {
				type: 'category',
				data: []
			}

			switch (type) {
				case 'daily':
					tsend = moment(end).toDate()
					tstart = moment(end).subtract(7, 'day').toDate()

					var match = {
						$match: {
							point: point,
							ts: {
								"$gte": tstart,
								"$lte": tsend
							}
						}
					}

					var points = await apimongo.model.aggregate([
						match,
						{
							$sort: {
								ts: -1
							}
						},
						{
							$group: {
								_id: {
									"$dateToString": {
										"format": "%Y-%m-%d %H:00:00",
										"date": {
											"$add": "$ts"
										}
									}
								},
								"val": { "$avg": "$valueNum" },

							}
						}
					])

					for (var h = 0; h < 24; h++) {
						xAxis.data.push((h < 10 ? '0' + h : h) + '00')
					}
					for (var d = 7; d >= 0; d--) {
						yAxis.data.push(moment(end).subtract(d, 'day').format('YYYY-MM-DD'))
					}
					var data = []
					for (var i = 0; i < points.length; i++) {
						var date = moment(points[i]._id)
						var diff = moment(end).diff(date, 'days')
						data.push([xAxis.data.indexOf(date.format('HH00')), yAxis.data.indexOf(date.format('YYYY-MM-DD')), Math.round(points[i].val * 100) / 100])
					}
					var retVar = { x: xAxis, y: yAxis, data: data }
					res.send(retVar)

					break

				case 'monthly':
					tsend = moment(end).toDate()
					tstart = moment(end).subtract(1, 'year').toDate()

					var match = {
						$match: {
							point: point,
							ts: {
								"$gte": tstart,
								"$lte": tsend
							}
						}
					}


					var points = await apimongo.model.aggregate([
						match,
						{
							$sort: {
								ts: -1
							}
						},
						{
							$group: {
								_id: {
									"$dateToString": {
										"format": "%Y-%m-%d %H:00:00",
										"date": {
											"$add": "$ts"
										}
									}
								},
								"val": { "$avg": "$valueNum" },

							}
						}
					])
					for (var d = 1; d <= 31; d++) {
						xAxis.data.push((d < 10 ? '0' + d : '' + d))
					}
					yAxis.data = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

					var data = []
					// yAxis.data = yAxis.data.reverse()
					for (var i = 0; i < points.length; i++) {
						var date = moment(points[i]._id)
						var diff = moment(end).diff(date, 'days')
						data.push([xAxis.data.indexOf(date.format('DD')), yAxis.data.indexOf(date.format('MMM')), Math.round(points[i].val * 100) / 100])
					}
					var retVar = { x: xAxis, y: yAxis, data: data }
					res.send(retVar)

					break

			}
		}
		else {
			res.status(401)
			res.send(false)
		}
	}
	else {
		res.status(401)
		res.send(false)
	}
})

module.exports = router
