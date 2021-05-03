var onLoginChangers = []
forceLogin()

const NOTIFICATION_SETTING = 'notifications'
class XSetting {
	constructor(name, title, type, defaultValue, values, apply, converters, disabled = false) {
		this.name = name
		this.defaultValue = defaultValue
		this.type = type
		this.converters = converters
		this.apply = apply
		this.className = 'x-setting'

		var jqThis = $('<x-setting>')

		jqThis.append(
			$('<div>', {
				html: title,
				class: 'setting-name'
			})
		)

		jqThis.attr('data-name', name)

		var inputElem
		var valueElem

		if (type == 'timetable') {
			valueElem = inputElem = $('<button>', {
				click: () => changeTimetable(this.name),
				id: name
			})
		} else if (type == 'toggle') {
			inputElem = $('<input>', {
				type: 'checkbox'
			})
			valueElem = $('<label>', {
				class: 'setting-value toggle'
			})
				.append(inputElem)
				.append(
					$('<span>', {
						class: 'slider round'
					})
				)
		} else {
			if (type == 'select') {
				valueElem = inputElem = $('<select>')
				$.each(values, function (k, v) {
					inputElem.append(
						$('<option>', {
							value: k,
							text: v
						})
					)
				})
			} else {
				valueElem = inputElem = $('<input>', {
					type: type
				})
				if (type == 'range') {
					if (values) {
						inputElem.attr('min', values.min)
						inputElem.attr('max', values.max)
						inputElem.attr('step', values.step)
					}
				}
			}
		}

		var valueWrapperElem = $('<div>', {
			class: 'setting-value'
		})
		valueWrapperElem.append(valueElem)
		jqThis.append(valueWrapperElem)

		valueWrapperElem.append(
			$('<button>', {
				class: 'reset-button',
				click: this.delete.bind(this)
			}).append(
				$('<span>', {
					title: 'Zurücksetzen',
					class: 'reload-icon'
				})
			)
		)

		if (apply == 'ajax') {
			localSettings[name] = serverSideSettings[name]

			if (type == 'toggle') {
				inputElem[0].addEventListener('change', () => {
					applyViaAjax(this.name, inputElem.prop('checked') ? 1 : 0)
				})
			}
		}

		switch (type) {
			case 'toggle':
				inputElem.prop('checked', defaultValue)
				break
			case 'timetable':
				inputElem.prop('text', defaultValue)
				break
			default:
				var data = firstNotNull(localSettings[name], defaultValue)
				if (converters && converters.toValue) eval(converters.toValue)
				inputElem.val(data)
				break
		}

		if (disabled) {
			jqThis.addClass('setting-disabled')
		}
		this.inputElem = inputElem
		this.elem = jqThis[0]
		inputElem.on('change', this.updateValue.bind(this))
		this.updateDisplayedValue()
	}

	async updateValue() {
		var value

		if (this.type == 'toggle') value = this.inputElem.prop('checked')
		else value = this.inputElem.val()

		if (this.name == NOTIFICATION_SETTING) {
			this.inputElem.prop('checked', !value)
			this.inputElem.prop('disabled', true)

			let ok = await enableNotifications(value)
				.then(() => true)
				.catch(() => false)

			this.inputElem.prop('disabled', false)
			if (ok) {
				this.inputElem.prop('checked', value)
			} else {
				return
			}
		}

		if (this.converters && this.converters.toData) eval(this.converters.toData)
		localSettings[this.name] = value
		this.save()
	}
	save() {
		if (this.apply == 'php') {
			applySettings()
		} else if (this.apply == 'ajax') {
			let value = globalSettings.settings[this.name].default
			if (typeof value == 'boolean') {
				value = value ? 1 : 0
			}
			applyViaAjax(this.name, value)
			saveSettings()
		} else {
			saveSettings()
		}
	}

	async delete() {
		if (this.name == 'notifications') {
			let ok = await enableNotifications(this.defaultValue)
				.then(() => true)
				.catch(() => false)
			if (!ok) {
				return
			}
		}
		delete serverSideSettings[this.name]
		delete localSettings[this.name]
		this.updateDisplayedValue()
		this.save()
	}

	updateDisplayedValue(val = null) {
		var data = firstNotNull(val, localSettings[this.name], serverSideSettings[this.name], this.defaultValue)
		if (this.converters && this.converters.toValue) eval(this.converters.toValue)
		if (this.type == 'toggle') $(this.inputElem).prop('checked', data)
		if (this.type == 'timetable') {
			if (data != '') {
				var inel = this.inputElem
				var val = data.split('|')

				var onTableTypePreloadSuccess = (iddata) => {
					if (!iddata.exists) return
					iddata = iddata.first
					iddata = JSON.parse(iddata).data.elements

					$.each(iddata, function (_, elem) {
						if (elem.id + '' == val[1]) {
							$(inel).text(elem.displayname)
							return false
						}
					})
				}
				var func = () => {
					switch (val[0]) {
						case '1':
							WebUntis.getGroups().then(onTableTypePreloadSuccess)
							break
						case '2':
							WebUntis.getTeachers().then(onTableTypePreloadSuccess)
							break
						case '3':
							WebUntis.getSubjects().then(onTableTypePreloadSuccess)
							break
						case '4':
							WebUntis.getRooms().then(onTableTypePreloadSuccess)
							break
						case '5':
							WebUntis.getStudents().then(onTableTypePreloadSuccess)
							break
					}
				}
				if (loggedIn) func()
				else onLoginChangers.push(func)
			} else {
				this.inputElem.text('')
			}
		} else $(this.inputElem).val(data)
	}
}

onSettingsLoad = showSettings

onLoad(init)

