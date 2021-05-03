class Group {
	id
	shortName
	longName
	classTeacher
	fullname() {
		return `${this.longName} (${this.shortName})`
	}
	constructor(shortName, longName, id) {
		this.shortName = shortName.toUpperCase()
		this.longName = toLetterCase(longName)
		this.id = id
	}
	static findOrMake(shortName, longName, id) {
		for (var i = 0; i < Group.groups.length; i++) {
			if (Group.groups[i].id == id) return Group.groups[i]
		}
		var group = new Group(shortName, longName, id)
		Group.groups.push(group)
		return group
	}
}
Group.groups = []
class Room {
	id
	shortName
	longName
	fullname() {
		return `${this.longName} (${this.shortName})`
	}
	constructor(shortName, longName, id) {
		this.shortName = shortName.toUpperCase()
		this.longName = toLetterCase(longName)
		this.id = id
	}
	static findOrMake(shortName, longName, id) {
		for (var i = 0; i < Room.rooms.length; i++) {
			if (Room.rooms[i].id == id) return Room.rooms[i]
		}
		var room = new Room(shortName, longName, id)
		Room.rooms.push(room)
		return room
	}
}
Room.rooms = []
class Subject {
	id
	shortName
	longName
	foreColor
	backColor
	fullname() {
		return `${this.longName} (${this.shortName})`
	}
	constructor(shortName, longName, id, foreColor, backColor) {
		this.shortName = shortName.toUpperCase()
		this.longName = toLetterCase(longName)
		this.id = id
		this.foreColor = foreColor
		this.backColor = backColor
	}
	static findOrMake(shortName, longName, id, foreColor, backColor) {
		for (var i = 0; i < Subject.subjects.length; i++) {
			if (Subject.subjects[i].id == id) return Subject.subjects[i]
		}
		var subject = new Subject(shortName, longName, id, foreColor, backColor)
		Subject.subjects.push(subject)
		return subject
	}
}
Subject.subjects = []
class Teacher {
	id
	shortName
	longName
	fullname() {
		if (!this.longName) return this.shortName
		return `${this.longName} (${this.shortName})`
	}
	setLongName(name) {
		if (name.endsWith(`(${this.shortName})`)) name = name.slice(0, -this.shortName.length - 2)
		this.longName = toLetterCase(name)
	}
	constructor(shortName, id) {
		this.shortName = shortName.toUpperCase()
		this.id = id
	}
	fullnameAvailable() {
		return this.longName && this.longName != ''
	}
	static findOrMake(shortName, id) {
		for (var i = 0; i < Teacher.teachers.length; i++) {
			if (Teacher.teachers[i].id == id) return Teacher.teachers[i]
		}
		var teacher = new Teacher(shortName, id)
		Teacher.teachers.push(teacher)
		return teacher
	}
}
Teacher.teachers = []
class State {
	isExam
	isEvent
	isStandard
	isCancelled
	isShift
	isSubstitution
	isAdditional
	isFree
	isRoomSubstitution
	isOfficeHour
	displayedValue

	constructor(isExam, isEvent, isStandard, isCancelled, isShift, isSubstitution, isAdditional, isFree, isRoomSubstitution, isOfficeHour, displayedValue) {
		this.isExam = isExam == null ? false : isExam
		this.isEvent = isEvent == null ? false : isEvent
		this.isStandard = isStandard == null ? false : isStandard
		this.isCancelled = isCancelled == null ? false : isCancelled
		this.isShift = isShift == null ? false : isShift
		this.isSubstitution = isSubstitution == null ? false : isSubstitution
		this.isAdditional = isAdditional == null ? false : isAdditional
		this.isFree = isFree == null ? false : isFree
		this.isRoomSubstitution = isRoomSubstitution == null ? false : isRoomSubstitution
		this.isOfficeHour = isOfficeHour == null ? false : isOfficeHour
		this.displayedValue = displayedValue
		State.states.push(this)
	}
	static findOrMakeState(isExam, isEvent, isStandard, isCancelled, isShift, isSubstitution, isAdditional, isFree, isRoomSubstitution, isOfficeHour, displayedValue) {
		for (var i = 0; i < State.states.length; i++) {
			const other = [
				State.states[i].isExam,
				State.states[i].isEvent,
				State.states[i].isStandard,
				State.states[i].isCancelled,
				State.states[i].isShift,
				State.states[i].isSubstitution,
				State.states[i].isAdditional,
				State.states[i].isFree,
				State.states[i].isRoomSubstitution,
				State.states[i].isOfficeHour,
				State.states[i].displayedValue
			]
			if (
				[isExam, isEvent, isStandard, isCancelled, isShift, isSubstitution, isAdditional, isFree, isRoomSubstitution, isOfficeHour, displayedValue].every(
					(v, i) => !!v == !!other[i]
				)
			)
				return State.states[i]
		}
		return new State(isExam, isEvent, isStandard, isCancelled, isShift, isSubstitution, isAdditional, isFree, isRoomSubstitution, isOfficeHour, displayedValue)
	}
}
State.states = []
