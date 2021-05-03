/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */
// ist home.js
onLogin = init
forceLogin()
var periodSkeleton
var boxPositions
var tableDays
var dragClickTarget
var boxEditMode = false
var drake
var boxes
var today
function init() {
	today = DateFormat.toFullDay(new Date())
	var toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
	initDaD()
	positionBoxes()
	loadTableDays()
	loadSavedTables()
	loadHomeworks(toDate)
	loadRoles(toDate)
	loadNews(toDate)
	loadAbsence()
	loadUpdateNews()
	loadExams(toDate)
	loadAlwaysOn()
	size()
	return true
}

size = function () {
	if (!boxEditMode) {
		if (!boxPositions) positionBoxes()
		var winWidht = window.innerWidth
		var count = colCount(winWidht)
		for (var i = 1; i < 9; i++) {
			var spalte = ((i - 1) % count) + 1
			for (var j = 0; j < boxPositions[i].length; j++) {
				$('#col' + spalte).append(boxes[boxPositions[i][j]])
			}
		}
	} else positionBoxes()
}
function colCount(width) {
	if (width < 597) {
		return 1
	}
	if (width < 894) {
		return 2
	}
	if (width < 1191) {
		return 3
	}
	if (width < 1488) {
		return 4
	}
	if (width < 1785) {
		return 5
	}
	if (width < 2082) {
		return 6
	}
	if (width < 2379) {
		return 7
	}
	return 8
}
function loadAlwaysOn() {
	loadAlwaysOn.setBatteryIcon = function (state) {
		var icon = $('#chargingIcon')
		if (state) {
			icon.css('display', '')
		} else {
			icon.css('display', 'none')
		}
	}
	loadAlwaysOn.setBatteryLevel = function (level) {
		$('#batteryLevel').css('width', level * 100 + '%')
		$('#batteryLevelPercent').text((level * 100).toFixed(0))
	}
	if (navigator.getBattery) {
		navigator.getBattery().then(function (battery) {
			loadAlwaysOn.setBatteryLevel(battery.level)
			loadAlwaysOn.setBatteryIcon(battery.charging)
			battery.addEventListener('chargingchange', function () {
				loadAlwaysOn.setBatteryIcon(battery.charging)
			})

			battery.addEventListener('levelchange', function () {
				loadAlwaysOn.setBatteryLevel(battery.level)
			})
		})
	} else {
		$('#batteryIcon').hide()
	}

	var fullscreenchange = function () {
		if (!isFullScreen()) toggleAlwaysOn(false)
	}

	if (document.onfullscreenchange !== undefined) document.onfullscreenchange = fullscreenchange
	else if (document.onwebkitfullscreenchange !== undefined) document.onwebkitfullscreenchange = fullscreenchange
	else if (document.onmozfullscreenchange !== undefined) document.onmozfullscreenchange = fullscreenchange

	var now
	var alwaysOnClock = $('#alwaysOnClock')
	loadAlwaysOn.updateClock = function () {
		now = new Date()
		alwaysOnClock.text(DateFormat.inHHMM(now))
	}
	now = new Date()
	setTimeout(function () {
		now = new Date()
		setInterval(loadAlwaysOn.updateClock, 60 * 1000)
		alwaysOnClock.text(DateFormat.inHHMM(now))
	}, 60001 - now.getSeconds() * 1000 - now.getMilliseconds())
	loadAlwaysOn.updateClock()
}

