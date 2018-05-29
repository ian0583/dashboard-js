var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')

router.get('/:collection', async (req, res, next) => {
    const point = req.params.point
    var credentials = auth(req) || false

    if (!!credentials && !!credentials.name && !!credentials.pass) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: credentials.name,
            // password: credentials.pass
        }).exec()
        if (users.length > 0) {
            var username = credentials.name

            const APIMongo = require('../apimongo')

            const apimongo = new APIMongo(username)

            apimongo.setModel(req.params.collection)
            var points = await apimongo.model.aggregate([
                {
                    $group: {
                        _id: "$point",
                        count: { "$sum": 1 },
                    }
                },
                {
                    $sort: {
                        _id: -1
                    }
                }
            ])
            var radardata = []
            for (var i in points) {
                var result = await apimongo.model.findOne({ point: points[i]._id }).sort({ ts: -1 })
                if (!!result && !!result.value) {
                    radardata.push({
                        value: result.value,
                        point: result.point,

                    })
                }
            }
            res.send(radardata)
        }
        else {
            res.status(401)
            res.send(false)
        }
    }
    else {
        res.send(false)
    }
})

module.exports = router
