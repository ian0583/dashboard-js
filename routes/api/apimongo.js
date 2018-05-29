const mongoose = require('mongoose')

class APIMongo {
    constructor(db) {
        const config = require('../../config')

        this.url = config.db.mongoURL
        db = db || 'hermes';

        this.mongoose = mongoose
        this.mongoose.Promise = require('bluebird')
        this.con = this.mongoose.connect(this.url, {
            useMongoClient: true
        })
        this.changeDb(db)
        this.model = {}
    }

    changeDb(db) {
        this.mongoose = this.con.useDb(db)
    }

    setModel(collection) {
        this.model = this.mongoose.model(collection, mongoose.Schema({
            point: { type: 'String' },
            value: { type: 'String' },
            valueNum: { type: 'Number' },
            isAlarm: { type: 'Boolean' },
            ts: { type: 'Date' }
        }).index({ point: 1, ts: 1 }, { unique: true }))
    }

    find(data, options, callback) {
        options = options || { sort: {}, limit: 30 }
        callback = callback || function () { }
        this.model.find(data, { _id: 0, __v: 0, password: 0 }).sort(options.sort).limit(options.limit).exec((err, data) => {
            if (err) {
                callback(false)
            }
            else {
                callback(data)
            }
        })
    }

    findById(data, callback) {
        callback = callback || function () { }
        this.model.findOne({ _id: data }).exec((err, res) => {
            if (err) {
                callback(false)
            }
            else {
                callback(res)
            }
        })
    }

    create(data, callback) {
        callback = callback || function () { }
        data.valueNum = parseFloat(data.value)
        this.model.create(data, (err, res) => {
            if (err) {
                callback(false)
            }
            else {
                callback(data)
            }
        })
    }

    delete(data, callback) {
        callback = callback || function () { }
        this.model.find(data).remove().exec((err, res) => {
            callback(true)
        })
    }

    getCollections(callback) {
        callback = callback || function () { }
        var m = this.mongoose
        if (!m) {
            callback(false)
        }
        else {
            m.once('open', async function (ref) {
                callback(await m.db.listCollections().toArray())
            })
        }
    }

    aggregate(options, callback) {
        this.model.aggregate(options).exec((err, res) => {
            if (err) {
                return false
                callback(false)
            }
            else {
                return res
                callback(res)
            }
        })
    }
}


module.exports = APIMongo