function toggleAlwaysOn(state = null) {
	var overlay = $('#alwaysOnOverlay')
	if (state === true || (state !== false && overlay.css('display') == 'none')) {
		overlay.css('display', '')
		requestFullscreen(overlay[0])
		if (navigator.requestWakeLock) {
			toggleAlwaysOn.wakeLock = navigator.requestWakeLock('screen')
			console.log('Used navigator.requestWakeLock to lock')
		} else if (navigator.getWakeLock) {
			navigator.getWakeLock('screen').then(function (wl) {
				toggleAlwaysOn.wakeLock = wl.createRequest()
			})
			console.log('Used navigator.getWakeLock to lock')
		} else if (screen.keepAwake !== undefined) {
			screen.keepAwake = true
			console.log('Used screen.keepAwake to lock')
		} else if (navigator.wakeLock && navigator.wakeLock.request) {
			navigator.wakeLock.request('screen').then((wl) => (toggleAlwaysOn.wakeLock = wl))
			console.log('Used navigator.wakLock.request to lock')
		} else {
			toggleAlwaysOn.wakeLock = new NoSleep()
			toggleAlwaysOn.wakeLock.enable()
			console.log('Used NoSleep to lock')
		}
	} else {
		overlay.css('display', 'none')
		if (toggleAlwaysOn.wakeLock) {
			if (toggleAlwaysOn.wakeLock.unlock) {
				toggleAlwaysOn.wakeLock.unlock()
			} else if (toggleAlwaysOn.wakeLock.cancel) {
				toggleAlwaysOn.wakeLock.cancel()
			} else if (toggleAlwaysOn.wakeLock.disable) {
				toggleAlwaysOn.wakeLock.disable()
			} else if (toggleAlwaysOn.wakeLock.release) {
				toggleAlwaysOn.wakeLock.release()
			}
		} else if (screen.keepAwake !== undefined) screen.keepAwake = false
		else if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.release('display')
		toggleAlwaysOn.isFullscreen = false
		closeFullscreen(overlay[0])
	}
}

async function loadExams(toDate) {
	var startDate = today
	var data = [await WebUntis.getExams(startDate, toDate), await WebUntis.getJupiterEvents(startDate.getTime(), toDate.getTime(), '2')]
	if (!data[0].exists || !data[1].exists) return
	data[0] = data[0].first
	data[1] = data[1].first
	var untisData = data[0]
	untisData = safeJSONParse(untisData)
	var exams = $('#exams')
	exams.children('p.list-text').remove()
	if (!untisData || !untisData.data) {
		console.warn('Cannot load untis exams')
		new Toast('Interner Fehler')
	} else {
		untisData = untisData.data
		$.each(untisData.exams, function (_, elem) {
			var dstr = DateFormat.inDDDDMM(DateFormat.fromYYYYMMDD(elem.examDate))
			exams.append(
				$('<p>', {
					class: 'list-text',
					click: () => {
						examPopup(elem)
					}
				})
					.append(
						$('<b>', {
							text: elem.subject + ':'
						})
					)
					.append($('<br>'))
					.append(
						$('<b>', {
							text: 'Text: '
						})
					)
					.append(
						$('<span>', {
							text: elem.name
						})
					)
					.append($('<br>'))
					.append(
						$('<b>', {
							text: 'Typ: '
						})
					)
					.append(
						$('<span>', {
							text: elem.examType
						})
					)
					.append($('<br>'))
					.append(
						$('<b>', {
							text: 'Am: '
						})
					)
					.append(
						$('<span>', {
							text: dstr
						})
					)
			)
		})
	}

	var jptrData = data[1]
	jptrData = safeJSONParse(jptrData)
	if (!jptrData || !jptrData.data) {
		console.warn('Cannot load jptr exam data')
		new Toast('Interner Fehler')
	} else {
		jptrData = jptrData.data
		$.each(jptrData.events, function (_, elem) {
			var dstr = DateFormat.inDDDDMM(new Date(parseInt(elem.endTime)))
			exams.append(
				$('<p>', {
					class: 'list-text',
					click: () => {
						examPopup(elem)
					}
				})
					.append(
						$('<b>', {
							text: elem.title + ':'
						})
					)
					.append($('<br>'))
					.append(
						$('<b>', {
							text: 'Text: '
						})
					)
					.append(
						$('<span>', {
							text: elem.description
						})
					)
					.append($('<br>'))
					.append(
						$('<b>', {
							text: 'Am: '
						})
					)
					.append(
						$('<span>', {
							text: dstr
						})
					)
			)
		})
	}
}

