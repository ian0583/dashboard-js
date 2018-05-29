var express = require('express')
var router = express.Router()
const config = require('../../config')

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('/home')
})

router.get('/widgets', function (req, res, next) {
    const widgets = config.models.widgets
    widgets.find({}, (err, data) => {
        res.send(data)
    })
})

router.get('/dashboards', function (req, res, next) {
    const dashboards = config.models.dashboards
    dashboards.find({}, (err, data) => {
        res.send(data)
    })
})

module.exports = router
