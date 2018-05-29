var express = require('express')
var router = express.Router()
const config = require('../../config')

/* GET home page. */
router.get('/', function (req, res, next) {
        
    res.render('docs', {
        title: config.app.title,
        api: config.api.data,
        graph: config.api.graph,
        echartDocOptions: "https://ecomfe.github.io/echarts-doc/public/en/option.html#title"
    })
})

module.exports = router
