var express = require('express')
var router = express.Router()
const config = require('../../config')
const messages = require('../../messages')

router.get('/', async function (req, res, next) {

    res.render('forgotpassword', {
        title: config.app.title,
        id: false
    })

})

router.post('/', async function (req, res, next) {

    var userModel = config.models.users

    userModel.find({ email: req.body.email }, (err, result) => {
        if (result.length > 0) {
            var hostname = req.headers.host; // hostname = 'localhost:8080'
            var link = 'http://' + hostname + '/forgotpassword/' + result[0]._id

            var nodemailer = config.nodemailer
            var transporter = config.transporter
            transporter.sendMail({
                from: 'support@bulletproofdev.com',
                to: result[0].email,
                subject: 'Password change request',
                text: messages.email.forgotpassword.plain.replace('||URL||', link),
                html: messages.email.forgotpassword.html.replace('||URL||', link)
            }, (error, info) => {
            })
        }
    })

    res.redirect('/login')

})

router.get('/:id', async function (req, res, next) {

    var id = req.params.id

    var userModel = config.models.users

    // verify hash and update status as necessary
    var user = await userModel.find({ _id: id, status: { $gte: 1 } }).exec()
    if (user.length > 0) {
        res.render('forgotpassword', {
            title: config.app.title,
            id: user[0]._id
        })
    }
    else {
        res.redirect('/')
    }

})

router.post('/:id', async function (req, res, next) {

    var id = req.params.id

    var userModel = config.models.users

    // verify hash and update status as necessary
    var user = await userModel.find({ _id: id }).exec()
    if (user.length > 0) {
        userModel.findByIdAndUpdate(id, { $set: { password: req.body.password } }, (err, result2) => {
            res.redirect('/login')
        })
    }
    else {
        res.redirect('/')
    }

})



module.exports = router
