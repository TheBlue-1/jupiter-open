/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 *
 */
const tableScroll = $('#tableScroll')[0]
const grid = $('#timeTable')[0]
var tableZoom = 100
var manualZoom = false
forceLogin()
/*Die tage die angezeit werden: von: selectedDate bis: selectedDate+displayedDays */
var selectedDate
var timeUpdateStarter
var timeUpdater
var displayedDays = 7
var tableType
var tableTypeId
var tables = []
let currentTableRequestId = 0
let lessons

document.addEventListener('keypress', function (event) {
	if (event.key == 'ArrowLeft') {
		changeDateByDays(-1)
	} else if (event.key == 'ArrowRight') {
		changeDateByDays(1)
	}
})

document.addEventListener('visibilitychange', handleVisibilityChange, false)

size = function () {
	if (grid) {
		updateTimeDisplay()
		if (manualZoom) return
		$('.lesson').css('overflow', 'visible')
		$('.lesson-text').css('white-space', 'nowrap')
		setZoom(100)
		let zoom = (grid.clientWidth / grid.scrollWidth) * tableZoom
		zoom /= 5
		zoom = Math.round(zoom)
		zoom *= 5
		zomm = Math.round(zoom)
		zoom = Math.min(Math.max(zoom, 50), 100)
		setZoom(zoom)
		$('.lesson').css('overflow', '')
		$('.lesson-text').css('white-space', '')
	}
}

function handleVisibilityChange() {
	if (document.visibilityState == 'visible') updateTimeDisplay()
}

onLogin = function () {
	setTypeAndID()
	updateStarIcon()
	if (init.isInit == null || init.isInit == false) init.autoLogin = loadAndShowData.bind(this)
	else loadAndShowData()
	return true
}

onLoad(function () {
	init()
})

function changeDate(input) {
	var newVal = input.value
	try {
		var newDate = DateFormat.fromYYYYMMDD(newVal)
		if (isNaN(newDate.getTime())) return //Date is invalid
		selectedDate = newDate
		hashSet('date', DateFormat.inYYYYMMDD(selectedDate, ''))
		loadTimetableWithSelectedDates(false)
	} catch (e) {
		new Toast('Bitte wählen sie ein valides Datum', 1.5)
	}
}

function changeDateByDays(direction) {
	//selectedDate = new Date(selectedDate.getTime() + direction * displayedDays * 24 * 60 * 60 * 1000);
	selectedDate.setDate(selectedDate.getDate() + direction * displayedDays)
	hashSet('date', DateFormat.inYYYYMMDD(selectedDate, ''))
	$('#dateInput').val(DateFormat.inYYYYMMDD(selectedDate, '-'))
	loadTimetableWithSelectedDates(false)
}

function changeDisplayedDays(input) {
	if (input.value != null && input.value != '') {
		var value = parseFloat(input.value)
		value = value.toFixed(0)
		value = Math.max(1, value)
		value = Math.min(365, value)
		input.value = value
		displayedDays = value
		loadTimetableWithSelectedDates(false)
		localStorage.setItem('displayedDays', displayedDays)
	} else {
		input.value = ''
	}
}

function toggleSaveTableHash() {
	var saves = localStorage.getItem('savedTables')
	if (saves == null || saves == '' || saves.length == '') {
		saves = {}
	} else {
		saves = JSON.parse(saves)
	}
	var id = hashGet('id')
	var type = hashGet('type')
	var hash = type && id ? '#type=' + type + '&id=' + id : ''
	var value = saves[hash]
	if (value != null) {
		delete saves[hash]
		updateStarIcon(false)
		localStorage.setItem('savedTables', JSON.stringify(saves))
	} else {
		starPopup(() => {
			var saves = localStorage.getItem('savedTables')
			if (saves == null || saves == '' || saves.length == '') {
				saves = {}
			} else {
				saves = JSON.parse(saves)
			}
			var id = hashGet('id')
			var type = hashGet('type')
			var hash = type && id ? '#type=' + type + '&id=' + id : ''
			var name = $('#starName').val()
			if (name != null) {
				saves[hash] = escapeHtml(name)
				updateStarIcon(true)
			} else {
				return
			}
			localStorage.setItem('savedTables', JSON.stringify(saves))
			new Toast('Gespeichert')
			closeWindows('dataPopup')
		})
		let name = ''
		//TODO sinvollen namen automatisch
		$('#starName').val(name).focus()
	}
}

