/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

var isAdmin = false
var classId = null
var isInit = false

const customEventTypeNames = {
	0: 'Standard',
	1: 'Hausübung',
	2: 'Test'
}

document.addEventListener('keypress', function (event) {
	if (event.key == 'ArrowLeft') {
		changeMonth(-1)
	} else if (event.key == 'ArrowRight') {
		changeMonth(1)
	}
})

onLoad(function () {
	$('#calendarWrapper').swipe({
		left: function () {
			moveCalendar(0)
			changeMonth(1)
		},
		right: function () {
			moveCalendar(0)
			changeMonth(-1)
		},
		cancel: function () {
			moveCalendar(0)
		},
		moveHorizontal: moveCalendar,
		maxMoveX: 100,
		enableY: false,
		preventDefaultEvents: false
	})
	setSelectedDate(DateFormat.fromYYYYMMDD(hashGet('date')) || new Date())
	isInit = true
})
onLogin = init
forceLogin()

var selectedDate = null
var monthStartDate, monthEndDate

function init() {
	if (!me || !me.calendarServiceConfig) {
		new Toast('Diese Seite ist mit deinem Account nicht verfügbar', 3)
		return true
	}
	classId = me.classId
	if (isInit) {
		loadData()
	}
	return true
}

function moveCalendar(dx) {
	document.getElementById('days').style.right = dx + 'px'
}

function setSelectedDate(date) {
	selectedDate = new Date(date.getFullYear(), date.getMonth())
	$('#dateInput').val(DateFormat.inYYYYMMDD(selectedDate, '-'))
	monthStartDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
	monthEndDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
	hashSet('date', DateFormat.inYYYYMMDD(selectedDate, ''))
	if (me && me.calendarServiceConfig) {
		loadData()
		return
	}
	setupCalendar()
}

function changeDate(input) {
	var newVal = input.value
	try {
		var newDate = DateFormat.fromYYYYMMDD(newVal)
		if (isNaN(newDate.getTime())) return //Date is invalid
		if (DateDiff.inDays(DateFormat.toMonday(newDate), DateFormat.toMonday(selectedDate)) == 0) return //Date didn't change
		setSelectedDate(newDate)
	} catch (e) {
		new Toast('Bitte wählen sie ein valides Datum', 1.5)
	}
}

function changeMonth(direction) {
	setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1))
}

function loadData() {
	setupCalendar()
	if (loadData.currAjax) loadData.currAjax.abort()

	stopLoadingAnimation()
	startLoadingAnimation()

	var loadCache = true
	const success = function (data) {
		let online = data.firstOnline
		if (data.secondExists) {
			data.second.then(success)
			if (!loadCache) return
			waitGroup.start()
			data = data.first
		} else {
			if (data.firstOnline) {
				if (!data.exists) {
					waitGroup.stop()
					return
				}
				data = data.first
			}
			if (loadCache) {
				loadCache = false
				setupCalendar()
			}
		}

		data = safeJSONParse(data)

		if (!data || data.errors || !data.data) {
			new Toast('Interner Fehler')
			console.warn('Fehlerhafte Daten: ' + data)
			waitGroup.stop()
			return
		}

		if (data.data.homeworks) {
			data = data.data
			parseData(data, 'homeworks')
		} else if (data.data.exams) {
			data = data.data
			parseData(data, 'exams')
		} else if (data.data.classRoles) {
			data = data.data
			parseData(data, 'roles')
		} else if (data.data.events) {
			data = data.data
			parseData(data, 'events', online)
		}
		waitGroup.stop()
	}
	var hwDate = monthStartDate
	var waitGroup = new WaitGroup()
	waitGroup.then(function () {
		stopLoadingAnimation()
	})
	while (true) {
		waitGroup.start()
		var hwEndDate = new Date(hwDate.getTime() + 7 * 24 * 60 * 60 * 1000)
		var stop
		if (hwEndDate.getTime() > monthEndDate.getTime()) {
			hwEndDate = monthEndDate
			stop = true
		}
		WebUntis.getHomeworks(hwDate, hwEndDate).then(success)
		if (stop) break
		hwDate = new Date(hwEndDate.getTime() + 24 * 60 * 60 * 1000)
	}
	waitGroup.start()
	WebUntis.getExams(monthStartDate, monthEndDate).then(success)
	waitGroup.start()
	WebUntis.getRoles(monthStartDate, monthEndDate).then(success)
	waitGroup.start()
	WebUntis.getJupiterEvents(monthStartDate.getTime(), monthEndDate.getTime()).then(success)
}

