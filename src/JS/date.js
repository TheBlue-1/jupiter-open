const monthNames = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
/*Die Woche bei der Date.getDay() Methode startet mit Sonntag*/
const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

const Timespans = {
	Seconds: 1000,
	seconds: (i) => i * Timespans.Seconds,
	Minutes: 1000 * 60,
	minutes: (i) => i * Timespans.Minutes,
	Hours: 1000 * 60 * 60,
	hours: (i) => i * Timespans.Hours,
	Days: 1000 * 60 * 60 * 24,
	days: (i) => i * Timespans.Days,
	Weeks: 1000 * 60 * 60 * 24 * 7,
	weeks: (i) => i * Timespans.Weeks
}

const DateDiff = {
	inMinutes: function (d1, d2) {
		var t2 = d2.getTime()
		var t1 = d1.getTime()

		return parseInt((t2 - t1) / (60 * 1000))
	},
	inHours: function (d1, d2) {
		var t2 = d2.getTime()
		var t1 = d1.getTime()

		return parseInt((t2 - t1) / (3600 * 1000))
	},
	inDays: function (d1, d2) {
		d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
		d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
		var t2 = d2.getTime()
		var t1 = d1.getTime()
		var diff = t2 - t1
		return Math.abs(Math.floor(diff / 1000 / 60 / 60 / 24))
	},
	inDHMS: function (d1, d2) {
		var t2 = d2.getTime()
		var t1 = d1.getTime()
		var diff = new Date(0, 0, 0, 0, 0, 0, 0)
		diff.setMilliseconds(t2 - t1)
		return diff
	}
}

const DateFormat = {
	inCountDown: function (ms) {
		if (typeof ms !== 'number') return ms
		var h = Math.floor(ms / 3600000)
		ms -= h * 3600000
		var m = Math.floor(ms / 60000)
		ms -= m * 60000
		var s = Math.round(ms / 1000)
		val = ''
		if (h > 0) {
			val += h + ' Stunden '
		}

		if (h + m > 0) {
			val += m + ' Minuten '
		}

		val += s + ' Sekunden'
		return val
	},
	inHH: function (d) {
		return ('0' + d.getHours()).slice(-2)
	},
	inDayContainingHH: function (d) {
		var hours = d.getDay() * 24 + d.getHours()
		return hours > 9 ? hours + '' : '0' + hours
	},
	inss: function (d) {
		return ('0' + d.getSeconds()).slice(-2)
	},
	inmm: function (d) {
		return ('0' + d.getMinutes()).slice(-2)
	},
	inMM: function (d) {
		return ('0' + (d.getMonth() + 1)).slice(-2)
	},
	inDD: function (d) {
		return ('0' + d.getDate()).slice(-2)
	},
	inHHMM: function (d, seperator = ':') {
		var h = DateFormat.inHH(d)
		var m = DateFormat.inmm(d)
		return h + seperator + m
	},
	inDayContainingHHMM: function (d, seperator = ':') {
		var h = DateFormat.inDayContainingHH(d)
		var m = DateFormat.inmm(d)
		return h + seperator + m
	},
	inHHMMSS: function (d) {
		var h = DateFormat.inHH(d)
		var m = DateFormat.inmm(d)
		var s = DateFormat.inss(d)
		return h + ':' + m + ':' + s
	},
	inUntisTime: function (d) {
		return parseInt(DateFormat.inHHMM(d, ''))
	},
	toDate: function (millis) {
		return new Date(0, 0, 0, Math.round(millis / 1000.0 / 60 / 60), Math.round(millis / 1000.0 / 60) % 60)
	},
	toMonday: function (d) {
		var day = d.getDay() || 7
		var newDate = new Date(d)
		if (day !== 1) newDate.setHours(-24 * (day - 1))
		newDate.setHours(0)
		newDate.setMinutes(0)
		newDate.setSeconds(0)
		newDate.setMilliseconds(0)
		return newDate
	},
	toFullDay: function (d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate())
	},
	addDays: function (d, days) {
		d.setHours(days * 24 + d.getHours())
		return d
	},
	inYYYYMMDD: function (d, sperator = '') {
		return d.getFullYear() + sperator + this.inMM(d) + sperator + this.inDD(d)
	},
	inDDMMYYYY: function (d, sperator = '') {
		return this.inDD(d) + sperator + this.inMM(d) + sperator + d.getFullYear()
	},
	inYYYYMMDDHHMM: function (d, seperator = '') {
		return DateFormat.inYYYYMMDD(d, seperator) + ' ' + DateFormat.inHHMM(d)
	},
	inDDMMYYYYHHMM: function (d, seperator = '') {
		return DateFormat.inDDMMYYYY(d, seperator) + ' ' + DateFormat.inHHMM(d)
	},
	inDDDDMM: function (d) {
		return DateFormat.getDayName(d).slice(0, 2) + '., ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.'
	},
	fromYYYYMMDD: function (dstr) {
		if (dstr == null || dstr == '') return
		dstr = dstr.toString().replace(/\D/g, '')
		if (dstr == '') return
		var d = new Date(0, 0, 0, 0, 0, 0, 0)
		d.setFullYear(parseInt(dstr.substr(0, 4)))
		d.setDate(parseInt(dstr.substr(6, 2)))
		var m = parseInt(dstr.substr(4, 2)) - 1
		d.setMonth(m)
		return d
	},
	fromYYYYMMDDHHMM: function (dstr) {
		if (dstr == null || dstr == '') return
		dstr = dstr.toString().replace(/\D/g, '')
		if (dstr == '') return
		var d = new Date(0, 0, 0, 0, 0, 0, 0)
		d.setFullYear(parseInt(dstr.substr(0, 4)))
		d.setDate(parseInt(dstr.substr(6, 2)))
		var m = parseInt(dstr.substr(4, 2)) - 1
		d.setMonth(m)
		var h = parseInt(dstr.substr(8, 2))
		d.setHours(h)
		var min = parseInt(dstr.substr(10, 2))
		d.setMinutes(min)
		return d
	},
	fromUntisTime: function (dstr) {
		dstr = dstr.toString()
		return new Date(0, 0, 0, dstr.slice(0, -2), dstr.slice(-2), 0, 0)
	},
	fromHHMM: function (dstr) {
		dstr = dstr.toString().replace(/\D/g, '')
		return new Date(0, 0, 0, dstr.slice(0, -2), dstr.slice(-2), 0, 0)
	},
	fromMS: function (ms) {
		var date = new Date(0, 0, 0, 0, 0, 0, 0)
		date.setMilliseconds(ms)
		return date
	},
	getMonthName: function (d) {
		return monthNames[d.getMonth()]
	},
	getDayName: function (d) {
		return dayNames[d.getDay()]
	}
}
