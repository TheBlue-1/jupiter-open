class DataPopup {
	constructor(data, headline = null, subheadline = null, note = null, buttons = null, useForm = false, narrow = false) {
		DataPopup.popup.empty()
		var grid = $('<div>', {
			class: 'popup-grid'
		})
		if (headline) {
			headline = $('<h2>', {
				class: 'popup-headline',
				text: headline
			})
			grid.append(headline)
		}
		if (subheadline) {
			subheadline = $('<span>', {
				class: 'popup-subheadline',
				text: subheadline
			})
			grid.append(subheadline)
		}

		if (typeof data == 'string') grid.append($('<span>', {text: data}))
		else if (typeof data != 'object') {
		} else {
			$.each(data, (_, block) => {
				let firstExists = block[0] != ''
				let secondNotEmpty = block.length != 2 || block[1] != undefined
				if (firstExists && secondNotEmpty) {
					var first = $('<span>', {text: block[0], class: 'popup-description'})
					grid.append(first)
					if (block.length == 1) {
						//text only (full line) (text)
						first.addClass('popup-line')
						return
					}
				}
				if (block.length == 2) {
					if (secondNotEmpty) {
						if (typeof block[1] == 'string') {
							//text + text (text,text)
							grid.append($('<span>', {text: block[1], class: 'popup-text'}))
						} else {
							if (!firstExists) block[1].addClass('popup-line')
							grid.append(block[1])
						}
					}
					return
				}
				if (block.length == 3) {
					//text + link (text,text,link)
					grid.append($('<a>', {text: block[1], href: block[2], class: 'popup-link'}))
					return
				}
				if (block.length >= 5) {
					//(text) + control (text,controltype,value,placeholder,id,required,html,(additionals))
					let input
					if (DataPopup.inputTypes.includes(block[1]))
						input = $('<input>', {
							type: block[1]
						})
					else input = $('<' + block[1] + '>')

					if (!firstExists) input.addClass('popup-line')
					if (block[6]) input.html(block[6])
					if (block[2]) input.val(block[2])
					if (block[3]) input.prop('placeholder', block[3])
					if (block[4]) input.prop('id', block[4])
					if (block[5]) input.prop('required', block[5])
					if (block[7]) {
						$.each(block[7], (_, prop) => {
							input.prop(prop[0], prop[1])
						})
					}
					grid.append(input)
				}
			})
		}
		if (note) {
			note = $('<span>', {
				class: 'popup-note',
				html: note
			})
			grid.append(note)
		}
		if (buttons) {
			let pButtons = $('<div class="popup-buttons">')
			let makeButton = (buttons) => {
				let button = $('<button type="button">')
				button.text(buttons[0])
				button.click(buttons[1])
				pButtons.append(button)
			}

			if (Array.isArray(buttons[0])) {
				buttons.forEach((val) => {
					makeButton(val)
				})
			} else {
				makeButton(buttons)
			}

			grid.append(pButtons)
		}
		if (useForm) {
			let form = $('<form id="popupForm">')
			form.append(grid)
			grid = form
		}
		DataPopup.popup.append(grid)
		DataPopup.popup[0].className = 'popup'

		if (narrow) {
			DataPopup.popup.addClass('popup-narrow')
		} else {
			DataPopup.popup.addClass('popup-medium')
		}
		document.getElementById('closingWall').className = ''
	}
}
DataPopup.D = class Data {
	data = []
	elem(elem, text = '') {
		this.data.push([text, elem])
		return this
	}
	text(text) {
		this.data.push([text])
		return this
	}
	value(text, value) {
		this.data.push([text, value])
		return this
	}
	link(text, value, link) {
		this.data.push([text, value, link])
		return this
	}
	control(controltype, text = '', value = null, placeholder = null, id = null, required = false, inner = null, additionals = null) {
		this.data.push([text, controltype, value, placeholder, id, required, inner, additionals])
		return this
	}
	get() {
		return this.data
	}
}
DataPopup.D.A = class ControlAdditional {
	additionals = []
	a(prop, val) {
		this.additionals.push([prop, val])
		return this
	}
	g() {
		return this.additionals
	}
}
DataPopup.inputTypes = ['text', 'color', 'date', 'datetime-local', 'email', 'month', 'number', 'range', 'search', 'tel', 'time', 'url', 'week']
DataPopup.popup = $('#dataPopup')
function openLoginPopup() {
	let school = $(
		`<input list="schoolSuggestionBox" type="text" id="school" oninput="schoolInput(event)" onchange="schoolChange(event)" placeholder="Schule" onkeydown="logKeyPress(event, 'loginForm')" name="school" required>`
	)
	let user = $(`<input autocomplete="username" onkeydown="logKeyPress(event, 'loginForm')" type="text" id="username" placeholder="Benutzername" name="username">`)
	let password = $(
		`<input autocomplete="current-password" onkeydown="logKeyPress(event, 'loginForm')" type="password" id="password" placeholder="Passwort" name="password">`
	)
	let save = $(`<div class="checkbox" style="margin-left:auto"><input id="rememberMe" type="checkbox">  <label for="rememberMe"></label></div>`)
	let agb = `Durch die Anmeldung stimmen Sie unseren <a href="/agb">AGB</a> zu.`
	let loader = $(`<div id="loginLoader" class="loader"></div>`)
	let data = new DataPopup.D().elem(school).elem(user).elem(password).elem(save, 'Logindaten speichern').elem(loader).get()

	new DataPopup(data, 'Anmeldung', null, agb, ['Login', login], true, true)
	document.getElementById('school').focus()
}
function closeWindows(id = null) {
	if (id) {
		var popup = document.getElementById(id)
		if (popup && popup.className != 'inv') {
			popup.className = 'inv'
			document.getElementById('closingWall').className = 'inv'
			return true
		}
		return false
	} else {
		var popups = [...document.getElementsByClassName('popup')]
		popups.forEach((popup) => {
			popup.className = 'inv'
		})
		document.getElementById('closingWall').className = 'inv'
	}
}
async function lessonPopup(lesson, date, secondCall = false) {
	if (secondCall) {
		await lesson.day.loadTeacherNames()
	}
	var bes = ''
	if (lesson.state.isExam) bes += 'Test, '
	if (lesson.state.isEvent) bes += 'Event, '
	if (lesson.state.isCancelled) bes += 'Ausfall, '
	if (lesson.state.isShift) bes += 'Verschiebung, '
	if (lesson.state.isSubstitution) bes += 'Ersatz, '
	if (lesson.state.isAdditional) bes += 'Zusatz, '
	if (lesson.state.isFree) bes += 'Keine Schule, '
	if (lesson.state.isRoomSubstitution) bes += 'Raumänderung, '
	if (lesson.state.isOfficeHour) bes += 'Sprechstunde, '
	if (!lesson.state.isStandard && bes == '') bes += 'Unbekannt (' + toLetterCase(lesson.state.name) + '), '
	if (bes.endsWith(', ')) bes = bes.slice(0, -2)

	var subHeading = DateFormat.inDDMMYYYY(lesson.day.date, '. ')
	var heading = DateFormat.inHHMM(lesson.start()) + ' - ' + DateFormat.inHHMM(lesson.end())
	var data = []

	let dateStr = DateFormat.inYYYYMMDD(date, '')

	lesson.subjects.forEach(function (subject) {
		data.push(['Fach:', subject.fullname(), '/table#date=' + dateStr + '&type=subject&id=' + subject.id])
	})
	lesson.rooms.forEach(function (room) {
		data.push(['Raum:', room.fullname(), '/table#date=' + dateStr + '&type=room&id=' + room.id])
	})
	lesson.teachers.forEach(function (teacher) {
		data.push(['Lehrer:', teacher.fullname(), '/table#date=' + dateStr + '&type=teacher&id=' + teacher.id])
	})
	lesson.groups.forEach(function (group) {
		data.push(['Gruppe:', group.fullname(), '/table#date=' + dateStr + '&type=class&id=' + group.id])
	})
	if (bes != '') data.push(['Besonderes:', bes])
	if (lesson.text) data.push(['Text:', lesson.text])

	new DataPopup(data, heading, subHeading)
	if (!secondCall) lessonPopup(lesson, date, true)
}
function rolePopup(elem) {
	new DataPopup(
		[
			['Name', elem.foreName + ' ' + elem.longName],
			['Von', DateFormat.inDDMMYYYY(DateFormat.fromYYYYMMDD(elem.startDate), '. ')],
			['Bis', DateFormat.inDDMMYYYY(DateFormat.fromYYYYMMDD(elem.endDate), '. ')],
			['Text', elem.text],
			['Klasse', elem.klasse.name]
		],
		elem.duty.label
	)
}