function updateStarIcon(set = null) {
	var icon = $('#starIcon')
	if (set == true) {
		icon.removeClass('star-empty-icon')
		icon.addClass('star-icon')
	} else if (set == false) {
		icon.addClass('star-empty-icon')
		icon.removeClass('star-icon')
	} else {
		var saves = localStorage.getItem('savedTables')
		if (saves == null) return

		saves = JSON.parse(saves)

		var id = hashGet('id')
		var type = hashGet('type')
		var hash = type && id ? '#type=' + type + '&id=' + id : ''
		if (saves[hash] != null) {
			icon.removeClass('star-empty-icon')
			icon.addClass('star-icon')
		}
	}
}

function setTypeAndID() {
	var type = hashGet('type')
	var id = hashGet('id')
	if (type == null || type == '') {
		type = hashSet('type', 'student')
	}
	if (id == null || isNaN(id) || id == '') {
		id = hashSet('id', me.stid)
	}
	tableType = type
	tableTypeId = id
}

function canSwipe(dir) {
	if (dir < 0) {
		return tableScroll.scrollLeft == 0
	} else if (dir > 0) {
		return tableScroll.scrollLeft + tableScroll.clientWidth >= tableScroll.scrollWidth
	}
	return false
}

function init() {
	if (init.isInit == null)
		selectedDate = DateFormat.fromYYYYMMDD(hashGet('date')) || (displayedDays === 1 ? DateFormat.toFullDay(new Date()) : DateFormat.toMonday(new Date()))

	grid.addEventListener('click', (e) => {
		const lessonElem = e.target.closest('.lesson')
		if (!lessonElem) return
		const lessonId = lessonElem.dataset.lesson
		if (!lessonId) return
		const lesson = lessons.get(Number(lessonId))
		if (lesson != null) {
			lessonPopup(lesson, selectedDate)
		}
	})

	init.isInit = true

	initZoom()

	displayedDays = parseInt(localStorage.getItem('displayedDays')) || displayedDays
	var displayedDaysInput = document.getElementById('displayedDaysInput')
	displayedDaysInput.addEventListener('keyup', () => {
		displayedDays.value = (displayedDays.value || '').replace(/\D/, '')
	})
	displayedDaysInput.value = displayedDays

	$('#dateInput').val(DateFormat.inYYYYMMDD(selectedDate, '-'))
	hashSet('date', DateFormat.inYYYYMMDD(selectedDate, ''))
	var width = window.innerWidth / 4
	$('#tableWrapper').swipe({
		left: function () {
			if (!canSwipe(1)) return
			moveToTable(-width)
			changeDateByDays(1)
		},
		right: function () {
			if (!canSwipe(-1)) return
			moveToTable(width)
			changeDateByDays(-1)
		},
		cancel: function () {
			moveTable(0, true)
		},
		moveHorizontal: (dx) => moveTable(dx),
		maxMoveX: width,
		enableY: false,
		preventDefaultEvents: true
	})

	if (init.autoLogin != null) requestAnimationFrame(init.autoLogin)
	loadNext()
}

function initZoom() {
	const zoomIn = document.getElementById('zoomIn')
	const zoomOut = document.getElementById('zoomOut')
	let spamId, timeoutId

	function startZoom(dir) {
		timeoutId = setTimeout(function () {
			clearInterval(spamId)
			spamId = setInterval(function () {
				zoom(dir)
			}, 100)
		}, 400)
	}

	function stopZoom() {
		clearTimeout(timeoutId)
		clearInterval(spamId)
	}

	const startEvents = ['touchstart', 'mousedown']
	startEvents.forEach((event) => {
		zoomIn.addEventListener(event, startZoom.bind(this, 1), {passive: true})
		zoomOut.addEventListener(event, startZoom.bind(this, -1), {passive: true})
	})

	const stopEvents = ['touchend', 'touchcancel', 'mouseup', 'mouseleave']
	stopEvents.forEach((event) => {
		zoomIn.addEventListener(event, stopZoom.bind(this, 1), {passive: true})
		zoomOut.addEventListener(event, stopZoom.bind(this, -1), {passive: true})
	})
}

function moveTable(dx, force = false) {
	if (!force && !canSwipe(dx)) return
	document.getElementById('tableWrapper').style.transition = 'none'
	document.getElementById('tableWrapper').style.transform = `translateX(${-dx}px)`
}