function loadUpdateNews() {
	ajax('/PHP/ajax.php', {
		body: 'type=get&getType=versionHistory',
		method: 'POST',
		success: function (data) {
			if (data != null && data != '') {
				var p = $('<p></p>')
				p.html(data)
				var news = $('#updateNews')
				news.children('p').remove()
				news.append(p)
			}
		}
	})
		.then(async (resp) => {
			const data = await resp.text()
			if (data != null && data != '') {
				var p = $('<p></p>')
				p.html(data)
				var news = $('#updateNews')
				news.children('p').remove()
				news.append(p)
			}
		})
		.catch(() => {})
}

function toggleBoxEditMode(event) {
	boxEditMode = event.target.checked
	if (boxEditMode) {
		document.documentElement.style.overscrollBehaviorY = 'contain'
		document.body.style.overscrollBehaviorY = 'contain'
		$('.panel-column').addClass('panel-column-edit')
		$('#hiddenPanels').css({
			'display': 'block',
			'opacity': 0.5,
			'pointer-events': 'auto'
		})
		size()
		$('#panels').addClass('edit-mode-panel-color')
	} else {
		document.documentElement.style.overscrollBehaviorY = ''
		document.body.style.overscrollBehaviorY = ''
		$('#hiddenPanels').css({
			'display': '',
			'opacity': '',
			'pointer-events': ''
		})
		$('.panel-column').removeClass('panel-column-edit')
		size()
		$('#panels').removeClass('edit-mode-panel-color')
	}
}

async function loadRoles(weekEndDate) {
	var data = await WebUntis.getRoles(today, today)
	if (!data.exists) return
	data = data.first
	data = safeJSONParse(data)
	if (!data || !data.data) return
	data = data.data
	var rls = $('#roles')
	rls.children('p.list-text').remove()
	$.each(data.classRoles, function (index, elem) {
		var role = $('<p>')
		role.text(elem.duty.label + ': ' + elem.foreName + ' ' + elem.longName)
		role.addClass('list-text')
		role.click(() => {
			rolePopup(elem)
		})
		rls.append(role)
	})
}

function positionBoxes() {
	boxes = $('.box-wrapper')
	var newBoxes = []
	$.each(boxes, (_, box) => {
		newBoxes[box.getAttribute('data-index')] = box
	})
	boxes = newBoxes

	var panels = []

	var invisPanels = $('#hiddenPanels')
	$('#boxes').children('.box-wrapper').remove()

	var orderJSON = localStorage.getItem('boxPositions')
	if (orderJSON == null) {
		boxPositions = []
		var x = boxes.length / 8
		boxPositions[0] = []
		for (var i = 1; i < 9; i++) {
			boxPositions[i] = []
			var c = 0
			for (var j = parseInt(x * (i - 1)); j < parseInt(x * i); j++) {
				boxPositions[i][c] = j
				c++
			}
		}
	} else boxPositions = safeJSONParse(orderJSON)

	var usedBoxes = []
	$.each(boxPositions, (index, arr) => {
		if (index > 0) {
			panels[index] = $('#col' + index)
		}
		$.each(arr, (_, val) => {
			if (index == 0) invisPanels.append(boxes[val])
			else panels[index].append(boxes[val])
			usedBoxes.push(val)
		})
	})

	$.each(boxes, (index, box) => {
		if (!usedBoxes.includes(index)) {
			panels[1].append(box)
			boxPositions[1].push(index)
		}
	})

	console.log('boxPositions: ')
	console.log(boxPositions)
	localStorage.setItem('boxPositions', JSON.stringify(boxPositions))
}
function appInstallToHidden() {
	$.each(boxPositions, (index, col) => {
		if (col.includes(11)) {
			col.splice(col.indexOf(11))
			return false
		}
	})
	boxPositions[0].push(11)

	localStorage.setItem('boxPositions', JSON.stringify(boxPositions))
	positionBoxes()
	size()
}