function examPopup(elem) {
	var data = []

	data.push(['Name', elem.title])
	data.push(['Name', elem.name])
	data.push(['Typ', elem.examType])
	data.push(['Fach', elem.subject])
	if (elem.rooms && elem.rooms[0]) data.push(['Raum/Räume', elem.rooms.join(', ')])
	if (elem.teachers && elem.teachers[0]) data.push(['Lehrer', elem.teachers.join(', ')])
	data.push(['Beschreibung', elem.description])
	data.push(['Zuletzt bearbeitet von', elem.lastEditBy])

	if (elem.ownerType && ((typeof isAdmin != 'undefined' && elem.ownerType == 2) || elem.ownerType == 1 || (me.adminName && elem.ownerType == 3)))
		var button = ['Bearbeiten', editCurrentEvent.bind(this, elem)]

	let date = typeof elem.startTime == 'string' ? new Date(parseInt(elem.startTime)) : DateFormat.fromYYYYMMDD(elem.examDate)
	let start = typeof elem.startTime == 'string' ? new Date(parseInt(elem.startTime)) : DateFormat.fromUntisTime(elem.startTime)
	let end = typeof elem.endTime == 'string' ? new Date(parseInt(elem.endTime)) : DateFormat.fromUntisTime(elem.endTime)

	new DataPopup(
		data,
		'Test',
		DateFormat.inDDDDMM(date, '. ') + ' ' + DateFormat.inHHMM(start) + ' - ' + DateFormat.inHHMM(end),
		undefined,
		button ? button : undefined,
		undefined,
		false
	)
}
function homeworkPopup(elem, data) {
	const lesson = data.lessons.find((l) => l.id === elem.lessonId)
	const record = data.records.find((r) => r.homeworkId === elem.id)
	const teacher = data.teachers.find((t) => t.id === record.teacherId)

	const popupData = [
		['Beschreibung', elem.text || ''],
		['Abgegeben', elem.completed ? '✓' : '✗'],
		['Fach', toLetterCase(lesson.subject)],
		['Lehrer', toLetterCase(teacher.name)],
		['Bemerkung', elem.remark || '']
	]

	new DataPopup(popupData, toLetterCase(lesson.subject), 'Bis ' + DateFormat.inDDDDMM(DateFormat.fromYYYYMMDD(elem.dueDate)), undefined, undefined, undefined, false)
}
function customHomeworkPopup(elem, data) {
	var data = []
	data.push(['Beschreibung', elem.description])
	data.push(['Zuletzt bearbeitet von', elem.lastEditBy])
	if (elem.ownerType && ((typeof isAdmin != 'undefined' && elem.ownerType == 2) || elem.ownerType == 1 || (me.adminName && elem.ownerType == 3)))
		var button = ['Bearbeiten', editCurrentEvent.bind(this, elem)]
	new DataPopup(data, elem.title, DateFormat.inDDMMYYYYHHMM(new Date(parseInt(elem.endTime)), '. '), undefined, button ? button : undefined, undefined, false)
}
function customEventPopup(elem) {
	var data = []
	data.push(['Beschreibung', elem.description])
	data.push(['Zuletzt bearbeitet von', elem.lastEditBy])
	if (elem.ownerType && ((typeof isAdmin != 'undefined' && elem.ownerType == 2) || elem.ownerType == 1 || (me.adminName && elem.ownerType == 3)))
		var button = ['Bearbeiten', editCurrentEvent.bind(this, elem)]
	new DataPopup(data, elem.title, 'Bis ' + DateFormat.inDDMMYYYYHHMM(new Date(parseInt(elem.endTime)), '. '), undefined, button ? button : undefined, undefined, false)
}

