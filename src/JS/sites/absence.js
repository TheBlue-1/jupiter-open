/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

var loadedData = []

forceLogin()

onLogin = function () {
	$('#summary').empty()
	$('#absence').empty()
	if (!me.calendarServiceConfig) {
		new Toast('Diese Seite ist mit deinem Account nicht verfügbar', 3)
		return true
	}
	var yearStartDate
	for (var i = 0; i < me.calendarServiceConfig.schoolyears.length; i++) {
		var sy = me.calendarServiceConfig.schoolyears[i]
		if (sy.id == me.calendarServiceConfig.currentSchoolyearId) {
			yearStartDate = sy.startDate
			break
		}
	}
	if (yearStartDate) yearStartDate = DateFormat.fromYYYYMMDD(yearStartDate)
	else {
		var now = new Date()
		if (now.getMonth() < 8) yearStartDate = new Date(now.getFullYear() - 1, 8, 1)
		else yearStartDate = new Date(now.getFullYear(), 8, 1)
	}
	var c = 0
	WebUntis.getAbsence(me.stid, yearStartDate, new Date()).then((data) => {
		if (!data.exists) return
		data = data.first
		if (c == 1) return
		c++
		data = JSON.parse(data).data
		if (data == null) return
		var absence = $('#absence')
		data.absences.sort(function (a, b) {
			return DateFormat.fromYYYYMMDD(b.startDate) - DateFormat.fromYYYYMMDD(a.startDate)
		})

		absence.empty()
		var unexcusedMins = 0
		var overallMins = 0

		var starts = []
		$.each(data.absences, function (index, elem) {
			if (starts.indexOf(elem.startDate + '' + elem.startTime) != -1) return
			starts.push(elem.startDate + '' + elem.startTime)
			var acc = $('<button>', {
				class: 'accordion'
			})
			acc.append(
				$('<div>', {
					class: 'checkbox'
				})
					.append(
						$('<input>', {
							type: 'checkbox'
						})
					)
					.append(
						$('<label>', {
							click: (ev) => {
								ev.stopPropagation()
								var checkBox = ev.currentTarget.previousSibling
								checkBox.checked = !checkBox.checked
							}
						})
					)
			).append(
				$('<span>', {
					text: formatDateLong(DateFormat.fromYYYYMMDD(elem.startDate)) + ' - ' + (elem.isExcused ? '' : 'Nicht ') + 'Entschuldigt'
				})
			)
			absence.append(acc)
			var fromDate = DateFormat.fromYYYYMMDD(elem.startDate)
			var toDate = DateFormat.fromYYYYMMDD(elem.endDate)
			var fromTime = DateFormat.fromUntisTime(elem.startTime)
			var toTime = DateFormat.fromUntisTime(elem.endTime)
			fromDate.setHours(fromTime.getHours())
			fromDate.setMinutes(fromTime.getMinutes())
			toDate.setHours(toTime.getHours())
			toDate.setMinutes(toTime.getMinutes())
			var excusedString = ''
			if (elem.excuseStatus != null) {
				excusedString = capitalze(elem.excuseStatus)
			} else {
				excusedString = 'Nicht entschuldigt'
			}
			excusedString += ' (' + (elem.isExcused ? 'Ja' : 'Nein') + ')'
			var excuseHtml = ''
			if (elem.isExcused && elem.excuse != null) {
				excuseHtml =
					"<p class='list-text'>Entschuldigung: " +
					elem.excuse.text +
					'</p>' +
					"<p class='list-text'>Entschuldigt von: " +
					capitalze(elem.excuse.username) +
					'</p>' +
					"<p class='list-text'>Entschuldigt am: " +
					formatDateExact(DateFormat.fromYYYYMMDD(elem.excuse.excuseDate)) +
					'</p>'
			}
			var thisMins = DateDiff.inMinutes(fromDate, toDate)
			if (!elem.isExcused) unexcusedMins += thisMins
			overallMins += thisMins
			var missedTime = DateDiff.inDHMS(fromDate, toDate)
			var missedString = DateFormat.inDayContainingHHMM(missedTime)

			absence.append(
				$('<div>', {
					class: 'panel'
				})
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Von: ' + formatDateExact(fromDate)
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Bis: ' + formatDateExact(toDate)
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Entschuldigt: ' + excusedString
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Grund: ' + elem.reason
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Eingetragen von: ' + capitalze(elem.createdUser)
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Zuletzt geändert von: ' + capitalze(elem.updatedUser)
						})
					)
					.append(
						$('<p>', {
							class: 'list-text',
							text: 'Gefehlte Zeit: ' + missedString
						})
					)
					.append(excuseHtml)
			)
			initAccordion(acc[0])

			acc.data({
				id: elem.id,
				from: fromDate.getTime(),
				to: toDate.getTime()
			})

			elem.html = acc
			loadedData.push(elem)
		})
		var h = parseInt(overallMins / 60)
		var uh = parseInt(unexcusedMins / 60)
		$('#summary')
			.append(
				$('<b>', {
					text: 'Gesamt: '
				})
			)
			.append(
				$('<span>', {
					text: `${h} h ${overallMins - h * 60} min (${overallMins} min)`
				})
			)
			.append(
				$('<b>', {
					text: 'Unentschuldigt: '
				})
			)
			.append(
				$('<span>', {
					text: `${uh} h ${unexcusedMins - uh * 60} min (${unexcusedMins} min)`
				})
			)
		//$("#summary").text(`gesamt: ${h} h ${overallMins - h * 60} min (${overallMins} min), unentschuldigt: ${uh} h ${unexcusedMins - uh * 60} min (${unexcusedMins} min)`)
	})
	return true
}

