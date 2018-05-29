var express = require('express')
var router = express.Router()
const config = require('../../config')

router.get('/', async function (req, res, next) {

    res.redirect('/')

})

router.get('/:id', async function (req, res, next) {

    var id = req.params.id

    var userModel = config.models.users

    // verify hash and update status as necessary
    userModel.find({ _id: id, status: 1 }).exec((err, result) => {
        userModel.findByIdAndUpdate(id, { $set: { status: 2 } }, (err, result2) => {
        })
    })

    res.render('verify', {
        title: config.app.title
    })

})

module.exports = router