function editCurrentEvent() {}
function holidayPopup(elem) {
	new DataPopup(
		[['Name', elem.longName]],
		'Ferien',
		DateFormat.inDDDDMM(DateFormat.fromYYYYMMDD(elem.startDate)) + ' - ' + DateFormat.inDDDDMM(DateFormat.fromYYYYMMDD(elem.endDate))
	)
}

function renamePopup(onSave) {
	new DataPopup(
		new DataPopup.D().control('text', undefined, undefined, 'Name', 'newTableName').get(),
		'Neuer Name',
		undefined,
		undefined,
		['Speichern', onSave],
		undefined,
		true
	)
}
function tablePopup() {
	let select = $(
		'<select id="tabletype" onchange="tableTypeChange(this)"><option disabled selected>Typ wählen</option>	<option value="1">Klasse</option>	<option value="2">Lehrer</option>	<option value="3">Fach</option>	<option value="4">Raum</option><option value="5">Schüler</option></select>'
	)
	let select2 = $('<select id="tableid">	<option disabled selected>Namen wählen</option></select>')
	new DataPopup(new DataPopup.D().elem(select).elem(select2).get(), undefined, undefined, undefined, ['Speichern', saveTable])
}

function starPopup(onSave) {
	new DataPopup(
		new DataPopup.D().control('text', undefined, undefined, 'Name', 'starName').get(),
		'Verknüpfungsname',
		undefined,
		undefined,
		['Speichern', onSave],
		undefined,
		true
	)
}
function editEventPopup(date = null, elemToEdit = {}) {
	let inTypeSelect = '<option value= "0"> Standard </option><option value= "1">  Hausübung </option><option value= "2">Test</option>'
	let inOwnerSelect = '<option value="1">Niemanden</option>'
	if (isAdmin && classId) {
		inOwnerSelect += '<option value= "2" >Meiner Klasse</option>'
	}
	let deleteEvent = function () {
		if (!confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen wollen?')) return
		ajax('/PHP/ajax.php', {
			method: 'POST',
			body: 'type=put&putType=deleteEvent&id=' + elemToEdit.id
		})
			.then(() => {
				closeWindows()
				new Toast('Erfolgreich Gelöscht')
				loadData()
			})
			.catch(() => {})
	}
	let buttons = [
		[
			'OK',
			() => {
				var form = $('#popupForm')
				if (!form[0].checkValidity()) {
					form[0].reportValidity()
					return
				}
				var type = $('#newEventType').val()
				var ownerType = $('#newEventOwnerType').val()
				var owner = ownerType == 1 ? me.userName : classId
				var title = $('#newEventTitle').val() || 'Kein Titel'
				var description = $('#newEventDescription').val()
				var startTime = DateFormat.fromHHMM($('#newEventStartTime').val())
				var endTime = DateFormat.fromHHMM($('#newEventEndTime').val())
				var date = DateFormat.fromYYYYMMDD($('#newEventDate').val())
				var startDate = new Date(date)
				startDate.setHours(startTime.getHours())
				startDate.setMinutes(startTime.getMinutes())
				startDate = startDate.getTime()
				var endDate = new Date(date)
				endDate.setHours(endTime.getHours())
				endDate.setMinutes(endTime.getMinutes())
				endDate = endDate.getTime()
				if (elemToEdit.id) {
					ajax('/PHP/ajax.php', {
						method: 'POST',
						body:
							'type=put&putType=editEvent&id=' +
							elemToEdit.id +
							'&startTime=' +
							startDate +
							'&endTime=' +
							endDate +
							'&owner=' +
							owner +
							'&ownerType=' +
							ownerType +
							'&title=' +
							title +
							'&description=' +
							description +
							'&eventType=' +
							type
					})
						.then(() => {
							closeWindows()
							new Toast('Erfolgreich Geändert')
							loadData()
						})
						.catch(() => {})
					return
				}
				ajax('/PHP/ajax.php', {
					method: 'POST',
					body:
						'type=put&putType=addEvent&startTime=' +
						startDate +
						'&endTime=' +
						endDate +
						'&owner=' +
						owner +
						'&ownerType=' +
						ownerType +
						'&title=' +
						title +
						'&description=' +
						description +
						'&eventType=' +
						type
				})
					.then(() => {
						closeWindows()
						new Toast('Erfolgreich Hinzugefügt')
						loadData()
					})
					.catch(() => {})
			}
		]
	]
	if (elemToEdit.id) {
		buttons.unshift(['Löschen', deleteEvent])
	}
	let data = new DataPopup.D()
		.control('text', undefined, elemToEdit.title, 'Titel', 'newEventTitle', true)
		.control(
			'date',
			'Datum',
			date ? DateFormat.inYYYYMMDD(date, '-') : elemToEdit.startTime ? DateFormat.inYYYYMMDD(new Date(parseInt(elemToEdit.startTime)), '-') : undefined,
			undefined,
			'newEventDate',
			true
		)
		.control(
			'time',
			'Von',
			elemToEdit.startTime ? DateFormat.inHHMM(new Date(parseInt(elemToEdit.startTime)), ':') : '00:00',
			undefined,
			'newEventStartTime',
			true,
			undefined,
			['onchange', fixStartAndEndTime]
		)
		.control(
			'time',
			'Bis',
			elemToEdit.endTime ? DateFormat.inHHMM(new Date(parseInt(elemToEdit.endTime)), ':') : '23:59',
			undefined,
			'newEventEndTime',
			true,
			undefined,
			['onchange', fixStartAndEndTime]
		)
		.control('select', 'Typ', elemToEdit.type ? elemToEdit.type : '0', undefined, 'newEventType', undefined, inTypeSelect)
		.control('select', 'Teilen Mit', elemToEdit.ownerType ? elemToEdit.ownerType : '1', undefined, 'newEventOwnerType', undefined, inOwnerSelect)
		.control('textarea', undefined, elemToEdit.description, 'Text...', 'newEventDescription', undefined, undefined, ['rows', '5'])
		.get()
	new DataPopup(data, undefined, undefined, undefined, buttons, true, false)
}