function edgeScroll(dir) {
	if (edgeScroll.enabled && dir == 0) {
		edgeScroll.enabled = false
		cancelAnimationFrame(edgeScroll.raf)
	} else if (!edgeScroll.enabled && dir != 0) {
		edgeScroll.enabled = true
		const cW = $('#contentWrapper')[0]
		function loop() {
			if (!edgeScroll.enabled) return
			edgeScroll.raf = requestAnimationFrame(loop)
			cW.scrollTop += (dir * 500) / 60
		}
		loop()
	}
}

function initDaD() {
	drake = dragula([$('#col1')[0], $('#col2')[0], $('#col3')[0], $('#col4')[0], $('#col5')[0], $('#col6')[0], $('#col7')[0], $('#col8')[0], $('#hiddenPanels')[0]], {
		invalid: function (el, handle) {
			return !(boxEditMode && handle.classList.contains('drag-handle'))
		}
	})

	initDaD.onDrop = function (el, target, src) {
		var srcCol = src.id == 'hiddenPanels' ? 0 : src.id.slice(3)
		var targetCol = target.id == 'hiddenPanels' ? 0 : target.id.slice(3)
		var id = parseInt(el.getAttribute('data-index'))
		boxPositions[srcCol].splice(boxPositions[srcCol].indexOf(id), 1)
		var number = 0
		$.each($(target).find('.box-wrapper'), function (index, elem) {
			if (elem.getAttribute('data-index') == id) {
				number = index
				return false
			}
		})
		boxPositions[targetCol].splice(number, 0, id)
		localStorage.setItem('boxPositions', JSON.stringify(boxPositions))
	}

	initDaD.onDrag = function () {
		initDaD.isDragging = true
	}

	drake
		.on('drag', initDaD.onDrag)
		.on('drop', initDaD.onDrop)
		.on('dragend', () => {
			initDaD.isDragging = false
			edgeScroll(0)
		})

	var cW = $('#contentWrapper')
	cW.on('touchmove', function (e) {
		if (initDaD.isDragging === true) {
			var touch = e.touches[0]
			if (touch.clientY >= window.innerHeight * 0.85) {
				var scrollTop = cW[0].scrollTop
				if (scrollTop < cW[0].scrollHeight - cW[0].clientHeight) edgeScroll(1)
			} else if (touch.clientY <= window.innerHeight * 0.2) {
				var scrollTop = cW[0].scrollTop
				if (scrollTop > 0) edgeScroll(-1)
			} else {
				edgeScroll(0)
			}
			if (e.cancelable) e.preventDefault()
		} else {
			edgeScroll(0)
		}
	})
	cW.on('touchend', function () {
		edgeScroll(0)
	})
	window.addEventListener('mousemove', function (e) {
		if (initDaD.isDragging === true) {
			var touch = e
			if (touch.clientY >= window.innerHeight * 0.85) {
				var scrollTop = cW[0].scrollTop
				if (scrollTop < cW[0].scrollHeight - cW[0].clientHeight) edgeScroll(1)
			} else if (touch.clientY <= window.innerHeight * 0.2) {
				var scrollTop = cW[0].scrollTop
				if (scrollTop > 0) edgeScroll(-1)
			} else {
				edgeScroll(0)
			}
			if (e.cancelable) e.preventDefault()
		} else {
			edgeScroll(0)
		}
	})
	window.addEventListener('mouseup', function () {
		edgeScroll(0)
	})
}

async function loadTableDays() {
	if (!me.stid) return
	tableDays = await getTimetableDays('student', me.stid, DateFormat.addDays(new Date(), -6), DateFormat.addDays(new Date(), 6)).catch((_) =>
		getTimetableDays('student', me.stid, DateFormat.toMonday(new Date()), DateFormat.addDays(DateFormat.toMonday(new Date()), 6))
	)
	setNearLessonData()
	if (updateNearLessonDisplay.interval) clearInterval(updateNearLessonDisplay.interval)
	updateNearLessonDisplay.interval = setInterval(updateNearLessonDisplay, 1000)
	updateNearLessonDisplay()
}

