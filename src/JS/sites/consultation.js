/**
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */
forceLogin()
onLogin = init
var startDate = DateFormat.fromYYYYMMDD(hashGet('startdate'))
var endDate = DateFormat.fromYYYYMMDD(hashGet('enddate'))
var teacherID = hashGet('teacher')
var classID = hashGet('class')
var parsedData
var parsedCachedData
var ajaxRequests
var ajaxId = 0

function init() {
	setDate(startDate || new Date(), endDate)
	loadTeachers()
	loadClasses()
	return true
}

function dateInput(input) {
	var startDate
	var endDate
	if (input == 'start') {
		startDate = DateFormat.fromYYYYMMDD($('#startDateInput').val())
	} else if (input == 'end') {
		endDate = DateFormat.fromYYYYMMDD($('#endDateInput').val())
	}
	setDate(startDate, endDate)
}

function setDate(newStartDate, newEndDate = null) {
	if ((!newStartDate || newStartDate == '') && (!newEndDate || newEndDate == '')) return
	startDate = newStartDate || startDate
	if (startDate && endDate && startDate.getTime() > endDate.getTime()) endDate = null
	endDate = newEndDate || endDate || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
	$('#startDateInput').val(DateFormat.inYYYYMMDD(startDate, '-'))
	$('#endDateInput').val(DateFormat.inYYYYMMDD(endDate, '-'))
	hashSet('startdate', DateFormat.inYYYYMMDD(startDate, ''))
	hashSet('enddate', DateFormat.inYYYYMMDD(endDate, ''))
}

function onTeacherInput(input) {
	if (input.value && input.value != '') {
		teacherID = input.value
		input.className = ''
		hashSet('teacher', teacherID)
	} else {
		teacherID = null
		input.className = 'empty-select'
		hashSet('teacher', null)
	}
}

function setTeacher(id) {
	var input = $('#teacherInput')[0]
	input.value = id
	onTeacherInput(input)
}

function onClassInput(input) {
	if (input.value && input.value != '') {
		classID = input.value
		input.className = ''
		hashSet('class', classID)
	} else {
		classID = null
		input.className = 'empty-select'
		hashSet('class', null)
	}
}

async function loadTeachers() {
	var data = await WebUntis.getTeachers(new Date())
	if (!data.exists) return
	data = data.first
	data = safeJSONParse(data)
	data = data.data
	var list = $('#teacherInput')
	list.children(':not(:first)').remove()
	data.elements.sort(function (a, b) {
		if (a.displayname.trim() < b.displayname.trim()) return -1
		if (a.displayname.trim() > b.displayname.trim()) return 1
		return 0
	})
	$.each(data.elements, function (i, e) {
		let name = e.displayname
		name = toLetterCase(name)
		var option = $('<option>')
		option.attr('value', e.id)
		option.text(name)
		list.append(option)
	})
	if (teacherID && teacherID != '') {
		list.removeClass('empty-select')
		list.val(teacherID)
	}
}

async function loadClasses() {
	var data = await WebUntis.getGroups(new Date())
	if (!data.exists) return
	data = data.first
	data = safeJSONParse(data)
	data = data.data
	var list = $('#classInput')
	list.children(':not(:first)').remove()
	data.elements.sort(function (a, b) {
		if (a.displayname.trim() < b.displayname.trim()) return -1
		if (a.displayname.trim() > b.displayname.trim()) return 1
		return 0
	})
	$.each(data.elements, function (i, e) {
		var option = $('<option>')
		option.attr('value', e.id)
		option.html(e.displayname)
		list.append(option)
	})
	if (classID && classID != '') {
		list.removeClass('empty-select')
		list.val(classID)
	}
}

function searchConsultations() {
	$('#popup').css('display', 'none')
	$('#regPopup').css('display', 'none')
	var form = $(searchGrid)
	if (!form[0].checkValidity()) {
		form[0].reportValidity()
		return
	}

	var date = startDate
	if (!classID) classID = ''

	parsedData = new Array()
	parsedCachedData = new Array()

	var requests = Math.ceil(DateDiff.inDays(startDate, endDate) / 7)
	var cacheRequests = requests

	let currAjaxId = ++ajaxId

	while (!(DateDiff.inDays(date, endDate) >= 0 && date.getTime() >= endDate.getTime())) {
		WebUntis.getConsultationHours(date, classID).then(function (data) {
			if (currAjaxId != currAjaxId) return
			if (!data.exists) return
			var first = data.first
			parseData(first, data.firstOnline)
			if (data.firstOnline) {
				requests--
				if (requests == 0) showData(parsedData)
			} else {
				cacheRequests--
				if (cacheRequests == 0) showData(parsedCachedData)
				data.second.then((data) => {
					if (!data) return
					parseData(data, true)
					requests--
					if (requests == 0) showData(parsedData)
				})
			}
		})
		date = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
	}
}

function parseData(data, cached) {
	data = safeJSONParse(data)
	if (data == null || data.data == null || data.error != null) {
		new Toast('Ein Fehler ist aufgetreten', 2)
		console.warn('data == null')
	}
	data = data.data
	data = Array.from(data)
	if (!cached) parsedData = parsedData.concat(data)
	else {
		parsedCachedData = parsedCachedData.concat(data)
	}
}

