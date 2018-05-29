var express = require('express')
var router = express.Router()
const config = require('../../config')

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send(null)
})

router.get('/username', function (req, res, next) {
    if (!!req.query.username) {

        var userModel = config.models.users

        userModel.find({ username: req.query.username }).exec((err, result) => {
            if (result.length > 0) {
                res.send(false)
            }
            else {
                res.send(true)
            }
        })

    }
    else {
        res.send(false)
    }
})

router.get('/email', function (req, res, next) {
    if (!!req.query.email) {

        var userModel = config.models.users

        userModel.find({ email: req.query.email }).exec((err, result) => {
            if (result.length > 0) {
                res.send(false)
            }
            else {
                res.send(true)
            }
        })

    }
    else {
        res.send(false)
    }
})

module.exports = router