function parseData(data, type, online) {
	var list
	switch (type) {
		case 'homeworks':
			list = data.homeworks
			break
		case 'roles':
			data = data.classRoles
			list = data
			break
		case 'exams':
			data = data.exams
			list = data
			break
		case 'holidays':
			list = data
			break
		case 'events':
			list = data.events
			if (online) isAdmin = data.isAdmin
			break
	}

	if (data && list && list.length > 0) {
		var startDateIndex = monthStartDate.getDay() - 1
		if (startDateIndex < 0)
			//sunday
			startDateIndex = 6

		list.forEach((elem) => {
			var dates
			switch (type) {
				case 'homeworks':
					dates = [DateFormat.fromYYYYMMDD(elem.dueDate)]
					break
				case 'roles':
					dates = [DateFormat.fromYYYYMMDD(elem.startDate)]
					break
				case 'exams':
					dates = [DateFormat.fromYYYYMMDD(elem.examDate)]
					break
				case 'holidays':
					dates = [DateFormat.fromYYYYMMDD(elem.startDate), DateFormat.fromYYYYMMDD(elem.endDate)]
					break
				case 'events':
					dates = [new Date(parseInt(elem.startTime))]
					break
			}

			if (dates.length == 2) {
				if (dates[0].getTime() == dates[1].getTime()) {
					dates.pop()
				} else {
					var date = dates[0]
					date.setHours(12) //12 weil sommer / winterzeit
					var endDate = dates.pop()
					while (true) {
						date = new Date(date.getTime() + 24 * 60 * 60 * 1000)
						if (date.getTime() > endDate.getTime() && DateDiff.inDays(date, endDate) > 0) break
						dates.push(date)
					}
				}
			}

			dates.forEach(function (date) {
				if (
					(date.getTime() > monthEndDate.getTime() && DateDiff.inDays(date, monthEndDate) > 0) ||
					(date.getTime() < monthStartDate.getTime() && DateDiff.inDays(date, monthStartDate) > 0)
				)
					return
				var dayIndex = date.getDate() - 1 + startDateIndex
				var day = $('#days').children().eq(dayIndex)
				if (day != null) {
					var event = $('<div>', {
						class: 'event'
					})
					day.append(event)

					if (type == 'exams') {
						populateExamEvent(event, elem, data)
					} else if (type == 'homeworks') {
						populateHomeworkEvent(event, elem, data)
					} else if (type == 'roles') {
						populateRoleEvent(event, elem, data)
					} else if (type == 'holidays') {
						populateHolidayEvent(event, elem, data)
					} else if (type == 'events') {
						populateEventEvent(event, elem, data)
					}
				}
			})
		})
	}
}

function populateEventEvent(html, elem, data) {
	switch (elem.type) {
		case '1':
			html.addClass('event-homework')
			html.addClass('event-custom-disguise')
			html.click(function () {
				customHomeworkPopup(elem)
			})
			break
		case '2':
			html.addClass('event-exam')
			html.addClass('event-custom-disguise')
			html.click(function () {
				examPopup(elem)
			})
			break
		default:
			html.addClass('event-custom')
			html.click(function () {
				customEventPopup(elem)
			})
	}
	html.text(elem.title)
}

function populateHolidayEvent(html, elem, data) {
	html.addClass('event-holiday')
	html.text(toLetterCase(elem.longName))
	html.click(function () {
		holidayPopup(elem)
	})
}

function populateExamEvent(html, elem, data) {
	html.addClass('event-exam')
	html.text(toLetterCase(elem.name))
	html.click(function () {
		examPopup(elem)
	})
}

function populateHomeworkEvent(html, elem, data) {
	html.addClass('event-homework')
	var lesson
	for (var i = 0; i < data.lessons.length; i++) {
		if (data.lessons[i].id === elem.lessonId) {
			lesson = data.lessons[i]
			break
		}
	}
	html.text(toLetterCase(lesson.subject))
	html.click(function () {
		homeworkPopup(elem, data)
	})
}

function populateRoleEvent(html, elem, data) {
	html.addClass('event-role')
	html.text(toLetterCase(elem.duty.label))
	html.click(function () {
		rolePopup(elem)
	})
}

function setupCalendar() {
	$('#monthName').text(DateFormat.getMonthName(selectedDate))
	var days = $('#days')
	days.empty()

	var startDateIndex = monthStartDate.getDay() - 1
	if (startDateIndex < 0)
		//sunday
		startDateIndex = 6
	var endDateIndex = monthEndDate.getDay() - 1
	if (endDateIndex < 0)
		//sunday
		endDateIndex = 6

	var now = new Date()

	for (let i = 0; i < selectedDate.monthDays() + startDateIndex + (6 - endDateIndex); i++) {
		var index = i - startDateIndex + 1
		var dayInCurrMonth = true
		if (index < 1) {
			index = new Date(monthStartDate.getTime() - 24 * 3600 * 1000).monthDays() + index
			dayInCurrMonth = false
		} else if (index > selectedDate.monthDays()) {
			index %= selectedDate.monthDays()
			dayInCurrMonth = false
		}
		let date = new Date(selectedDate.getTime() + 24 * 3600 * 1000 * (index - 1))
		var tdy = false
		if (DateDiff.inDays(date, now) == 0) {
			tdy = true
		}
		days.append(
			$('<div>', {
				class: 'day' + (dayInCurrMonth ? '' : ' past-future-day ') + (tdy ? ' today' : '')
			}).append(
				$('<p>', {
					text: index,
					class: 'day-index'
				}).append(
					$('<button>', {
						class: 'add-event-button round-button',
						title: 'Event hinzufügen',
						html: "<div class='center'><span class='add-event-span'>+</span></div>"
					}).click(function () {
						editEventPopup(date)
					})
				)
			)
		)
	}

	if (me && me.calendarServiceConfig) parseData(me.calendarServiceConfig.holidays, 'holidays')
}

function fixStartAndEndTime() {
	var startTime = $('#newEventStartTime').val()
	if (!startTime || startTime.length == 0) return
	startTime = DateFormat.fromHHMM(startTime)
	var endTime = $('#newEventEndTime').val()
	if (!endTime || endTime.length == 0) return
	endTime = DateFormat.fromHHMM(endTime)
	if (endTime.getTime() < startTime.getTime()) {
		$('#newEventEndTime').val(DateFormat.inHHMM(startTime))
	}
}

function editCurrentEvent(elem) {
	editEventPopup(null, elem)
}
