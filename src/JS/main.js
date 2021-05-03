/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

'use strict'
const AGB_VERSION = '1.3'
var onLogin
var onLogout
var loggedIn = false
var autoLoginData = null
var localSettings
var onSettingsLoad
var me

const settingsKey = 'settings'

var toastQueue = []
var loadQueue = []
var serviceWorker
var onPopState
var onSWActivate
var hash = window.location.hash || '#'
var typeToInt = {
	student: 5,
	room: 4,
	teacher: 2,
	subject: 3,
	class: 1,
	group: 1
}

var pageLoadStart = Date.now()

var deferredPrompt
document.addEventListener('DOMContentLoaded', function () {
	console.log('Misc ready')
	loadSettings()
	if (localSettings.enableLog || isMobileDevice()) hijackConsole(true)

	if (_onSWActivate.isActive === true && onSWActivate) {
		onSWActivate()
	}

	loadNext()
})

loadServiceWorker()

window.addEventListener('popstate', function (event) {
	if (onPopState) {
		if (onPopState(event) === false) {
			history.back()
		}
	}
	onPopState = null
})

var size = () => {}
onresize = () => {
	size()
}
onLoad(load)
window.addEventListener('beforeinstallprompt', (e) => {
	// Prevent Chrome 67 and earlier from automatically showing the prompt
	e.preventDefault()
	// Stash the event so it can be triggered later.
	deferredPrompt = e
	$('#installBtn').removeClass('disabled')
})

onLoad(function () {
	window.addEventListener('hashchange', () => {
		window.location.reload()
	})
	$('body').click((e) => {
		if (e.target.tagName == 'A') {
			if (e.target.href == window.location.href) new Toast('Sie befinden sich bereits auf dieser Seite', 5)
			else new Toast('Weiterleitung wurde gestartet', 5)
		}
	})

	$('#loginForm').bind('submit', $('form'), function (event) {
		var form = this
		event.preventDefault()
		event.stopPropagation()

		form.submitted = true
		login()
		form.submitted = false
	})

	agbCheck()
	loadNext()
	if (autoLoginData == null) correctLoginState()
})
