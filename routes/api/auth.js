var express = require('express')
var router = express.Router()
const config = require('../../config')
const auth = require('basic-auth')

router.post('/', async (req, res, next) => {

    var credentials = auth(req)

    if (!!credentials.name && !!credentials.pass) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: credentials.name,
            password: credentials.pass
        }).exec()

        if (users.length > 0) {
            res.send(true)
        }
        else {
            res.send(false)
        }

    } else {
        res.send(false)
    }
})

module.exports = router
