var config = {
    env: 'production',
    app: {
        title: 'Dashboard'
    },
    db: {
		// mongoURL: 'mongodb://localhost:27017/hermes'
		mongoURL: "mongodb://admin:NeM2qAUD@cluster0-shard-00-00-nycf9.mongodb.net:27017,cluster0-shard-00-01-nycf9.mongodb.net:27017,cluster0-shard-00-02-nycf9.mongodb.net:27017/hermes?authSource=admin&replicaSet=Cluster0-shard-0&ssl=true"
    },
    api: {
        data: "https://dashboard.bulletproofdev.com/api/data/",
        graph: "https://dashboard.bulletproofdev.com/api/graph/",
    }
}

var mongoose = require('mongoose')
var nodemailer = require('nodemailer')
var Schema = mongoose.Schema
var mongoDB = config.db.mongoURL


// mongo
mongoose.connect(mongoDB, {
	useMongoClient: true
})

mongoose.Promise = global.Promise

var db = mongoose.connection

var Schema = mongoose.Schema

db.on('error', console.error.bind(console, 'MongoDB connection error:'))

var schemas = {
	users: {
		email: { type: 'String' },
		username: { type: 'String' },
		password: { type: 'String' },
		status: { type: 'Number' },
		sub: {
			type: { type: 'Number' },
			dashboard: { type: 'Number' },
			widget: { type: 'Number' },
			datasource: { type: 'Number' },
		},
		payment: {
			ref: {
				subsId: { type: 'String' },
				payerId: { type: 'String' }
			},
			status: { type: 'Number' },
			next: { type: 'String' }
		},
		points: []
	},
	datapoints: {
		decription: { type: 'String' },
		dataURL: { type: 'String' },
		lock: {
			key: { type: 'String' }
		}
	},
	widgets: {
		name: { type: 'String' },
		type: { type: 'String' },
		user: { type: 'ObjectId' },
		description: { type: 'String' },
		options: { type: 'String' },
		series: [{
			type: { type: 'String' },
			label: { type: 'String' },
			options: { type: 'String' },
			datasources: [{ type: 'String' }]
		}]
	},
	dashboards: {
		name: { type: 'String' },
		user: { type: 'ObjectId' },
		containers: [
			[{ type: 'ObjectId' }] // mongoID string
		]
	},
	billings: {
		user: { type: 'ObjectId' },
		date: { type: 'String' },
		amount: { type: 'Number' },
		unit: { type: 'String' }
	}
}

var models = {
	users: mongoose.model('user', schemas.users),
	datapoints: mongoose.model('datapoint', schemas.datapoints),
	widgets: mongoose.model('widget', schemas.widgets),
	dashboards: mongoose.model('dashboard', schemas.dashboards),
	billings: mongoose.model('billing', schemas.billings)
}

// nodemailer
let transporter = nodemailer.createTransport({
	host: 'email-smtp.us-east-1.amazonaws.com',
	port: 587,
	secure: false,
	auth: {
		user: 'AKIAIBYZ46LAA55W7JNQ',
		pass: 'Ak+TMAK5YcXY81n8Ky3M81ZiwLZzTM2TJgCG1LJS9UUH'
	}
})

const packages = {
	free: { type: -4, dashboard: 1, widget: 5, datasource: 5 },
	paid: { type: 0, dashboard: 5, widget: 25, datasource: 25 },
	additive: { type: 1, dashboard: 1, widget: 5, datasource: 5 }
}

config.schemas = schemas
config.models = models
config.mongoose = mongoose
config.nodemailer = nodemailer
config.transporter = transporter
config.packages = packages

process.env.NODE_ENV = config.env;

module.exports = config
