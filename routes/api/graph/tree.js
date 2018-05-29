var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')

router.get('/:point', async (req, res, next) => {
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

                var reply = {}
                var forProcessing = []
                for (var i in collections) {
                    collections[i] = collections[i].name

                    // get all distinct points in collection
                    apimongo.setModel(collections[i])
                    var points = await apimongo.model.findOne({ point: point }).sort({ ts: -1 })

                    if (!!points) {
                        var temp = collections[i].split('_')
                        temp.pop()
                        forProcessing.push({ name: temp, value: isNaN(points.value) ? points.value : points.valueNum })
                    }
                }

                // convert for processing to object
                var treeObj = {}
                for (var i in forProcessing) {
                    var temp = forProcessing[i].name

                    var command = "treeObj"
                    var defineCommands = []
                    var key = ""
                    for (depth in temp) {

                        command += "['" + temp[depth] + "']"
                        key += "['" + temp[depth] + "']"
                        defineCommands.push("treeObj" + key + "=" + "treeObj" + key + " || {}")
                    }
                    for (var j in defineCommands) {
                        eval(defineCommands[j])
                    }
                    command += "="
                    if (typeof (forProcessing[i].value) == 'string') {
                        command += "'" + forProcessing[i].value + "'"
                    }
                    else {
                        command += forProcessing[i].value
                    }
                    eval(command)
                }

                function tempFunc(obj) {
                    var keys = Object.keys(obj)

                    var returnValue = []

                    for (var i in keys) {
                        if (typeof (obj[keys[i]]) == 'object') {
                            returnValue.push({ name: keys[i], children: tempFunc(obj[keys[i]]) })
                        }
                        else {
                            returnValue.push({ name: keys[i], value: obj[keys[i]] })
                        }
                    }
                    return returnValue
                }

                treeObj = { name: point, children: tempFunc(treeObj) }
                res.send(treeObj)
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
