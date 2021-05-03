/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

onLogin = init
forceLogin()

searchLists = {}
showFreeRooms = false
freeRoomsDateTime = $('#freeRoomsDateTime')
freeRooms = null
onLoad(function () {
	$('#contentWrapper')[0].onwheel = null
})

function init() {
	resetAccordion('classes')
	resetAccordion('rooms')
	resetAccordion('teachers')
	resetAccordion('students')
	let d = new Date()
	d = new Date(d.setDate(d.getDate() + 14))
	WebUntis.getGroups(d).then((data) => {
		if (!data.exists) return
		data = data.first
		loadData(JSON.parse(data), 'classes', 'class')
	})
	WebUntis.getRooms(d).then((data) => {
		if (!data.exists) return
		data = data.first
		init.roomData = JSON.parse(data)
		loadData(init.roomData, 'rooms', 'room')
	})
	WebUntis.getTeachers(d).then((data) => {
		if (!data.exists) return
		data = data.first
		data = JSON.parse(data)
		if (data && data.data && data.data.elements) {
			data.data.elements.forEach((t) => {
				if (!t.displayname || (t.forename && t.longName)) {
					t.displayname = [t.forename, t.longName, t.name ? `(${t.name})` : null].filter((s) => !!s).join(' ')
				}
			})
		}
		loadData(data, 'teachers', 'teacher')
	})
	WebUntis.getStudents(d).then((data) => {
		if (!data.exists) return
		data = data.first
		loadData(JSON.parse(data), 'students', 'student')
	})

	let now = new Date()
	loadFreeRooms(now)
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
	freeRoomsDateTime.val(now.toISOString().slice(0, -8))
	return true
}
function editFreeRoomsDateTime(e) {
	loadFreeRooms(new Date(freeRoomsDateTime.val()))
	if (showFreeRooms) {
		loadData(init.roomData, 'rooms', 'room')
		search('rooms')
	}
}
function loadFreeRooms(d) {
	let d1 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()))
	WebUntis.getAvailableRooms(d1, d1).then((data) => {
		if (!data.exists) return
		data = data.first
		freeRooms = JSON.parse(data).result.roomIds
	})
}

function resetAccordion(accId) {
	$('#' + accId)
		.children('.item')
		.remove()
	$('#' + accId + '_data').empty()
}

async function search(accId) {
	var input = $('#' + accId + '_search')
	var inputText = input.val().toLowerCase()
	var searchList = searchLists[accId]

	await searchList.forEach(function (kvp) {
		if (kvp[0].indexOf(inputText) !== -1) {
			kvp[1].style.display = 'block'
		} else {
			kvp[1].style.display = 'none'
		}
	})
}

function loadData(data, accId, dataType) {
	if (data == null || data.data == null) return
	data = data.data
	data.elements.sort(function (a, b) {
		if (a.displayname < b.displayname) return -1
		if (a.displayname > b.displayname) return 1
		return 0
	})
	var panel = $('#' + accId)
	panel.children('.item').remove()

	var searchList = []
	data.elements.forEach(function (e) {
		if (dataType == 'room' && showFreeRooms == true) {
			if (!freeRooms.includes(e.id)) return
		}

		var elem = $('<a>', {
			class: 'item',
			text: e.displayname,
			href: `${location.origin}/table#type=${dataType}&id=${e.id}`
		})
		panel.append(elem)
		searchList.push([e.displayname.toLowerCase().replace(/[\ufff0-\uffff]|[\u0000-\u001f]|[\u007f-\u009f]/g, ''), elem[0]])
	})
	searchLists[accId] = searchList
}

function addPanel(accordeon) {
	var panel = $('<div>', {
		class: 'panel'
	})
	accordeon.append(panel)
	return panel
}

function showAvailableChange() {
	showFreeRooms = $('#showAvailable')[0].checked
	loadData(init.roomData, 'rooms', 'room')
	search('rooms')
}