function loadSavedTables() {
	var saves = localStorage.getItem('savedTables')
	if (saves == null) return

	saves = safeJSONParse(saves)
	if (!saves) {
		localStorage.removeItem('savedTables')
		return
	}

	var tableList = $('#savedTables')
	tableList.children('div.menu-button').remove()
	$.each(saves, function (index, elem) {
		let indexLet = index
		tableList.append(
			$('<div>', {
				class: 'menu-button editable saved-table'
			})
				.append(
					$('<a>', {
						class: 'link-button',
						href: '/table/' + indexLet,
						text: escapeHtml(elem)
					})
				)
				.append(
					$('<button>')
						.click(function () {
							editSavedTable(indexLet)
						})
						.append(
							$('<span>', {
								class: 'edit-icon'
							})
						)
				)
		)
	})
}

function editSavedTable(hash) {
	renamePopup(() => {
		var saves = localStorage.getItem('savedTables')
		if (saves == null) {
			saves = {}
		} else saves = safeJSONParse(saves)

		if (!saves) {
			localStorage.removeItem('savedTables')
			return
		}

		var name = input.val()
		if (name != null) {
			saves[hash] = escapeHtml(name)
			localStorage.setItem('savedTables', JSON.stringify(saves))
			loadSavedTables()
		}

		closeWindows('dataPopup')
		new Toast('Gespeichert')
	})
	var input = $('#newTableName')
	input.val('')
	input.focus()
}

async function loadNews(toDate) {
	var data = await WebUntis.getNews(undefined)
	if (!data.exists) return
	data = data.first
	data = safeJSONParse(data)
	if (!data || !data.data) return
	data = data.data
	var news = $('#schoolInfo')
	news.children('p').remove()
	$.each(data.messagesOfDay, function (index, elem) {
		news.append('<p>' + elem.subject + '<br>' + elem.text + '</p>')
	})

	var sysNews = $('#systemInfo')
	sysNews.children('p').remove()
	if (data.systemMessage) {
		sysNews.append("<p style='font-size: 10pt'>" + data.systemMessage + '</p>')
	}
}

async function loadHomeworks(toDate) {
	var startDate = today
	var data = [await WebUntis.getHomeworks(startDate, toDate), await WebUntis.getJupiterEvents(startDate.getTime(), toDate.getTime(), '1')]
	if (!data[0].exists && !data[1].exists) return

	var hws = $('#homeworks')
	if (data[0].exists) {
		data[0] = data[0].first

		var untisData = safeJSONParse(data[0])
		hws.children('p.list-text').remove()
		if (!untisData || !untisData.data) {
			console.warn('Cannot load untis homework data')
			new Toast('Interner Fehler')
		} else {
			untisData = untisData.data
			$.each(untisData.homeworks, function (index, e) {
				var lesson
				$.each(untisData.lessons, function (_, l) {
					if (l.id == e.lessonId) {
						lesson = l
						return false
					}
				})
				var date = DateFormat.fromYYYYMMDD(e.dueDate)
				var dstr = DateFormat.inDDDDMM(date)
				var homework = $('<p>')
				homework.addClass('list-text')
				homework.html('<b>' + toLetterCase(lesson.subject) + ': </b><br>' + e.text + '<br><b>Bis: </b>' + dstr)
				homework.click(() => homeworkPopup(e, untisData))
				hws.append(homework)
			})
		}
	}
	if (data[1].exists) {
		data[1] = data[1].first
		var jptrData = safeJSONParse(data[1])
		if (!jptrData || !jptrData.data) {
			console.warn('Cannot load jptr homework data')
			new Toast('Interner Fehler')
		} else {
			jptrData = jptrData.data
			$.each(jptrData.events, function (_, elem) {
				var dstr = DateFormat.inDDDDMM(new Date(parseInt(elem.endTime)))
				hws.append(
					$('<p>', {
						class: 'list-text',
						click: () => {
							homeworkPopup(elem)
						}
					})
						.append(
							$('<b>', {
								text: elem.title + ':'
							})
						)
						.append($('<br>'))
						.append(
							$('<p>', {
								text: elem.description
							})
						)
						.append(
							$('<b>', {
								text: 'Bis: '
							})
						)
						.append(
							$('<span>', {
								text: dstr
							})
						)
				)
			})
		}
	}
}

