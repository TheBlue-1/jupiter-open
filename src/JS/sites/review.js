// This page is probably still vulnerable to XSS

onLoad(loadFeedback)
var autoSee = false
function loadFeedback(amount = null, type = null, reviewed = null) {
	var data = 'type=get&getType=messages'
	if (amount) data += '&msgCount=' + amount
	if (type) data += '&msgType=' + type
	if (reviewed) data += '&reviewed=' + reviewed ? '1' : '0'
	ajax('/PHP/empajax.php', {
		method: 'POST',
		body: data
	})
		.then(async (resp) => {
			let data = await resp.text()
			if (data == null) return
			data = JSON.parse(data)
			data.sort(function (a, b) {
				if ((!a || !a.ID) && (!b || !b.ID)) return 0
				if (!a || !a.ID) return -1
				if (!b || !b.ID) return 1
				return parseInt(b.ID) - parseInt(a.ID)
			})
			var cW = $('#contentWrapper')
			$.each(data, function (index, elem) {
				var acc = $(`<button class='accordion'>${escapeHtml(`Von: ${elem.user} Typ: ${elem.type} Am: ${new Date(elem.timestamp).toString()} `)}</button>`)
				acc.on('click', function () {
					if (autoSee) seeMsg(elem.id)
				})

				var deleteBtn = $("<button class='delete-btn'><img src='/ICON/glyphicons-17-bin.png'></button>")
				deleteBtn.on('click', function () {
					deleteMsg(elem.id, acc)
				})
				var seeBtn = $("<button class='see-btn'><img src='/ICON/glyphicons-52-eye-open.png'></button>")
				seeBtn.on('click', function () {
					seeMsg(elem.id)
				})
				acc.append(seeBtn)
				acc.append(deleteBtn)
				cW.append(acc)
				var msg = JSON.parse(elem.msg)
				var msgStr = ''
				$.each(msg, function (i, e) {
					if (e.name) msgStr += e.name + ': '
					if (e.value) msgStr += e.value
					msgStr += '\r\n'
				})
				cW.append(
					"<div class='panel' style='overflow:hidden; pointer-events: auto;'>" +
						"<p style='white-space: pre-line; word-wrap: break-word !important'>Nachricht: " +
						escapeHtml(msgStr) +
						'</p>' +
						'<p>ID: ' +
						escapeHtml(elem.id) +
						'</p>' +
						'<p>Datum: ' +
						new Date(elem.timestamp) +
						'</p>' +
						'<p>E-Mail: ' +
						escapeHtml(elem.email) +
						'</p>' +
						"<p style='white-space: pre-line; word-wrap: break-word !important'>Log: \r\n" +
						escapeHtml(elem.log) +
						'</p>' +
						'</div>'
				)
				initAccordion(acc[0])
			})
		})
		.catch(() => {})
}
function deleteMsg(id, acc) {
	if (!confirm('Sicher Löschen?')) return
	ajax('/PHP/empajax.php', {
		method: 'POST',
		body: 'type=set&setType=delMessage&id=' + id
	})
		.then(() => {
			if (acc) {
				acc.next().remove()
				acc.remove()
			}
		})
		.catch(() => {})
}
function seeMsg(id) {
	ajax('/PHP/empajax.php', {
		method: 'POST',
		body: 'type=set&setType=seeMessage&id=' + id
	})
		.then(() => {
			new Toast('Als gelesen makiert', 0.5)
		})
		.catch(() => {})
}
