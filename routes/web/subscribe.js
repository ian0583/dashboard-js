var express = require('express')
var router = express.Router()
const config = require('../../config')

const users = config.models.users

/* GET home page. */
router.get('/', function (req, res, next) {
	// auth
	if (!req.session.userid) {
		res.redirect('/login')
	}
	else {
		let user = {}
		users.findById(req.session.userid, (err, result) => {
			user = result
			res.render('subscribe', {
				title: config.app.title,
				user: req.session.userid,
				userObj: user
			})
		})
	}
})

module.exports = router