function setNearLessonData() {
	var currentDayIndex = tableDays.currentDayIndex()
	var currentPeriod = tableDays[currentDayIndex].periodAt() //0 vor erster stunde , -1 nach letzter stunde , int pause (momentane position) , period period
	var nextPeriod = tableDays[currentDayIndex].periodAt(undefined, 1) // -1 nichts mehr gefunden
	for (var i = currentDayIndex + 1; 1 > nextPeriod && i < tableDays.length; i++) {
		nextPeriod = tableDays[i].periodAt(0, 1)
	}
	var lastPeriod = tableDays[currentDayIndex].periodAt(undefined, -1) //0 nichts mehr gefunden
	for (var i = currentDayIndex - 1; 1 > lastPeriod && i >= 0; i--) {
		lastPeriod = tableDays[i].periodAt(PeriodInfo.periods.length, -1)
	}
	var currentLessons = []
	var nextLessons = []
	if (!Number.isInteger(currentPeriod)) {
		currentLessons.start = currentPeriod.start()
		currentLessons.end = currentPeriod.end()

		$.each(currentPeriod.lessons, (_, lesson) => {
			if (!lesson.state.isCancelled)
				currentLessons.push({
					names: lesson.subjects.map((s) => s.fullname()),
					rooms: lesson.rooms.map((r) => r.fullname()),
					lesson: lesson
				})
		})
	}
	if (currentLessons.length == 0) {
		var startTime = tableDays[0].date
		if (!Number.isInteger(lastPeriod)) {
			startTime = lastPeriod.end()
			currentLessons.start = startTime
		}
		var endTime = DateFormat.addDays(new Date(tableDays[tableDays.length - 1].date), 1)
		if (!Number.isInteger(nextPeriod)) {
			endTime = nextPeriod.start()
			currentLessons.end = endTime
		}
		var difference = endTime - startTime

		currentLessons.push({
			names: [
				difference > Timespans.days(4)
					? 'Ferien'
					: difference > Timespans.days(1.5)
					? 'Wochenende'
					: difference > Timespans.hours(8)
					? 'Schule aus'
					: difference > Timespans.minutes(30)
					? 'Freistunde'
					: 'Pause'
			]
		})
	}
	if (!Number.isInteger(nextPeriod)) {
		nextLessons.start = nextPeriod.start()
		nextLessons.end = nextPeriod.end()
		$.each(nextPeriod.lessons, (_, lesson) => {
			if (!lesson.state.isCancelled)
				nextLessons.push({
					names: lesson.subjects.map((s) => s.fullname()),
					rooms: lesson.rooms.map((r) => r.fullname()),
					lesson: lesson
				})
		})
	}
	if (nextLessons.length == 0) {
		nextLessons.start = currentLessons.subjects ? currentLessons.end : undefined

		nextLessons.push({names: ['Ferien']})
	}

	updateNearLessonDisplay.currentLessons = currentLessons
	updateNearLessonDisplay.nextLessons = nextLessons
}

