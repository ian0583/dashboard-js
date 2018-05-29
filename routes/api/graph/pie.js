var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')

router.get('/:point', async (req, res, next) => {
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
            var piedata = []
            // get all devices
            // require APIMongo
            const APIMongo = require('../apimongo')

            const apimongo = new APIMongo(username)
            apimongo.getCollections(async (collections) => {

                // filter collections
                var filter = typeof (req.query.filter) == 'object' ? req.query.filter : [req.query.filter]
                if (!!filter[0]) {
                    var tempCollections = collections
                    collections = []
                    for (var i in filter) {
                        for (var j in tempCollections) {
                            if (tempCollections[j].name.indexOf(filter[i]) === 0) {
                                collections.push(tempCollections[j])
                            }
                        }
                    }
                }

                for (i in collections) {
                    apimongo.setModel(collections[i].name)

                    var result = await apimongo.model.findOne({ point: point }).sort({ ts: -1 })
                    if (!!result && !!result.value) {
                        piedata.push({
                            value: result.value,
                            name: collections[i].name.replace('_points', '')
                        })
                    }
                }
                res.send(piedata)

            })
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