async function enableNotifications(enable) {
	await fcm
	if (enable) {
		await fcm
			.getToken()
			.then(async (currentToken) => {
				if (currentToken) {
					console.log('Created registration token: %s', currentToken)
					const ok = await ajax('/PHP/ajax.php', {
						method: 'POST',
						body: 'type=put&putType=fcmRegistration&token=' + encodeURIComponent(currentToken)
					})
						.then((resp) => resp.ok)
						.catch(() => false)
					if (!ok) {
						new Toast('Konnte Benachrichtigungen nicht aktivieren', 2)
					}
				} else {
					console.log('No Instance ID token available. Request permission to generate one.')
					new Toast('Benachrichtigungen nicht zugelassen', 2)
				}
				return true
			})
			.catch((err) => {
				console.log('An error occurred while retrieving token. ', err)
				new Toast('Konnte Benachrichtigungen nicht aktivieren', 2)
				throw err
			})
	} else {
		const token = await fcm.getToken().catch(() => false)
		if (!token) return
		let ok = await fcm.deleteToken().catch((err) => {
			console.error(err)
			return false
		})
		if (!ok) {
			console.log('Could not delete registration token')
			new Toast('Konnte Benachrichtigungen nicht deaktiveren', 2)
			return false
		}
		ok = await ajax('/PHP/ajax.php', {
			method: 'POST',
			body: 'type=put&putType=fcmUnregistration&token=' + encodeURIComponent(token)
		})
			.then((resp) => resp.ok)
			.catch(() => false)
		console.log('Deleted registration token.')
		return ok
	}
}

function firstNotNull(...val) {
	for (var i = 0; i < val.length; i++) {
		if (val[i] != null) return val[i]
	}
	return
}

onLogin = () => {
	$.each(onLoginChangers, (_, func) => {
		func()
	})

	return true
}

function init() {
	loadNext()
}

async function correctNotificationSettting() {
	const input = document.querySelector(`[data-name="${NOTIFICATION_SETTING}"] input`)
	input.disabled = true
	const hasToken = await new Promise(async (resolve) => {
		const db = new IDB('firebase-messaging-database', {})
		await db.ready
		if (db.error) return resolve(false)
		if (!db.db.objectStoreNames.contains('firebase-messaging-store')) {
			db.db.close()
			indexedDB.deleteDatabase('firebase-messaging-database')
			return resolve(false)
		}
		let {'firebase-messaging-store': store} = db.access('firebase-messaging-store')
		const count = await IDB.promise(store.count(firebaseConfig.appId)).catch().catch(console.error)
		resolve(count > 0)
	}).catch(() => false)
	if (hasToken != input.checked || hasToken != localSettings.notifications) {
		localSettings.notifications = false
		input.checked = hasToken
		saveSettings()
	}
	input.disabled = false
}

function saveSettings() {
	localStorage.setItem(settingsKey, JSON.stringify(localSettings))
	var phpSettings = ''
	$.each(globalSettings.settings, function (key, gs) {
		if (gs.apply == 'php' && localSettings[key] != null) phpSettings += encodeURIComponent(key) + '=' + encodeURIComponent(localSettings[key]) + '&'
	})
	phpSettings = phpSettings.slice(0, -1)
	Cookies.set(settingsKey, phpSettings, {
		expires: 365 * 10,
		secure: true
	})
}

function applySettings(delayed) {
	saveSettings()
	if (!_onSWActivate.isActive) {
		onSWActivate = applySettings.bind(this, true)
		startLoadingAnimation()
		return
	}
	if (delayed) {
		stopLoadingAnimation()
	}
	messageSW({
		command: 'reloadCache'
	})
}
function showSettings() {
	$.each(globalSettings.sections, function (title, settings) {
		var section = $('<section>')
		section.append(
			$('<div>', {
				class: 'section-title',
				text: title
			})
		)

		$.each(settings, function (_, key) {
			var sett = globalSettings.settings[key]
			section.append(new XSetting(key, sett.name, sett.type, sett.default, sett.values, sett.apply, sett.converters).elem)
		})
		$('#content').append(section)
	})
	correctNotificationSettting()
}

function changeTimetable(name) {
	changeTimetable.settingName = name
	tablePopup()
}
function tableTypeChange(elem) {
	if (!tableTypeChange.ids) tableTypeChange.ids = []
	val = elem.value
	var onSuccess = (data) => {
		if (!data.exists) return
		data = data.first
		data = JSON.parse(data).data.elements
		var selectElem = $('#tableid')
		selectElem.empty()
		selectElem.html(' <option disabled selected>Namen wählen</option>')
		if (!tableTypeChange.ids[val]) tableTypeChange.ids[val] = []
		$.each(data, function (_, elem) {
			var nOpt = $('<option>')
			nOpt.text(elem.displayname)
			nOpt.val(elem.id)
			tableTypeChange.ids[val][elem.id] = elem.displayname
			selectElem.append(nOpt)
		})
	}
	switch (val) {
		case '1':
			WebUntis.getGroups().then(onSuccess)
			break
		case '2':
			WebUntis.getTeachers().then(onSuccess)
			break
		case '3':
			WebUntis.getSubjects().then(onSuccess)
			break
		case '4':
			WebUntis.getRooms().then(onSuccess)
			break
		case '5':
			WebUntis.getStudents().then(onSuccess)
			break
	}
}
function saveTable() {
	var type = $('#tabletype').val()
	var id = $('#tableid').val()
	applyViaAjax(changeTimetable.settingName, type + '|' + id)
	$('#' + changeTimetable.settingName).text(tableTypeChange.ids[type][id])
	closeWindows()
}

function applyViaAjax(setting, value) {
	ajax('/PHP/ajax.php', {
		body: 'type=put&putType=setting&setting=' + setting + '&value=' + value,
		method: 'POST'
	}).catch(() => {})
}
