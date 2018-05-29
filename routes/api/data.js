var express = require('express')
var router = express.Router()
const config = require('../../config')
const auth = require('basic-auth')
const request = require('request-promise')

router.get('/points', async (req, res, next) => {
    var credentials = auth(req) || false

    if (!!credentials && !!credentials.name && !!credentials.pass) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: credentials.name,
            // password: credentials.pass
        }).exec()

        if (users.length > 0) {
            var user = users.shift()
            // handle data here
            res.send(user.points)
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

router.get('/pointsOld', async (req, res, next) => {
    var credentials = auth(req) || false

    if (!!credentials && !!credentials.name && !!credentials.pass) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: credentials.name,
            // password: credentials.pass
        }).exec()

        if (users.length > 0) {
            // handle data here
            var username = credentials.name
            var device = req.params.device
            var point = req.params.point

            // require APIMongo
            const APIMongo = require('./apimongo')

            const apimongo = new APIMongo(username)
            var collCount = 0
            var currentColl = 0
            apimongo.getCollections(async (collections) => {
                if (collections.length < 1) {
                    res.send([])
                }
                collCount = collections.length
                var reply = []
                for (var i in collections) {
                    collections[i] = collections[i].name

                    // get all distinct points in collection
                    apimongo.setModel(collections[i])
                    apimongo.model.aggregate([
                        {
                            $group: {
                                _id: "$point",
                                count: { "$sum": 1 },
                            }
                        },
                        {
                            $project: {
                                coll: { "$literal": collections[i] },
                                _id: 1,
                                count: 1
                            }
                        },
                        {
                            $sort: {
                                point: 1
                            }
                        }
                    ]).exec((err, points) => {
                        currentColl++
                        for (var j in points) {
                            reply.push({
                                point: points[j].coll.replace('_points', '') + '/' + points[j]._id,
                                count: points[j].count
                            })
                        }
                        if (currentColl == collCount) {
                            res.send(reply)
                        }
                    })

                }
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

router.get('/:device/:point', async (req, res, next) => {
    var credentials = auth(req)

    if (!!credentials.name && !!credentials.pass) {
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
            const APIMongo = require('./apimongo')
            const moment = require('moment')

            const apimongo = new APIMongo(username)
            apimongo.setModel(device + '_points')
            req.query.type = req.query.type || ''
            req.query.days = parseInt(req.query.days) || null

            if (req.query.days !== null) {
                var tslimit = moment().subtract(req.query.days, 'day').toDate()
                var match = {
                    $match: {
                        point: point,
                        ts: { "$gte": tslimit }
                    }
                }
            }
            else {
                var match = {
                    $match: {
                        point: point
                    }
                }
            }

            switch (req.query.type) {
                case 'minutely':
                    var points = await apimongo.model.aggregate([
                        match,
                        {
                            $sort: {
                                ts: -1
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d %H:%M:00",
                                        "date": {
                                            "$add": "$ts"
                                        }
                                    }
                                },
                                count: { "$sum": 1 },
                                "avg": { "$avg": "$valueNum" },
                                "high": { "$max": "$valueNum" },
                                "low": { "$min": "$valueNum" },
                                "open": { "$first": "$valueNum" },
                                "close": { "$last": "$valueNum" },

                            }
                        }
                    ])
                    res.send(points)

                    break

                case 'hourly':
                    var points = await apimongo.model.aggregate([
                        match,
                        {
                            $sort: {
                                ts: -1
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d %H:00:00",
                                        "date": {
                                            "$add": "$ts"
                                        }
                                    }
                                },
                                count: { "$sum": 1 },
                                "avg": { "$avg": "$valueNum" },
                                "high": { "$max": "$valueNum" },
                                "low": { "$min": "$valueNum" },
                                "open": { "$first": "$valueNum" },
                                "close": { "$last": "$valueNum" },

                            }
                        }
                    ])
                    res.send(points)

                    break

                case 'daily':
                    var points = await apimongo.model.aggregate([
                        match,
                        {
                            $sort: {
                                ts: -1
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d 00:00:00",
                                        "date": {
                                            "$add": "$ts"
                                        }
                                    }
                                },
                                count: { "$sum": 1 },
                                "avg": { "$avg": "$valueNum" },
                                "high": { "$max": "$valueNum" },
                                "low": { "$min": "$valueNum" },
                                "open": { "$first": "$valueNum" },
                                "close": { "$last": "$valueNum" },

                            }
                        }
                    ])
                    res.send(points)

                    break

                case '':
                    apimongo.find({ point: point }, { sort: { ts: -1 }, limit: 30 }, (result) => {
                        res.send(result)
                        /*
                        if (req.query.detailed && req.query.detailed == 1) {
                            res.send(result)
                        }
                        else {
                            // parse result to return only values
                            for (var i in result) {
                                result[i] = result[i].value
                            }
                            res.send(result)
                        }
                        */
                    })
                    break
            }
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

router.post('/:device/:point', async (req, res, next) => {

    var credentials = auth(req)

    if (!!credentials.name && !!credentials.pass) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: credentials.name,
            password: credentials.pass
        }).exec()

        if (users.length > 0) {
            // handle data here
            var username = credentials.name
            var device = req.params.device
            var user = users.shift()

            var data = {
                point: req.params.point,
                value: req.body.value,
                isAlarm: req.body.isAlarm,
                ts: new Date()
            }

            // require APIMongo
            const APIMongo = require('./apimongo')
            const apimongo = new APIMongo(username)

            var points = user.points

            apimongo.setModel(device + '_points')

            // check if within limit and point is existing
            var exists = points.indexOf(device + '/' + data.point) != -1 ? true : false
	    /*
            for (var i in points) {
                if (device + '/' + data.point == points[i].point) {
                    exists = true
                }
            }
            */

            if (exists || points.length < (user.sub.type * 5 + 25)) {

                const unique = require('array-unique')
                user.points.push(device + '/' + data.point)
                user.points = unique(user.points)
                user.points.sort()
                await dataModel.update({ _id: user._id }, user)

                apimongo.create(data, (result) => {
                    res.send(result)
                })
            }
            else {
                res.status(402)
                res.send(false)
            }

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

router.delete('/:device/:point', async (req, res, next) => {
    if (!!req.session.userid) {
        var dataModel = config.models.users
        var users = await dataModel.find({
            username: req.session.username,
            password: req.session.password
        }).exec()

        if (users.length > 0) {
            // handle data here
            var username = req.session.username
            var device = req.params.device
            var point = req.params.point

            // require APIMongo
            const APIMongo = require('./apimongo')

            const apimongo = new APIMongo(username)
            apimongo.setModel(device + '_points')

            apimongo.delete({ point: point })
            res.send(true)
        }
        else {
            res.status(401)
            res.send(false)
        }
    }
    else {
        var credentials = auth(req)

        if (!!credentials.name && !!credentials.pass) {
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
                const APIMongo = require('./apimongo')

                const apimongo = new APIMongo(username)
                apimongo.setModel(device + '_points')

                apimongo.delete({ point: point })
                res.send(true)
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
    }
})

module.exports = router



/*

default: device, point => point
    line
    bar
    scatter

pie: point => point per device --> satur
    pie
    funnel

radar: device => points in device --> satur
    radar
    parallel

treemap: point => treemap split device name by _ 
    treemap

tree: same as treemap but no value

boxplot: device, point => point
    boxplot
    candlestick

heatmap: device, point => point
    heatmap
 
gauge: device, point => latest point
    gauge



map: TBD
lines: TBD


*/