function moveToTable(dx) {
	document.getElementById('tableWrapper').style.transform = `translateX(${-dx}px)`
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			document.getElementById('tableWrapper').style.transition = 'transform 400ms'
			document.getElementById('tableWrapper').style.transform = `translateX(0px)`
		})
	)
}

function tableReset() {
	lessons = new Map()
	$('#noData').hide()
	$('#notAvaiable').hide()
	$('#dataDate').text('')
	grid.innerHTML = ''
	$('#timeTable').find('div.table-overlay').remove()
	$('#zoomControls')[0].style.visibility = 'hidden'
	if (timeUpdateStarter != null) clearTimeout(timeUpdateStarter)
	if (timeUpdater != null) clearInterval(timeUpdater)
	if (loadTimeTable.currAjax) loadTimeTable.currAjax.abort()
}

function zoom(direction) {
	manualZoom = true
	const zoom = Math.round(Math.max(50, Math.min(300, tableZoom + 5 * direction)))
	setZoom(zoom)
}

function setZoom(value, tmp) {
	if (tableZoom == value) return
	const tmpZoom = tableZoom
	tableZoom = value
	$('#zoomValue').text(Math.floor(tableZoom) + '%')
	if (tableZoom < 100) {
		grid.style.transform = 'scale(' + tableZoom / 100 + ')'
		grid.style.width = (100 * 100) / tableZoom + '%'
		grid.style.minHeight = (100 * 100) / tableZoom + '%'
		grid.style.minHeight = (100 * 100) / tableZoom + '%'
	} else {
		grid.style.transform = ''
		grid.style.width = tableZoom + '%'
		grid.style.minHeight = '100%'
	}
	if (tmp) tableZoom = tmpZoom
	updateTimeDisplay()
}

function loadAndShowData() {
	loadTimetableWithSelectedDates(false)
	setInterval(() => {
		loadTimetableWithSelectedDates(true, true)
	}, 5 * 60 * 1000)
	return true
}

function loadTimetableWithSelectedDates(reload, silent = false) {
	let requestId = ++currentTableRequestId
	loadTimeTable(selectedDate, DateFormat.addDays(new Date(selectedDate), displayedDays - 1), reload, requestId, silent).catch((e) => {
		if (requestId != currentTableRequestId) return
		tableReset()
		if (e && e.code == '#error028') {
			$('#notAvaiable').show()
			setZoom(100, true)
			stopLoadingAnimation()
		} else {
			$('#noData').show()
			setZoom(100, true)
			stopLoadingAnimation()
		}

		if (!(e instanceof JupiterError)) {
			console.error(e)
			new Toast('Interner Fehler')
		}
	})
}

function createElement(tagName, options = {}) {
	options = {
		...{
			class: '',
			style: {},
			text: '',
			data: {},
			id: ''
		},
		...options
	}
	const elem = document.createElement(tagName)
	elem.className = options.class
	elem.textContent = options.text
	elem.id = options.id
	Object.assign(elem.dataset, options.data)
	Object.assign(elem.style, options.style)
	return elem
}

