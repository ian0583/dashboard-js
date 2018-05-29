var express = require('express')
var router = express.Router()
const config = require('../../config')
const request = require('request-promise')
const moment = require('moment')

var modelDashboards = config.models.dashboards
var modelUsers = config.models.users

function transformData(rawData) {
	var data = []
	var dimensions = rawData.length
	var length = rawData[0].length
	for (var i = 0; i < length; i++) {
		var tempRow = []
		for (var j = 0; j < dimensions; j++) {
			tempRow.push(rawData[j][i])
		}
		data.push(tempRow)
	}

	return data
}

function IsJsonString(str) {
	if (!str) {
		return false
	}
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

router.get('/', function (req, res, next) {
	// auth
	// if (!req.session.userid) {
	//     res.redirect('/login')
	// }
	res.render('dashboard', {
		title: config.app.title,
		dashboard: false,
		showMenu: false
	})
})

router.get('/:id', async function (req, res, next) {
	var showMenu = false

	if (!!req.session.userid) {
		showMenu = true
	}

	var dashboardUser = ''
	var dashboardPassword = ''

	async function getDashboard(_id) {
		var dashboard = {
			name: '',
			widgets: []
		}

		var data = await modelDashboards.aggregate([
			{
				$match: {
					_id: new config.mongoose.mongo.ObjectId(_id)
				}
			},
			{
				$unwind: {
					path: "$containers",
					includeArrayIndex: "key"
				}
			},
			{
				$unwind: {
					path: "$containers",
					includeArrayIndex: "key2"
				}
			},
			{
				$lookup:
					{
						from: "widgets",
						localField: "containers",
						foreignField: "_id",
						as: "widgets"
					}
			}]).exec()

		for (var i in data) {
			dashboard.name = data[i].name

			if (!dashboard.widgets[data[i].key]) {
				dashboard.widgets[data[i].key] = []
			}

			// create widgetObj
			var widgetObj = {
				tooltip: {
					trigger: 'item',
					triggerOn: 'mousemove'
				},
				xAxis: {
					type: 'value'
				},
				yAxis: {
					type: 'value'
				},
				series: []
			}
			var textObj = false

			var buffer = {}
			var doNotDelete = false

			for (var j in data[i].widgets[0].series) {
				// send request for all series in data
				var rawData = []
				var seriesObj = {}
				var graphData = null
				for (var k in data[i].widgets[0].series[j].datasources) {
					var options = {
						method: 'get',
						url: '',
						auth: {
							user: dashboardUser,
							pass: dashboardPassword,
						},
						json: true,
						headers: {
							"Content-Type": "application/json"
						},
						timeout: 10000
					}

					options.url = data[i].widgets[0].series[j].datasources[k]

					var seriesData = await request.get(options).catch((err) => { }) || []

					switch (data[i].widgets[0].series[j].type.toLowerCase()) {
						case 'line':
						case 'bar':
						case 'scatter':
							doNotDelete = true
							if (data[i].widgets[0].series[j].datasources.length == 1) {
								widgetObj.xAxis = widgetObj.xAxis || {}
								widgetObj.yAxis = widgetObj.yAxis || { type: 'value' }
								widgetObj.xAxis.type = 'time'
								var tempData = []
								for (var l = 0; l < seriesData.length; l++) {
									if (seriesData[l].hasOwnProperty('ts')) {
										tempData.push(seriesData[l].ts)
									}
									else {
										tempData.push(seriesData[l]._id)
									}
									if (seriesData[l].hasOwnProperty('value')) {
										seriesData[l] = parseFloat(seriesData[l].value)
									}
									else if (seriesData[l].hasOwnProperty('avg')) {
										seriesData[l] = parseFloat(seriesData[l].avg)
									}
								}

								rawData.push(tempData)
								rawData.push(seriesData)
							}
							else {

								// check if seriesData is array of values or array of objects
								if (k == 0 && typeof (seriesData[0]) == 'object') {
									if (seriesData[0].hasOwnProperty('ts')) {
										widgetObj.xAxis = widgetObj.xAxis || {}
										widgetObj.yAxis = widgetObj.yAxis || { type: 'value' }
										widgetObj.xAxis.type = 'time'

										// get ts and pass this value
										var tempData = []
										for (var l = 0; l < seriesData.length; l++) {
											tempData.push(seriesData[l].ts)
										}
										seriesData = tempData
									}
								}
								else {
									// check first set of data if time
									if (k == 0 && moment(seriesData[0]).isValid()) {
										widgetObj.xAxis = widgetObj.xAxis || {}
										widgetObj.yAxis = widgetObj.yAxis || { type: 'value' }
										widgetObj.xAxis.type = 'time'
									}
								}

								rawData.push(seriesData)
							}
							break

						case 'boxplot':
						case 'candlestick':
						case 'heatmap':
							doNotDelete = true
						case 'tree':
						case 'treemap':
						case 'pie':
						case 'gauge':

						case 'text':
						case 'textbinary':
						case 'ld2100':
							rawData.push(seriesData)
							break
						case 'radar':
							for (var ri in seriesData) {
								rawData.push(seriesData[ri])
							}
					}
				}

				switch (data[i].widgets[0].series[j].type.toLowerCase()) {
					case 'line':
					case 'bar':
					case 'scatter':
						var graphData = transformData(rawData)

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'tree':
						if (!doNotDelete) {
							delete widgetObj.xAxis
							delete widgetObj.yAxis
						}
						graphData = {}
						for (var k in rawData) {
							Object.assign(graphData, rawData[k])
						}
						graphData = [graphData]

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'treemap':
						seriesObj.upperLabel = {
							normal: {
								show: true,
							}
						}

						seriesObj.levels = [
						]
						var depthOf = function (object) {
							var level = 1;
							var key;
							for (key in object) {
								if (!object.hasOwnProperty(key)) continue;

								if (typeof object[key] == 'object') {
									var depth = depthOf(object[key]) + 1;
									level = Math.max(depth, level);
								}
							}
							return level;
						}
						var d = Math.floor((depthOf(rawData) - 1) / 2)
						for (var l = 0; l < d; l++) {
							seriesObj.levels.push({
								itemStyle: {
									normal: {
										borderWidth: 5,
										gapWidth: 1,
										borderColorSaturation: l / 10
									}
								}
							}
							)
						}

					case 'pie':

						if (!doNotDelete) {
							delete widgetObj.xAxis
							delete widgetObj.yAxis
						}

						graphData = []
						for (var k in rawData) {
							Object.assign(graphData, rawData[k])
						}

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'radar':
						if (!doNotDelete) {
							delete widgetObj.xAxis
							delete widgetObj.yAxis
						}
						graphData = []
						temparray = []


						var addIndicators = false
						if (!widgetObj['radar']) {
							addIndicators = true
						}

						widgetObj['legend'] = widgetObj['legend'] || {}
						widgetObj.legend['data'] = widgetObj['legend']['data'] || []
						widgetObj.legend.data.push(data[i].widgets[0].series[j].label)
						widgetObj.legend['bottom'] = widgetObj['legend']['bottom'] || 5
						widgetObj['radar'] = widgetObj['radar'] || {}
						widgetObj.radar['indicator'] = widgetObj['radar']['indicator'] || []

						for (var rdi in rawData) {
							temparray.push(+rawData[rdi].value)
							if (!buffer[rawData[rdi].point]) {
								buffer[rawData[rdi].point] = rawData[rdi].value * 1.2
							}
							else {
								if (rawData[rdi].value > buffer[rawData[rdi].point]) {
									buffer[rawData[rdi].point] = rawData[rdi].value * 1.2
								}
							}
						}
						for (var rdi in rawData) {
							if (addIndicators) {
								widgetObj.radar.indicator.push({ name: rawData[rdi].point, max: buffer[rawData[rdi].point] })
							}
						}

						graphData.push(temparray)

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'boxplot':
						widgetObj.xAxis = widgetObj.xAxis || {}
						widgetObj.yAxis = widgetObj.yAxis || { type: 'value' }
						widgetObj.xAxis.type = 'category'
						widgetObj.xAxis.data = rawData[0].axis
						graphData = rawData[0].data

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'candlestick':
						widgetObj.xAxis = widgetObj.xAxis || {}
						widgetObj.yAxis = widgetObj.yAxis || { type: 'value' }
						widgetObj.xAxis.type = 'category'
						widgetObj.xAxis.data = rawData[0].axis
						graphData = rawData[0].data

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'heatmap':
						widgetObj.xAxis = rawData[0].x
						widgetObj.yAxis = rawData[0].y
						widgetObj.visualMap = {
							calculable: true,
							orient: 'horizontal',
							left: 'center',
							color: ['red', 'yellow', 'green', 'blue'],
							min: 21,
							max: 23
						}
						graphData = rawData[0].data

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'gauge':
						if (!doNotDelete) {
							delete widgetObj.xAxis
							delete widgetObj.yAxis
						}
						graphData = []
						for (var rdi in rawData) {
							graphData.push({
								value: rawData[rdi].valueNum,
								name: rawData[rdi].point,
							})
						}
						seriesObj.min = 30
						seriesObj.max = 80

						if (IsJsonString(data[i].widgets[0].series[j].options)) {
							Object.assign(seriesObj, JSON.parse(data[i].widgets[0].series[j].options))
						}

						break

					case 'text':
						var val = rawData.shift()
						val = val.shift()
						var seriesObj = {
							name: val.point,
							value: val.value
						}

						break

					case 'textbinary':
						var val = rawData.shift()
						val = val.shift()
						var seriesObj = {
							name: val.point,
							value: parseInt(val.value) == 0 ? 'Off' : 'On'
						}

						break

					case 'ld2100':
						var val = rawData.shift()
						val = val.shift()
						var seriesObj = {
							name: val.point,
							value: parseInt(val.value) == -1 ? 'No Leak Detected' : 'Leak at ' + val.value
						}

						break
				}


				if (data[i].widgets[0].series[j].type.toLowerCase() != 'text' && data[i].widgets[0].series[j].type.toLowerCase() != 'textbinary' && data[i].widgets[0].series[j].type.toLowerCase() != 'ld2100') {
					seriesObj.name = data[i].widgets[0].series[j].label
					seriesObj.type = data[i].widgets[0].series[j].type.toLowerCase()
					seriesObj.data = graphData

					widgetObj.series.push(seriesObj)
				}
				else {
					if (typeof textObj != 'object') {
						textObj = []
					}
					textObj.push(seriesObj)
				}

			}

			if (IsJsonString(data[i].widgets[0].options)) {
				Object.assign(widgetObj, JSON.parse(data[i].widgets[0].options))
			}

			dashboard.widgets[data[i].key][data[i].key2] = {
				name: data[i].widgets[0].name,
				options: widgetObj,
				textOptions: textObj
			}

		}

		return dashboard
	}

	// check if dashboard exists and get user details
	var dashboardCheck = await modelDashboards.findById(req.params.id).catch((err) => { }) || false
	if (!!dashboardCheck) {

		var userDetails = await modelUsers.findById(dashboardCheck.user).catch((err) => { }) || false

		if (!!userDetails) {
			dashboardUser = userDetails.username
			dashboardPassword = userDetails.password

			var dashboard = await getDashboard(req.params.id)

			res.render('dashboard', {
				title: config.app.title,
				dashboard: dashboard,
				showMenu: showMenu
			})
		}
		else {
			res.render('dashboard', {
				title: config.app.title,
				showMenu: showMenu
			})
		}

	}
	else {
		res.render('dashboard', {
			title: config.app.title,
			showMenu: showMenu
		})
	}

})

module.exports = router