function formatDateExact(date) {
	if (!date) return ''
	return (
		DateFormat.getDayName(date).slice(0, 2) +
		'., ' +
		date.getDate() +
		'. ' +
		DateFormat.getMonthName(date) +
		' ' +
		date.getFullYear() +
		', ' +
		DateFormat.inHHMM(date)
	)
}

function formatDateLong(date) {
	if (!date) return ''
	return DateFormat.getDayName(date) + ', ' + date.getDate() + '. ' + DateFormat.getMonthName(date) + ' ' + date.getFullYear()
}

function capitalze(str) {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

function filter(attribute, value) {
	if (value == null) {
		loadedData.forEach((elem) => {
			elem.html.css('display', 'block')
			elem.html.next().css({
				position: '',
				opacity: ''
			})
		})
		return
	}

	loadedData.forEach((elem) => {
		if (elem[attribute] !== value) {
			elem.html.css('display', 'none')
			elem.html.next().css({
				position: 'absolute',
				opacity: '0'
			})
		} else {
			elem.html.css('display', 'block')
			elem.html.next().css({
				position: '',
				opacity: ''
			})
		}
	})
}

let excuses = {
	start: () => {
		const checks = $('.accordion > .checkbox')
		checks.css('display', 'inline-block')
		checks.find('>:first-child').prop('checked', false)
		$('#downloadStart').hide()
		$('#downloadCancel').css('display', 'inline-block')
		$('#downloadCommit').css('display', 'inline-block')
	},
	cancel: () => {
		const checks = $('.accordion > .checkbox')
		checks.css('display', '')
		$('#downloadStart').show()
		$('#downloadCancel').css('display', '')
		$('#downloadCommit').css('display', '')
		$('#downloadLink').css('display', '')
	},
	download: () => {
		const checks = $('.accordion > .checkbox')
		checks.css('display', '')
		const checked = Array.from(checks.filter((_, elem) => elem.children[0].checked))
		const ids = checked.map((elem) => $(elem).parent().data('id'))
		if (!ids || ids.length == 0) {
			excuses.cancel()
			return
		}
		const startDate = checked.reduce((start, elem) => {
			const from = $(elem).parent().data('from')
			if (!start || from < start) {
				return from
			}
			return start
		}, null)
		const endDate = checked.reduce((end, elem) => {
			const to = $(elem).parent().data('to')
			if (!end || to > end) {
				return to
			}
			return end
		}, null)
		$('#downloadCancel').css('display', '')
		$('#downloadCommit').css('display', '')

		const downloadLink = document.getElementById('downloadLink')
		downloadLink.onclick = undefined
		downloadLink.style.display = 'inline-block'
		downloadLink.dataset.ready = false

		new Promise((resolve, reject) => {
			WebUntis.getReport(new Date(startDate), new Date(endDate), 1, ids).then((data) => {
				if (!data.exists) {
					excuses.cancel()
					return
				}
				data = data.first
				data = JSON.parse(data).data
				if (data.finished === true) {
					WebUntis.downloadReport(
						//	data.messageId,
						data.reportParams.slice(data.reportParams.indexOf('=') + 1, data.reportParams.indexOf('&'))
					).then((res) => {
						if (res.exists) resolve(res.first)
					})
					return true
				}
				const interval = setInterval(() => {
					WebUntis.getReportInfo().then((data) => {
						if (!data.exists) {
							clearInterval(interval)
							return excuses.cancel()
						}
						data = data.first
						data = JSON.parse(data).data
						if (!data.hasRunningJobs && data.pollingJobs && !data.pollingJobs[0]) {
							if (interval) clearInterval(interval)
							reject()
							return false
						}
						if (data.pollingJobs && data.pollingJobs[0].isJobFinished) {
							data = data.pollingJobs[0].data
							if (interval) clearInterval(interval)
							WebUntis.downloadReport(
								//	data.messageId,
								data.reportParams.slice(data.reportParams.indexOf('=') + 1, data.reportParams.indexOf('&'))
							).then((res) => {
								if (res.exists) resolve(res.first)
							})
							return true
						}
					})
				}, 500)
			})
		})
			.then((data) => {
				downloadLink.onclick = () => {
					const a = document.createElement('a')
					a.href = 'data:application/pdf;base64,' + data
					a.download = 'Fehlstunden.pdf'
					document.body.append(a)
					a.click()
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							a.remove()
						})
					})
					excuses.cancel()
				}
				downloadLink.dataset.ready = true
			})
			.catch((err) => {
				new Toast('Ein Fehler ist aufgetreten')
				console.error(err)
				excuses.cancel()
			})
	}
}