async function loadTimeTable(startDate, endDate, reload, requestId, silent = false) {
	setTypeAndID()
	if (!silent) {
		startLoadingAnimation()
		tableReset()
	}
	var days = await getTimetableDays(tableType, tableTypeId, startDate, endDate, reload).catch((e) => {
		throw e
	})
	if (silent) {
		tableReset()
	}

	if (requestId != currentTableRequestId) return
	if (days.every((d) => d.lessons.length == 0)) {
		$('#noData').show()
		setZoom(100, true)
		stopLoadingAnimation()
		return
	}
	var periodInfos = PeriodInfo.periods
	var height = periodInfos[periodInfos.length - 1].position
	addToGrid.grid = []
	var position = 1
	var gridRowTemplate = ['max-content']
	updateTimeDisplay.timeDivs = []

	for (var i = 0; i < periodInfos.length; i++) {
		var timeElem = createElement('div', {
			class: 'time-wrapper time-elem'
		})
		timeElem.appendChild(createElement('p', {class: 'time-text time-text-period', text: i + 1}))

		var startTime = String(periodInfos[i].start)
		startTime = startTime.substring(0, startTime.length - 2) + ':' + startTime.substring(startTime.length - 2)
		var upperTimeElem = createElement('p', {class: 'time-text', text: startTime, style: {top: 0}})
		if (i > 0)
			if (position < periodInfos[i].position) {
				gridRowTemplate.push('max-content')
				var timeSpan = String(periodInfos[i].start - periodInfos[i - 1].end)
				timeSpan = timeSpan.padStart(4, '0')
				const breakElem = createElement('span', {
					class: 'lesson-break time-elem',
					text: timeSpan.substring(0, 2) + ':' + timeSpan.substring(2),
					style: {
						'grid-area': `${position + 1} / 1 / span 1 / -1`
					}
				})
				breakElem.start = periodInfos[i - 1].end
				breakElem.end = periodInfos[i].start
				updateTimeDisplay.timeDivs[position] = breakElem
				grid.appendChild(breakElem)
				position++
			} else {
				upperTimeElem.style.transform = 'translate(-50%, -50%)'
			}
		if (!(periodInfos[i + 1] && periodInfos[i].end == periodInfos[i + 1].start)) {
			var endTime = periodInfos[i].end + ''
			endTime = endTime.substring(0, endTime.length - 2) + ':' + endTime.substring(endTime.length - 2)
			timeElem.appendChild(createElement('p', {class: 'time-text', text: endTime, style: {bottom: 0}}))
		}
		gridRowTemplate.push('auto')
		timeElem.appendChild(upperTimeElem)
		timeElem.style['grid-area'] = `${position + 1} / 1 / span 1 / span 1`
		timeElem.start = periodInfos[i].start
		timeElem.end = periodInfos[i].end
		updateTimeDisplay.timeDivs[position] = timeElem
		grid.appendChild(timeElem)
		position++
	}
	var data = false
	var gridColumnTemplate = []
	let skipStreak = false
	let skipped = 0
	for (var i = 0; i < days.length; i++) {
		if (days[i].empty()) {
			if (localSettings.hideEmptyDays) {
				if (!skipStreak) {
					gridColumnTemplate[i] = '7px'
					skipStreak = true
				} else {
					skipped++
				}
				continue
			}
		}
		skipStreak = false
		data = true
		gridColumnTemplate[i] = 'auto'
		var dateElem = createElement('div', {class: 'day-text', style: {'grid-area': `1 / ${i + 2 - skipped} / span 1 / span 1`}})
		dateElem.append(
			createElement('span', {class: 'day-text-date', text: days[i].date.getDate() + '.'}),
			createElement('span', {class: 'day-text-month', text: days[i].date.getMonth() + 1 + '.'}),
			createElement('p', {class: 'day-text-day', text: DateFormat.getDayName(days[i].date).slice(0, 2)})
		)
		grid.appendChild(dateElem)
		if (days[i].empty()) {
			var col = createElement('div', {
				style: {'grid-area': `2 / ${i + 2 - skipped} / span ${height} / span 1`},
				class: 'holiday'
			})
			col.appendChild(createElement('p', {text: 'Keine Schulstunden', class: 'holiday-text'}))
			grid.appendChild(col)
			continue
		}
		for (var j = 0; j < days[i].lessons.length; j++) {
			var positions = days[i].lessons[j].periods.map((period) => period.periodInfo.position)
			var startPos = positions[0]

			var pos

			for (var k = 0; k < positions.length; k++) {
				pos = positions[k]
				if (pos + 1 < positions[k + 1]) {
					var lessonDiv = populateLesson(days[i].lessons[j])
					addToGrid(lessonDiv, i + 1, startPos, pos)
					startPos = positions[k]
				}

				pos = positions[k]
			}
			var lessonDiv = populateLesson(days[i].lessons[j])
			addToGrid(lessonDiv, i + 1 - skipped, startPos, pos)
		}
	}
	if (!data) {
		var col = createElement('div', {
			style: {
				'grid-area': `2 / ${3} / span ${height} / span 1`
			},
			class: 'holiday'
		})
		col.appendChild(
			createElement('p', {
				text: 'Keine Schulstunden',
				class: 'holiday-text',
				style: {
					transform: ' translateX(-50%) translateY(-50%)'
				}
			})
		)
		grid.appendChild(col)
		gridColumnTemplate[1] = 'auto'
	}
	grid.style['grid-template-columns'] = 'min-content ' + gridColumnTemplate.join(' ')
	grid.style['grid-template-rows'] = gridRowTemplate.join(' ')

	buildGrid()
	$('#zoomControls')[0].style.visibility = 'visible'
	requestAnimationFrame(() => requestAnimationFrame(() => createTimeDisplay(days)))
	if (days.requestDate) {
		$('#dataDate').text(DateFormat.inDDMMYYYYHHMM(new Date(days.requestDate), '.'))
	} else {
		$('#dataDate').text('')
	}
	stopLoadingAnimation()
	if (!silent) size()
}