function showData(data) {
	var days = []
	data.forEach(function (elem) {
		if (teacherID && teacherID != '' && elem.teacherId.toString() != teacherID) return
		elem.date = DateFormat.fromYYYYMMDD(elem.date.toString())
		if (elem.date.getTime() < startDate.getTime() || elem.date.getTime() > endDate.getTime()) return
		for (var d = 0; d < days.length; d++) {
			if (days[d].date.getTime() == elem.date.getTime()) {
				days[d].push(elem)
				return
			}
		}
		var day = [elem]
		day.date = elem.date
		days.push(day)
	})
	var rG = $('#resultGrid')
	rG[0].style.visibility = 'visible'
	rG.empty()

	days.sort(function (a, b) {
		if (a.date.getTime() < b.date.getTime()) return -1
		if (a.date.getTime() > b.date.getTime()) return 1
		return 0
	})

	for (var d = 0; d < days.length; d++) {
		var day = days[d]
		var dayRow = $('<div>', {
			class: 'day',
			text: DateFormat.inDDDDMM(day.date)
		})
		day.sort(function (a, b) {
			if (a.uStartTime < b.uStartTime) return -1
			if (a.uStartTime > b.uStartTime) return 1
			return 0
		})
		$.each(day, function (i, _) {
			let elem = day[i]
			var entryClass = 'entry ' + (elem.available ? 'entry-available' : 'entry-unavailable')
			$('<div>', {
				class: entryClass
			})
				.on('click', function () {
					showPopup(elem)
				})
				.append(
					$('<p>', {
						class: 'teacher-name',
						text: elem.teacher
					})
				)
				.append(
					$('<span>', {
						class: 'consultaion-time',
						text: elem.startTime + ' - '
					})
				)
				.append(
					$('<span>', {
						class: 'consultaion-time',
						text: elem.endTime
					})
				)
				.appendTo(dayRow)
		})
		rG.append(dayRow)
	}
}

function showPopup(data) {
	var popup = $('#popup')
	popup.empty()
	$('<h2>', {
		style: 'grid-area: day',
		text: DateFormat.inDDDDMM(data.date)
	}).appendTo(popup)
	$('<p>', {
		style: 'grid-area: time; margin-bottom: 5px',
		class: 'description-small',
		text: data.startTime + ' - ' + data.endTime
	}).appendTo(popup)
	$('<b>', {
		text: 'Lehrer: '
	}).appendTo(popup)
	$('<button>', {
		class: 'button-link',
		click: function () {
			setTeacher(data.teacherId)
			searchConsultations()
		},
		text: data.teacherFullName
	}).appendTo(popup)
	$('<b>', {
		text: 'Email: '
	}).appendTo(popup)
	$('<a>', {
		text: NAFallback(data.email, '-'),
		href: `mailto:${data.email}`
	}).appendTo(popup)
	$('<b>', {
		text: 'Termin: '
	}).appendTo(popup)
	$('<p>', {
		text: data.textByNoAppointment
	}).appendTo(popup)
	$('<b>', {
		text: 'Verfügbar: '
	}).appendTo(popup)
	$('<p>', {
		text: data.available ? 'Ja' : 'Nein'
	}).appendTo(popup)
	if (navigator.onLine && data.available)
		$('<button>', {
			class: 'popup-button',
			text: 'Registrierung',
			click: async () => {
				data = await WebUntis.getConsultationRegInfo(data.periodId, data.teacherId)
				if (!data.exists) return
				showRegPopup(data.first)
			}
		}).appendTo(popup)
	popup.css('display', 'grid')
	popup[0].scrollIntoView()
	showPopup.data = data
	$('#regPopup').css('display', 'none')
}

function showRegPopup(data) {
	data = safeJSONParse(data)
	if (!data || !data.data) {
		console.warn('!data || !data.data')
		new Toast('Interner Fehler')
		return
	}
	data = data.data
	var popup = $('#regPopup')
	popup.empty()
	var isRegistered = false
	var select = $('<select>')
	for (var i = 0; i < data.timeSlots.length; i++) {
		var e = data.timeSlots[i]
		if (e.state != 'FREE' && e.state != 'SELF') continue
		select.append(
			$('<option>', {
				selected: e.state == 'SELF',
				value: JSON.stringify(e),
				text: DateFormat.inHHMM(DateFormat.fromUntisTime(e.startTime)) + ' - ' + DateFormat.inHHMM(DateFormat.fromUntisTime(e.endTime))
			})
		)
		if (e.state == 'SELF') isRegistered = true
	}
	popup.append(select)
	var textArea = $('<textarea>', {
		maxlength: 255,
		placeholder: 'Nachricht',
		text: data.userText
	})
	popup.append(textArea).append(
		$('<button>', {
			class: 'menu-button',
			text: 'Anmelden',
			click: () => {
				var selectedData = JSON.parse(select.val())
				ajax('/PHP/ajax.php', {
					body: `type=put&putType=consultationReg&period=${showPopup.data.periodId}&teacher=${showPopup.data.teacherId}&date=${data.date}&startTime=${
						selectedData.startTime
					}&endTime=${selectedData.endTime}&text=${textArea.val()}`,
					method: 'POST'
				})
					.then(() => {
						new Toast('Erfolgreich angemeldet', 1.5)
						popup.css('display', 'none')
					})
					.catch(() => {})
			}
		})
	)
	if (isRegistered)
		popup.append(
			$('<button>', {
				class: 'menu-button',
				text: 'Abmelden',
				click: () => {
					ajax('/PHP/ajax.php', {
						body: `type=put&putType=consultationUnreg&period=${showPopup.data.periodId}&teacher=${showPopup.data.teacherId}&text=${textArea.val()}`,
						method: 'POST'
					})
						.then(() => {
							new Toast('Erfolgreich abgemeldet', 1.5)
							popup.css('display', 'none')
						})
						.catch(() => {})
				}
			})
		)
	popup.css('display', 'grid')
	popup[0].scrollIntoView()
}