function updateNearLessonDisplay() {
	var now = new Date()
	var currentCountUp = now - updateNearLessonDisplay.currentLessons.start
	var currentCountDown = updateNearLessonDisplay.currentLessons.end - now
	var nextCountDown = updateNearLessonDisplay.nextLessons.start - now
	if (currentCountDown < 0 || isNaN(currentCountDown)) {
		currentCountDown = '-'
	}
	if (currentCountUp < 0 || isNaN(currentCountUp)) {
		currentCountUp = '-'
	}
	if (nextCountDown < 0 || isNaN(nextCountDown)) nextCountDown = '-'
	var changeCurrentTime = updateNearLessonDisplay.lastCurrentCountDown !== currentCountDown
	var changeNextTime = updateNearLessonDisplay.lastNextCountDown !== nextCountDown
	var changeData = false
	if ((nextCountDown == '-' && changeNextTime) || (currentCountDown == '-' && changeCurrentTime) || !updateNearLessonDisplay.lastCurrentCountDown) {
		changeData = true
		setNearLessonData()
		currentCountUp = now - updateNearLessonDisplay.currentLessons.start
		currentCountDown = updateNearLessonDisplay.currentLessons.end - now
		nextCountDown = updateNearLessonDisplay.nextLessons.start - now
		if (currentCountDown < 0 || isNaN(currentCountDown)) {
			currentCountDown = '-'
		}
		if (currentCountUp < 0 || isNaN(currentCountUp)) {
			currentCountUp = '-'
		}
		if (nextCountDown < 0 || isNaN(nextCountDown)) nextCountDown = '-'
		changeCurrentTime = updateNearLessonDisplay.lastCurrentCountDown !== currentCountDown
		changeNextTime = updateNearLessonDisplay.lastNextCountDown !== nextCountDown
	}
	if (changeCurrentTime) {
		$('#currentLessonDown').text(DateFormat.inCountDown(currentCountDown))
		$('#currentLessonUp').text(DateFormat.inCountDown(currentCountUp))
		if (currentCountDown == '-') $('#alwaysOnTimeLeft').hide()
		else {
			$('#alwaysOnTimeLeft').text(DateFormat.inHHMMSS(DateFormat.fromMS(currentCountDown)))
			$('#alwaysOnTimeLeft').show()
		}
		var progress = (currentCountUp / (currentCountUp + currentCountDown)) * 100
		if (progress && !isNaN(progress)) $('#currentLessonProgress').css('width', progress + '%')
		else $('#currentLessonProgress').css('width', '0%')
	}
	if (changeNextTime) {
		$('#nextLessonDown').text(DateFormat.inCountDown(nextCountDown))
	}
	if (changeData) {
		$('#currentLessonData').empty()
		$('#nextLessonData').empty()

		for (let i = 0; i < updateNearLessonDisplay.currentLessons.length; i++) {
			let lesson = updateNearLessonDisplay.currentLessons[i].lesson
			let lessonP = $('<p>', {
				class: 'list-text',
				click: () => lessonPopup(lesson, now)
			})
			if (updateNearLessonDisplay.currentLessons[i].names)
				for (let j = 0; j < updateNearLessonDisplay.currentLessons[i].names.length; j++) {
					lessonP.append($('<div>', {class: 'subject lessonLine', text: updateNearLessonDisplay.currentLessons[i].names[j]}))
				}
			if (updateNearLessonDisplay.currentLessons[i].rooms)
				for (let j = 0; j < updateNearLessonDisplay.currentLessons[i].rooms.length; j++) {
					lessonP.append($('<div>', {class: 'room lessonLine', text: updateNearLessonDisplay.currentLessons[i].rooms[j]}))
				}
			$('#currentLessonData').append(lessonP)
		}
		for (let i = 0; i < updateNearLessonDisplay.nextLessons.length; i++) {
			let lesson = updateNearLessonDisplay.nextLessons[i].lesson
			let lessonP = $('<p>', {
				class: 'list-text',
				click: () => lessonPopup(lesson, now)
			})
			if (updateNearLessonDisplay.nextLessons[i].names)
				for (let j = 0; j < updateNearLessonDisplay.nextLessons[i].names.length; j++) {
					lessonP.append($('<div>', {class: 'subject lessonLine', text: updateNearLessonDisplay.nextLessons[i].names[j]}))
				}
			if (updateNearLessonDisplay.nextLessons[i].rooms)
				for (let j = 0; j < updateNearLessonDisplay.nextLessons[i].rooms.length; j++) {
					lessonP.append($('<div>', {class: 'room lessonLine', text: updateNearLessonDisplay.nextLessons[i].rooms[j]}))
				}
			$('#nextLessonData').append(lessonP)
		}
	}
	updateNearLessonDisplay.lastCurrentCountDown = currentCountDown
	updateNearLessonDisplay.lastNextCountDown = nextCountDown
}