function addToGrid(element, xPos, yPos, yEndPos) {
	xPos += 1
	yPos += 1
	yEndPos += 1
	if (!addToGrid.grid[xPos]) addToGrid.grid[xPos] = []

	var box = addToGrid.grid[xPos][yPos]
	if (box && box.y <= yPos && box.yEndPos >= yEndPos) {
		//box passt
	} else {
		box = {
			y: yPos,
			yEndPos: yEndPos,
			elements: []
		}
		for (var i = 0; i < yEndPos - yPos + 1; i++) {
			if (addToGrid.grid[xPos][yPos + i] && addToGrid.grid[xPos][yPos + i] != box) {
				correctBoxes(addToGrid.grid[xPos][yPos + i], box, xPos)
			}
			addToGrid.grid[xPos][yPos + i] = box
		}
	}

	box.elements.push({element: element, yPos: yPos, yEndPos: yEndPos})
}
function correctBoxes(oldBox, newBox, x) {
	newBox.elements.push(...oldBox.elements)
	for (var i = oldBox.y; i < oldBox.yEndPos + 1; i++) {
		if (addToGrid.grid[x][i] != newBox) addToGrid.grid[x][i] = newBox
	}
	if (oldBox.y < newBox.y) newBox.y = oldBox.y
	if (oldBox.yEndPos > newBox.yEndPos) newBox.yEndPos = oldBox.yEndPos
}

function buildGrid() {
	for (const xPos in addToGrid.grid) {
		const day = new Set(addToGrid.grid[xPos])
		for (const box of day) {
			if (!box) continue
			var boxDiv = createElement('div', {
				style: {
					'grid-area': `${box.y} / ${xPos} / ${box.yEndPos + 1} / span 1`
				},
				class: 'grid-box'
			})

			for (var i = 0; i < box.elements.length; i++) {
				box.elements[i].element.style['grid-row'] = `${box.elements[i].yPos - box.y + 1} / ${box.elements[i].yEndPos - box.y + 2}`
				boxDiv.appendChild(box.elements[i].element)
			}
			grid.appendChild(boxDiv)
		}
	}
}

function populateLesson(lesson) {
	var outerDiv = createElement('div', {
		class: 'lesson',
		data: {lesson: lesson.id}
	})
	lessons.set(lesson.id, lesson)
	const lessonElem = createElement('div', {class: 'lesson-text-wrapper'})

	//hässlicher code der aber mittlerweile hoff ich funktioniert
	if (tableType !== 'subject') {
		if (lesson.subjects.length == 0 && lesson.text) {
			const elem = createElement('p', {class: 'lesson-text', text: toLetterCase(lesson.text)})
			lessonElem.appendChild(elem)
		} else {
			for (var i = 0; i < lesson.subjects.length; i++) {
				var subject = lesson.subjects[i]
				const elem = createElement('p', {class: 'lesson-text'})
				if (i == 4 && lesson.subjects.length > 5) {
					elem.textContent = '...'
					lessonElem.appendChild(elem)
					break
				} else elem.textContent = subject.shortName

				if (subject.backColor != null) {
					elem.style.backgroundColor = subject.backColor
					elem.classList.add('bg-col-changed')
				}
				if (subject.foreColor != null) {
					elem.style.color = subject.foreColor
					elem.classList.add('fg-col-changed')
				}
				lessonElem.appendChild(elem)
			}
		}
	}

	if (tableType !== 'room') {
		addDataToLesson(lessonElem, lesson.rooms)
	}

	if (tableType !== 'teacher') {
		addDataToLesson(lessonElem, lesson.teachers)
	}

	if (tableType !== 'class' && !(tableType == 'student' && tableTypeId == me.stid)) {
		addDataToLesson(lessonElem, lesson.groups)
	}

	outerDiv.appendChild(lessonElem)

	if (lesson.state.isStandard) outerDiv.classList.add('standard-cell')
	else if (lesson.state.isEvent) outerDiv.classList.add('event-cell')
	else if (lesson.state.isExam) outerDiv.classList.add('exam-cell')
	else if (lesson.state.isCancelled) outerDiv.classList.add('cancelled-cell')
	else if (lesson.state.isShift) outerDiv.classList.add('shift-cell')
	else if (lesson.state.isSubstitution) outerDiv.classList.add('substitution-cell')
	else if (lesson.state.isAdditional) outerDiv.classList.add('additional-cell')
	else if (lesson.state.isFree) outerDiv.classList.add('free-cell')
	else if (lesson.state.isRoomSubstitution) outerDiv.classList.add('room-substitution-cell')
	else if (lesson.state.isOfficeHour) outerDiv.classList.add('office-hour-cell')
	else outerDiv.classList.add('not-standard-cell')
	return outerDiv
}
function addDataToLesson(lesson, data) {
	for (var i = 0; i < data.length; i++) {
		var value = data[i]
		const elem = createElement('p', {class: 'lesson-text'})
		if (i == 4 && data.length > 5) {
			elem.textContent = '...'
			lessonElem.appendChild(elem)
			break
		} else elem.textContent = value.shortName
		lesson.appendChild(elem)
	}
}

