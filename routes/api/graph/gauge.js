var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')

router.get('/:device/:point', async (req, res, next) => {
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

			// require APIMongo
			const APIMongo = require('../apimongo')
			const moment = require('moment')

			const apimongo = new APIMongo(username)
			apimongo.setModel(device + '_points')
			apimongo.find({ point: point }, { sort: { ts: -1 }, limit: 1 }, (result) => {
				res.send(result[0])
			})
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