async function loadAbsence() {
	var data = await WebUntis.getAbsence(me.stid, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date(), undefined, false)
	if (!data.exists) return
	data = data.first
	var weekTotal = 0,
		weekUnexcused = 0
	data = JSON.parse(data).data
	if (data == null) triggerError
	$.each(data.absences, function (_, elem) {
		var fromDate = DateFormat.fromYYYYMMDD(elem.startDate)
		var toDate = DateFormat.fromYYYYMMDD(elem.endDate)
		var fromTime = DateFormat.fromUntisTime(elem.startTime)
		var toTime = DateFormat.fromUntisTime(elem.endTime)
		fromDate.setHours(fromTime.getHours())
		fromDate.setMinutes(fromTime.getMinutes())
		toDate.setHours(toTime.getHours())
		toDate.setMinutes(toTime.getMinutes())

		var missedTime = DateDiff.inMinutes(fromDate, toDate)
		if (!elem.isExcused) weekUnexcused += missedTime
		weekTotal += missedTime
	})
	var h = parseInt(weekTotal / 60)
	var uh = parseInt(weekUnexcused / 60)
	$('#lastWeekTotalAbsence1').text(`${h} h`)
	$('#lastWeekTotalAbsence2').text(`${weekTotal - h * 60} min`)
	$('#lastWeekTotalAbsence3').text(`${weekTotal} min`)
	$('#lastWeekAbsence1').text(`${uh} h`)
	$('#lastWeekAbsence2').text(`${weekUnexcused - uh * 60} min`)
	$('#lastWeekAbsence3').text(`${weekUnexcused} min`)

	var data = await WebUntis.getAbsence(me.stid, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(), undefined, false)
	if (!data.exists) return
	data = data.first
	var monthTotal = 0,
		monthUnexcused = 0
	data = JSON.parse(data).data
	if (data == null) triggerError
	$.each(data.absences, function (_, elem) {
		var fromDate = DateFormat.fromYYYYMMDD(elem.startDate)
		var toDate = DateFormat.fromYYYYMMDD(elem.endDate)
		var fromTime = DateFormat.fromUntisTime(elem.startTime)
		var toTime = DateFormat.fromUntisTime(elem.endTime)
		fromDate.setHours(fromTime.getHours())
		fromDate.setMinutes(fromTime.getMinutes())
		toDate.setHours(toTime.getHours())
		toDate.setMinutes(toTime.getMinutes())

		var missedTime = DateDiff.inMinutes(fromDate, toDate)
		if (!elem.isExcused) monthUnexcused += missedTime
		monthTotal += missedTime
	})
	var h = parseInt(monthTotal / 60)
	var uh = parseInt(monthUnexcused / 60)
	$('#lastMonthTotalAbsence1').text(`${h} h`)
	$('#lastMonthTotalAbsence2').text(`${monthTotal - h * 60} min`)
	$('#lastMonthTotalAbsence3').text(`${monthTotal} min`)
	$('#lastMonthAbsence1').text(`${uh} h`)
	$('#lastMonthAbsence2').text(`${monthUnexcused - uh * 60} min`)
	$('#lastMonthAbsence3').text(`${monthUnexcused} min`)
}
