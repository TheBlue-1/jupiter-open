class PeriodInfo {
	start
	end
	number
	position
	constructor(start, end, number, position) {
		this.number = number
		this.position = position
		this.end = end
		this.start = start
		PeriodInfo.periods.push(this)
	}
	static find(start) {
		for (var i = 0; i < PeriodInfo.periods.length; i++) {
			if (PeriodInfo.periods[i].start >= start) return PeriodInfo.periods[i]
		}
	}
	static loaded() {
		return PeriodInfo.periods && PeriodInfo.periods.length != 0
	}
	static async load() {
		var req = await WebUntis.getTableLayout()
		let data = req.first
		data = JSON.parse(data)
		if (!data) throw jsError(ErrorType.ERROR, 2, req.first)
		data = data.data && data.data.rows
		var lastEnd = data[0].startTime
		var position = 1
		$.each(data, function (_, periodData) {
			if (periodData.startTime != lastEnd) position++
			new PeriodInfo(periodData.startTime, periodData.endTime, periodData.period, position)
			lastEnd = periodData.endTime
			position++
		})
	}
	static currentPosition(date = new Date()) {
		date = parseInt(DateFormat.inUntisTime(date))
		for (var i = 0; i < PeriodInfo.periods.length; i++) {
			if (parseInt(PeriodInfo.periods[i].start) > date) {
				return PeriodInfo.periods[i].position - 1
			}
			if (parseInt(PeriodInfo.periods[i].end) > date) {
				return PeriodInfo.periods[i].position
			}
		}
		return -1
	}
}
PeriodInfo.periods = []
class Period {
	periodInfo
	day
	lessons = []
	constructor(periodInfo, day) {
		this.periodInfo = periodInfo
		this.day = day
	}
	start() {
		var date = new Date(this.day.date)
		date.setHours(this.periodInfo.start.toString().slice(0, -2))
		date.setMinutes(this.periodInfo.start.toString().slice(-2))
		return date
	}
	end() {
		var date = new Date(this.day.date)
		date.setHours(this.periodInfo.end.toString().slice(0, -2))
		date.setMinutes(this.periodInfo.end.toString().slice(-2))
		return date
	}
	addLesson(lesson) {
		this.lessons.push(lesson)
	}
	hasUncancelledLessons() {
		for (var i = 0; i < this.lessons.length; i++) {
			if (!this.lessons[i].state.isCancelled) return true
		}
		return false
	}
}
class Lesson {
	id
	subjects = []
	teachers = []
	groups = []
	periods = []
	rooms = []
	equalsHelper = []
	state
	day
	text
	constructor(id, day, state, text) {
		this.id = id
		this.day = day
		this.state = state
		this.text = text
		this.equalsHelper[1] = []
		this.equalsHelper[2] = []
		this.equalsHelper[3] = []
		this.equalsHelper[4] = []
	}
	addPeriod(period) {
		this.periods.push(period)
	}
	addTeacher(teacher) {
		this.teachers.push(teacher)
		this.equalsHelper[2][teacher.id] = 2
	}
	start() {
		return this.periods[0].start()
	}
	end() {
		return this.periods[this.periods.length - 1].end()
	}
	addGroup(group) {
		this.groups.push(group)
		this.equalsHelper[1][group.id] = 1
	}

	addSubject(subject) {
		this.subjects.push(subject)
		this.equalsHelper[3][subject.id] = 3
	}

	addRoom(room) {
		this.rooms.push(room)
		this.equalsHelper[4][room.id] = 4
	}
	equals(lessonData) {
		lessonData.elements.state = lessonData.state
		lessonData = lessonData.elements
		for (var i = 0; i < lessonData.length; i++) {
			if (!(this.equalsHelper[lessonData[i].type][lessonData[i].id] && this.equalsHelper[lessonData[i].type][lessonData[i].id] == lessonData[i].type)) {
				return false
			}
		}
		return lessonData.state == this.state
	}
}
