async function parseTimetableWeek(data, week) {
	try {
		data = JSON.parse(data)
	} catch (e) {
		throw jsError(ErrorType.ERROR, 2, data)
	}

	if (!PeriodInfo.loaded()) {
		await PeriodInfo.load()
	}

	const requestDate = data.requestDate
	if (week.requestDate > requestDate) {
		return
	}
	if (week.hasDays()) week.days = []

	week.requestDate = requestDate
	var elements = []
	elements[1] = []
	elements[2] = []
	elements[3] = []
	elements[4] = []
	elements[5] = []
	data = data.data.result.data
	$.each(data.elements, function (_, elem) {
		elements[elem.type][elem.id] = elem
	})
	$.each(data.elementPeriods[data.elementIds[0]], function (_, lessonData) {
		lessonData.date = DateFormat.fromYYYYMMDD(lessonData.date)
		var day = week.findOrMakeDay(lessonData.date)
		var periods = day.findOrMakePeriods(lessonData.startTime, lessonData.endTime)
		var state = State.findOrMakeState(
			lessonData.is.exam,
			lessonData.is.event,
			lessonData.is.standard,
			lessonData.is.cancelled,
			lessonData.is.shift,
			lessonData.is.substitution,
			lessonData.is.additional,
			lessonData.is.free,
			lessonData.is.roomSubstitution,
			lessonData.is.officeHour,
			lessonData.cellState
		)
		lessonData.state = state
		if (day.tryAddPeriodsToLesson(lessonData, periods)) return true

		var lesson = new Lesson(lessonData.id, day, state, lessonData.lessonText)

		$.each(lessonData.elements, function (_, elem) {
			var data = elements[elem.type][elem.id]
			switch (elem.type) {
				case 1:
					lesson.addGroup(Group.findOrMake(data.name, data.longName, data.id))
					break
				case 2:
					lesson.addTeacher(Teacher.findOrMake(data.name, data.id))
					break
				case 3:
					lesson.addSubject(Subject.findOrMake(data.name, data.longName, data.id, data.foreColor, data.backColor))
					break
				case 4:
					lesson.addRoom(Room.findOrMake(data.name, data.longName, data.id))
					break
			}
		})
		day.addLesson(lesson)
		$.each(periods, (_, p) => {
			p.addLesson(lesson)
			lesson.addPeriod(p)
		})
	})
	week.splitLessons()
	return week
}

async function pullTimetableWeek(week, useCache = true) {
	var data = await WebUntis.getTimegrid(week.timetable.type, week.timetable.id, week.startDate, useCache)
	if (!data.exists) return

	try {
		let second = data.secondExists ? data.second.then((data) => (data ? parseTimetableWeek(data, week) : null)) : null
		let res = [await parseTimetableWeek(data.first, week), second]
		return res
	} catch (e) {
		return handleError(e)
	}
}
async function getTimetableDays(type, id, startDate, endDate, reload = false) {
	startDate = DateFormat.toFullDay(startDate)
	endDate = DateFormat.toFullDay(endDate)
	let mondays = []
	let lastMonday = DateFormat.toMonday(endDate)
	for (let date = DateFormat.toMonday(startDate); date <= lastMonday; DateFormat.addDays(date, 7)) {
		mondays.push(new Date(date))
	}
	let weeks = await getTimetableWeeks(type, id, mondays, reload)
	let days = []
	days.minDate = weeks[0].startDate
	for (const week of weeks) {
		if (week.requestDate && (!days.requestDate || week.requestDate < days.requestDate)) days.requestDate = week.requestDate
	}
	let week = 0
	for (let date = new Date(startDate); date <= endDate; DateFormat.addDays(date, 1)) {
		if (weeks[week + 1] && date.getTime() == weeks[week + 1].startDate.getTime()) week++
		days.push(weeks[week].findOrMakeDay(date))
		if (weeks[week].startDate > days.minDate) days.minDate = weeks[week].startDate
	}

	days.currentDayIndex = (date = new Date()) => {
		var i = 0
		for (; i < days.length; i++) {
			if (date < days[i].date) return i - 1
		}
		i--
		if (date < DateFormat.addDays(new Date(days[i].date), 1)) return i
		return -2
	}

	return days
}
async function getTimetableWeeks(type, id, mondays, reload = false) {
	var weeks = []
	var table = Timetable.findOrMakeTimetable(type, id)
	for (var i = 0; i < mondays.length; i++) {
		var week = table.findOrMakeWeek(mondays[i])
		if (reload) {
			weeks.push(await week.loadActual())
			continue
		}
		if (week.hasDays()) weeks.push(week)
		else weeks.push(await week.load())
	}
	return weeks
}
