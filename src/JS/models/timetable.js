class Timetable {
	type
	id
	weeks = []
	constructor(type, id) {
		this.id = id
		this.type = type
	}
	addWeek(week) {
		this.weeks.push(week)
	}
	findOrMakeWeek(date) {
		for (var i = 0; i < this.weeks.length; i++) {
			if (this.weeks[i].startDate.getTime() == date.getTime()) return this.weeks[i]
		}
		var week = new Week(date, this)
		this.addWeek(week)
		return week
	}
	static findOrMakeTimetable(type, id) {
		for (var i = 0; i < Timetable.timetables.length; i++) {
			if (Timetable.timetables[i].type == type && Timetable.timetables[i].id == id) return Timetable.timetables[i]
		}
		var timetable = new Timetable(type, id)
		Timetable.addTimetable(timetable)
		return timetable
	}

	static addTimetable(timetable) {
		Timetable.timetables.push(timetable)
	}
}
Timetable.timetables = []
class Week {
	timetable
	startDate
	requestDate = 0
	days = []
	constructor(startDate, timetable) {
		this.startDate = startDate
		this.timetable = timetable
	}
	addDay(day) {
		this.days.push(day)
	}
	findOrMakeDay(date) {
		for (let i = 0; i < this.days.length; i++) {
			if (this.days[i].date.getTime() == date.getTime()) return this.days[i]
		}
		let day = new Day(new Date(date), this)
		this.addDay(day)
		return day
	}
	hasDays() {
		return this.days && this.days.length != 0
	}
	async load() {
		await pullTimetableWeek(this)
		return this
	}
	async loadActual() {
		await pullTimetableWeek(this, false)
		return this
	}
	splitLessons() {
		for (var i = 0; i < this.days.length; i++) {
			this.days[i].splitLessons()
		}
	}
}
class Day {
	date
	week
	positionedPeriods = null
	periods = []
	lessons = []
	constructor(date, week) {
		this.date = date
		this.week = week
	}
	addPeriod(period) {
		this.periods.push(period)
	}

	addLesson(lesson) {
		this.lessons.push(lesson)
	}
	filled() {
		return this.lessons && this.lessons.length != 0
	}
	empty() {
		return !this.filled()
	}
	findOrMakePeriod(start) {
		for (var i = 0; i < this.periods.length; i++) {
			if (this.periods[i].periodInfo.start == start) return this.periods[i]
		}

		var period = new Period(PeriodInfo.find(start), this)
		this.addPeriod(period)
		return period
	}
	findOrMakePeriods(start, end) {
		var index = PeriodInfo.find(start).number - 1
		var periods = []
		for (var i = index; PeriodInfo.periods[i] && PeriodInfo.periods[i].end <= end; i++) {
			periods.push(this.findOrMakePeriod(PeriodInfo.periods[i].start))
		}

		return periods
	}

	periodAt(position = PeriodInfo.currentPosition(), searchDir = 0) {
		//- last 0 current + next
		if (position < 0) return position
		if (this.positionedPeriods === null) {
			this.positionedPeriods = []
			$.each(this.periods, (_, period) => {
				this.positionedPeriods[period.periodInfo.position] = period
			})
		}
		var i = position
		if (searchDir == 0) return this.positionedPeriods[i] ? this.positionedPeriods[i] : position
		i = searchDir > 0 ? ++i : --i
		for (; i < PeriodInfo.periods[PeriodInfo.periods.length - 1].position && i >= 0; i = searchDir > 0 ? ++i : --i) {
			if (this.positionedPeriods[i] && this.positionedPeriods[i].hasUncancelledLessons()) return this.positionedPeriods[i]
		}
		return searchDir > 0 ? -1 : 0
	}

	tryAddPeriodsToLesson(lessonData, periods) {
		for (var i = 0; i < this.lessons.length; i++) {
			if (this.lessons[i].equals(lessonData)) {
				$.each(periods, (_, p) => {
					this.lessons[i].addPeriod(p)
					p.addLesson(this.lessons[i])
				})
				return true
			}
		}
		return false
	}
	splitLessons() {
		var newLessons = []

		for (let i = 0; i < this.lessons.length; i++) {
			newLessons.push(this.lessons[i])
			if (this.lessons[i].periods.length == 1) continue
			this.lessons[i].periods.sort((a, b) => a.periodInfo.position - b.periodInfo.position)
			var last = this.lessons[i].periods[0].periodInfo.position
			for (let j = 0; j < this.lessons[i].periods.length; j++) {
				if (this.lessons[i].periods[j].periodInfo.position > last + 1) {
					let newLesson = new Lesson(this.lessons[i].id, this.lessons[i].day, this.lessons[i].state, this.lessons[i].text)
					newLesson.subjects = this.lessons[i].subjects
					newLesson.teachers = this.lessons[i].teachers
					newLesson.groups = this.lessons[i].groups
					newLesson.rooms = this.lessons[i].rooms
					newLesson.equalsHelper = this.lessons[i].equalsHelper
					newLesson.periods = this.lessons[i].periods.slice(0, j)
					this.lessons[i].periods = this.lessons[i].periods.slice(j)
					j = 0
					newLessons.push(newLesson)
				}
				last = this.lessons[i].periods[j].periodInfo.position
			}
		}
		this.lessons = newLessons
	}
	async loadTeacherNames() {
		var renew = false
		$.each(this.lessons, (_, lesson) => {
			$.each(lesson.teachers, (_, teacher) => {
				if (!teacher.fullnameAvailable()) {
					renew = true
					return false
				}
			})
		})
		if (!renew) return
		var info = await WebUntis.getTimegridPeriodInfo(DateFormat.inYYYYMMDD(this.date), typeToInt[this.week.timetable.type], this.week.timetable.id)
		if (!info.exists) return
		info = info.first
		info = safeJSONParse(info)
		if (info == null) return
		info = info.data

		var teachersById = []
		$.each(Teacher.teachers, (_, teacher) => {
			teachersById[teacher.id] = teacher
		})
		for (var i = 0; i < info.blocks.length; i++) {
			for (var j = 0; j < info.blocks[i].length; j++) {
				for (var k = 0; k < info.blocks[i][j].periods.length; k++) {
					for (var l = 0; l < info.blocks[i][j].periods[k].teachers.length; l++) {
						if (teachersById[info.blocks[i][j].periods[k].teachers[l].id])
							teachersById[info.blocks[i][j].periods[k].teachers[l].id].setLongName(info.blocks[i][j].periods[k].teachers[l].name)
					}
				}
			}
		}
	}
}
