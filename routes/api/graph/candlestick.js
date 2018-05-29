var express = require('express')
var router = express.Router()
const config = require('../../../config')
const auth = require('basic-auth')

function formatBoxplot(data) {
    var boxplot = {
        axis: [],
        data: []
    }
    for (var i = 0; i < data.length; i++) {
        boxplot.axis.push(data[i]._id)
        boxplot.data.push([data[i].open, data[i].close, data[i].low, data[i].high])
        // boxplot.data.push([data[i].low, data[i].open, data[i].avg, data[i].close, data[i].high])
    }
    return boxplot
}

router.get('/:device/:point', async (req, res, next) => {
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
                        },
                        {
                            $limit: 24
                        }
                    ])
                    res.send(formatBoxplot(points))

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
                        },
                        {
                            $limit: 7
                        }
                    ])
                    res.send(formatBoxplot(points))

                    break

                case '':
                    apimongo.find({ point: point }, { sort: { ts: -1 }, limit: 30 }, (result) => {
                        res.send(result)
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

module.exports = router