function createTimeDisplay(days) {
	updateTimeDisplay.days = days
	var now = new Date()
	if (createTimeDisplay.updateInterval != null) clearInterval(createTimeDisplay.updateInterval)
	if (createTimeDisplay.updateTimeout != null) clearTimeout(createTimeDisplay.updateTimeout)
	createTimeDisplay.updateTimeout = setTimeout(function () {
		updateTimeDisplay()
		createTimeDisplay.updateInterval = setInterval(function () {
			updateTimeDisplay()
		}, 60 * 1000)
	}, (61 - now.getSeconds()) * 1000)
	grid.appendChild(
		createElement('div', {
			id: 'overlayBlock',
			class: 'time-overlay',
			style: {display: 'none'}
		})
	)
	const overlay = createElement('div', {
		id: 'currentTimeOverlay',
		class: 'time-overlay',
		style: {display: 'none'}
	})
	overlay.appendChild(createElement('div', {id: 'timeOverlayTime'}))

	grid.appendChild(overlay)
	return updateTimeDisplay()
}

function updateTimeDisplay() {
	if (!updateTimeDisplay.days) return
	var now = new Date()
	var currTimeOverlay = $('#currentTimeOverlay')
	if (!currTimeOverlay[0]) return
	var currentPosition = PeriodInfo.currentPosition(now)
	if (!updateTimeDisplay.currDayIndex || now > DateFormat.addDays(new Date(updateTimeDisplay.currDayIndex), 1)) {
		updateTimeDisplay.currDayIndex = updateTimeDisplay.days.currentDayIndex(now)
		var overlayBlock = $('#overlayBlock')
		overlayBlock.css('height', '100%')
		overlayBlock.css('display', updateTimeDisplay.currDayIndex == -1 || updateTimeDisplay.currDayIndex == 0 ? 'none' : 'block')
		var blockEnd = updateTimeDisplay.currDayIndex == -2 ? updateTimeDisplay.days.length : updateTimeDisplay.currDayIndex
		blockEnd += 2
		overlayBlock.css('grid-column', '2 / ' + blockEnd)

		if (updateTimeDisplay.currDayIndex > -1 && currentPosition != 0 && !updateTimeDisplay.days[updateTimeDisplay.currDayIndex].empty()) {
			currTimeOverlay.css('display', 'block')
			currTimeOverlay.css('grid-column', blockEnd + '/ span 1')
		} else {
			currTimeOverlay.css('display', 'none')
			return true
		}
	}

	if (currentPosition == -1) {
		currTimeOverlay[0].style.height = '100%'
		return true
	}
	var currTimeElem = updateTimeDisplay.timeDivs[currentPosition]
	var dayRowHeight = updateTimeDisplay.timeDivs[1].offsetTop
	var height = currTimeElem.offsetTop - dayRowHeight

	var startTimeDate = DateFormat.fromUntisTime(currTimeElem.start)
	var endTimeDate = DateFormat.fromUntisTime(currTimeElem.end)

	var periodProgress = (new Date(0, 0, 0, now.getHours(), now.getMinutes()).getTime() - startTimeDate.getTime()) / (endTimeDate.getTime() - startTimeDate.getTime())

	height += currTimeElem.offsetHeight * periodProgress
	height = Math.min(grid.clientHeight - dayRowHeight, height)
	height = Math.max(height, 2)
	currTimeOverlay[0].style.height = `${height - 2}px`

	var timeOverlayTime = $('#timeOverlayTime')
	timeOverlayTime.text(DateFormat.inHHMM(new Date()))
	return true
}
