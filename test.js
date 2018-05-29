const config = require('./config')
const APIMongo = require('./routes/api/apimongo')
const moment = require('moment')

var username = 'bpd'

var tsStart = moment('2018-02-01T00:00:00.000Z').subtract('0', 'month').toDate()
var tsEnd = moment(tsStart).subtract('1', 'day').toDate()
var timeUnit = 'minute'
var timeAmount = '15'

function getValue(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

async function insertTestData(device, pointName, min, max) {
    const apimongo = new APIMongo(username)
    apimongo.setModel(device + '_points')

    var ts = moment(tsStart).subtract(timeAmount, timeUnit).toDate()

    while (ts > tsEnd) {
        val = getValue(min, max)
        var data = {
            point: pointName,
            value: val,
            valueNum: val,
            isAlarm: false,
            ts: ts
        }

        var result = await apimongo.model.create(data)
        console.log(result.ts, device, pointName)

        ts = moment(ts).subtract(timeAmount, timeUnit).toDate()
    }

}

// create array map for test data
var mapping = {
    Luzon: {
        Pampanga: {
            SanFernando: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Clark: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        NCR: {
            QuezonCity: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Manila: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Ortigas: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Taguig: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Makati: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        Batangas: {
            Lipa: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            BatangasCity: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        Laguna: {
            StaRosa: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Calamba: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
    },
    Visayas: {
        Iloilo: {
            IloiloCity: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        Negros: {
            Bacolod: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        Cebu: {
            CebuCity: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
            Mandaue: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        }
    },
    Mindanao: {
        Zamboanga: {
            Dipolog: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        },
        Davao: {
            DavaoCity: {
                Site1: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
                Site2: {
                    Room1: 1,
                    Room2: 1,
                    Room3: 1
                },
            },
        }
    }
}
var devices = []

function generateMapping(obj, prefix) {
    if (typeof (obj) == 'object') {
        var keys = Object.keys(obj)
        for (var i in keys) {
            generateMapping(obj[keys[i]], prefix + keys[i] + '_')
        }
    }
    else {
        devices.push(prefix.substr(0, prefix.length - 1))
    }
}
generateMapping(mapping, '')

const EventEmitter = require('events');

class MyEmitter extends EventEmitter { }

const myEmitter = new MyEmitter();
myEmitter.on('event', (device) => {
    insertTestData(device, 'Temp', 18, 26)
    insertTestData(device, 'Humidity', 40, 60)
    insertTestData(device, 'Power', 1000, 5000)
});

devices.forEach(async (device) => {
    myEmitter.emit('event', device);
})

// console.log(mapping)

function tempFunc(obj) {
    console.log(obj)
    var keys = Object.keys(obj)

    var returnValue = []

    var total = 0

    for (var i in keys) {
        if (typeof (obj[keys[i]]) == 'object') {
            var t = tempFunc(obj[keys[i]])
            retObj = t[0]
            tot = t[1]
            returnValue.push({ name: keys[i], children: retObj, value: tot })
            total += tot
        }
        else {
            returnValue.push({ name: keys[i], value: obj[keys[i]] })
            total += parseFloat(obj[keys[i]])
        }
    }
    return [returnValue, total]
}

var val = tempFunc({
    Site1: {
        Room1: 1,
        Room2: 1,
        Room3: 1
    }
})
