/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

function logKeyPress(e, formID) {
	if (e.keyCode == 13) {
		if (schoolChange.isFullSchool === true) login(formID)
	} else {
		if (e.keyCode == 27) closeWindows()
		schoolChange.isFullSchool = false
	}
}

Date.prototype.monthDays = function () {
	var d = new Date(this.getFullYear(), this.getMonth() + 1, 0)
	return d.getDate()
}

class Toast {
	constructor(text, timeInSec) {
		this.text = text
		this.time = timeInSec == null ? 1 : timeInSec
		this.show()
	}
	show() {
		if (this.text == null || (window.lastToastText && window.lastToastText == this.text) || this.text == '') return
		window.lastToastText = this.text
		if (window.lastToastTextTimeout) clearTimeout(window.lastToastTextTimeout)
		window.lastToastTextTimeout = setTimeout(function () {
			window.lastToastText = null
		}, 2500)

		if (toastQueue.length != 0 && toastQueue[0] != this) {
			toastQueue.push(this)
			return
		}

		var toast = $("<div class='toast'>")
		$('body').append(toast)
		toast.html(this.text)
		toast.css({
			transform: 'translateY(100%)',
			transition: 'transform 300ms'
		})
		var time = this.time
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				toast.css('transform', 'translateY(0%)')
				setTimeout(() => {
					toast.css('transform', 'translateY(100%)')
					setTimeout(() => {
						toastQueue.shift()
						if (toastQueue.length != 0) {
							toastQueue[0].show()
						}
						toast.remove()
					}, 300)
				}, time * 1000 + 300)
			})
		)

		if (toastQueue[0] != this) toastQueue.push(this)
	}
}

class MutEx {
	constructor() {
		this._locking = Promise.resolve()
		this._locks = 0
	}
	isLocked() {
		return this._locks > 0
	}
	lock() {
		this._locks += 1
		let unlockNext
		let willLock = new Promise(
			(resolve) =>
				(unlockNext = () => {
					this._locks -= 1
					resolve()
				})
		)
		let willUnlock = this._locking.then(() => unlockNext)
		this._locking = this._locking.then(() => willLock)
		return willUnlock
	}
}

function isFullScreen() {
	return document.fullscreen === true || document.webkitIsFullScreen === true || document.mozFullScreen === true
}

function requestFullscreen(elem) {
	if (elem.requestFullscreen) {
		elem.requestFullscreen()
	} else if (elem.mozRequestFullScreen) {
		/* Firefox */
		elem.mozRequestFullScreen()
	} else if (elem.webkitRequestFullscreen) {
		/* Chrome, Safari and Opera */
		elem.webkitRequestFullscreen()
	} else if (elem.msRequestFullscreen) {
		/* IE/Edge */
		elem.msRequestFullscreen()
	}
}

function closeFullscreen(elem) {
	if (document.exitFullscreen) {
		document.exitFullscreen()
	} else if (document.mozCancelFullScreen) {
		/* Firefox */
		document.mozCancelFullScreen()
	} else if (document.webkitExitFullscreen) {
		/* Chrome, Safari and Opera */
		document.webkitExitFullscreen()
	} else if (document.msExitFullscreen) {
		/* IE/Edge */
		document.msExitFullscreen()
	}
}

function toLetterCase(str) {
	if (str == null) return
	const replacer = function (match, firstLetter, followingLetters) {
		return firstLetter.toUpperCase() + followingLetters.toLowerCase()
	}
	const regex = /([A-z\u00C0-\u00ff])([A-z\u00C0-\u00ff]+)/g
	return str.replace(regex, replacer)
}

// Function to download data to a file
function download(data, filename, type) {
	var file = new Blob([data], {
		type: type
	})
	if (window.navigator.msSaveOrOpenBlob)
		// IE10+
		window.navigator.msSaveOrOpenBlob(file, filename)
	else {
		// Others
		var a = document.createElement('a'),
			url = URL.createObjectURL(file)
		a.href = url
		a.download = filename
		document.body.appendChild(a)
		a.click()
		setTimeout(function () {
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		}, 0)
	}
}

function upload(type, onSelect) {
	var input = $('#globalFileInput')
	input.prop('accept', type)
	input.change(function (event) {
		onSelect(event, input.prop('files'))
	})
	input.trigger('click')
}

function onLoad(func) {
	loadQueue.push(func)
}

function loadNext() {
	if (loadQueue.length > 0) {
		loadQueue.shift()()
	}
	if (loadNext.finished !== true && loadQueue.length == 0) {
		loadNext.finished = true
		console.log('Styled page ready after ' + (Date.now() - pageLoadStart) + ' ms')
		$('#initLoader').remove()
	}
}

function startLoadingAnimation() {
	if (startLoadingAnimation.loading) return
	startLoadingAnimation.loading = true
	document.getElementById('outerWrapper').insertAdjacentHTML('beforeend', '<div class="center" id="loader"><div class="loader" style="left:-50%"></div></div>')
}

function stopLoadingAnimation() {
	if (!startLoadingAnimation.loading) return
	startLoadingAnimation.loading = false
	document.getElementById('loader').remove()
}

function escapeHtml(unsafe) {
	if (unsafe === null) return 'null'
	if (unsafe === undefined) return 'undefined'
	return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function loadServiceWorker() {
	if ('serviceWorker' in navigator) {
		console.info('[Client] Started SW Message listener')
		navigator.serviceWorker.addEventListener('message', onSWMsgReceive)
		navigator.serviceWorker.register('/sw.js').then(
			function (reg) {
				// Registration was successful
				if (reg.installing) {
					serviceWorker = reg.installing
					console.info('[Client] Service Worker installing')
					new Toast('Diese Seite funktioniert auch offline', 3)
				} else if (reg.waiting) {
					serviceWorker = reg.waiting
					console.info('[Client] Service Worker installed')
				} else if (reg.active) {
					serviceWorker = reg.active
					_onSWActivate()
				}
				if (!reg.active && serviceWorker) {
					serviceWorker.addEventListener('statechange', function (e) {
						console.log('SW changed state to: ' + e.target.state)
						if (e.target.state == 'activated') _onSWActivate()
					})
				}
			},
			function (err) {
				// registration failed :(
				console.warn('[Client] Service Worker registration failed: ', err)
			}
		)
	}
}

function onSWMsgReceive(event) {
	console.log('[Client] Copy: ' + JSON.stringify(event.data))
	if (event.ports[0] != null) event.ports[0].postMessage('Copy?')

	if (event.data.type == 'refresh') {
		var data = event.data.data
		//TODO
	}
}

function _onSWActivate() {
	console.info('[Client] Service Worker active')
	messageSW('Heyyy Neighbour').then((m) => console.info('[Client] Copy: ' + m))
	_onSWActivate.isActive = true
	if (document.readyState === 'interactive' && onSWActivate) onSWActivate()
}

function messageSW(msg) {
	if (serviceWorker == null) {
		console.warn("Can't message SW before it's active")
		return
	}
	console.info('[Client] Messaging SW: ' + JSON.stringify(msg))
	return new Promise(function (resolve, reject) {
		// Create a Message Channel
		var msg_chan = new MessageChannel()

		// Handler for recieving message reply from service worker
		msg_chan.port1.onmessage = function (event) {
			if (event.data.error) {
				reject(event.data.error)
			} else {
				console.log('[Client] Got Response: ' + JSON.stringify(event.data))
				resolve(event.data)
			}
		}
		// Send message to service worker along with port for reply
		serviceWorker.postMessage(msg, [msg_chan.port2])
	})
}

function safeJSONParse(string) {
	try {
		return JSON.parse(string)
	} catch (e) {
		console.warn(new Error('Invalid JSON'))
		sendDebugInfo()
		return null
	}
}

function hashGet(key) {
	if (!hashGet.hash) {
		var parts = /*window.location.hash*/ hash.slice(1).split('&')
		hashGet.hash = {}
		parts.forEach(function (elem) {
			if (elem == '') return
			var kvp = elem.split('=')
			hashGet.hash[kvp[0]] = kvp[1]
		})
	}
	if (!key) return
	return hashGet.hash[key]
}

function hashSet(key, value) {
	if (!hashGet.hash) hashGet(null) //init

	hashGet.hash[key] = value
	var kvpIndex = hash.indexOf(key + '=')
	if (kvpIndex != -1) {
		var startIndex
		if (value == null) startIndex = kvpIndex + (kvpIndex == 1 ? 0 : -1)
		else startIndex = kvpIndex + (key + '=').length
		var endIndex = hash.indexOf('&', startIndex + (value == null ? 1 : 0))
		if (endIndex == -1) endIndex = hash.length
		else if (kvpIndex == 1 && value == null) endIndex++
		hash = hash.substring(0, startIndex) + (value == null ? '' : value) + hash.substring(endIndex)
		history.replaceState(null, null, hash)
	} else {
		if (value != null) {
			hash += (hash.length > 2 ? '&' : '') + key + '=' + value
			history.replaceState(null, null, hash)
		}
	}
	return value
}

function NAFallback(checks, fallback, ok = null) {
	if (Array.isArray(checks)) {
		for (var i = 0; i < checks.length; i++) {
			var check = checks[i]
			if (check == null || check == 'null' || check == 'undefined' || check == '') {
				return fallback
			}
		}
		if (ok == null) {
			let r = checks[checks.length - 1]
			return r
		}
	} else {
		if (checks == null || checks == 'null' || checks == 'undefined' || checks == '') {
			return fallback
		}
		if (ok == null) {
			let r = checks
			return r
		}
	}
	return ok()
}

function initAccordion(acc) {
	if (acc.getAttribute('data-initalized') == 'true') return
	acc.setAttribute('data-initalized', 'true')
	acc.addEventListener('click', async function () {
		/* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
		this.classList.toggle('active')

		/* Toggle between hiding and showing the active panel */
		var panel = this.nextElementSibling

		await (function () {
			if (panel.style.display === 'block') {
				panel.style.display = 'none'
			} else {
				panel.style.display = 'block'
			}
		})()
	})
}

function load() {
	var acc = document.getElementsByClassName('accordion')
	for (var i = 0; i < acc.length; i++) {
		initAccordion(acc[i])
	}

	loadNext()
}

function install() {
	if (deferredPrompt == null) {
		new Toast('Browser überprüft noch unsere Integrität oder die App ist bereits installiert', 3.5)
		return
	}
	deferredPrompt.prompt()
	deferredPrompt.userChoice.then((choiceResult) => {
		if (choiceResult.outcome === 'accepted') {
			console.log('User accepted the A2HS prompt')
			$('#installBtn').addClass('disabled')
			if (window.appInstallToHidden) appInstallToHidden()
		} else {
			console.log('User dismissed the A2HS prompt')
		}
		deferredPrompt = null
	})
}

function toggleSideNav(expand = null) {
	var nav = $('#mainSideBar')
	var closer = $('#sideNavClose')
	if (toggleSideNav.expanded == null) toggleSideNav.expanded = false
	if ((!toggleSideNav.expanded && expand == null) || (expand != null && expand && !toggleSideNav.expanded)) {
		//Ausfahren
		nav.css('transform', 'translateX(0%)')
		closer.removeClass('inv')
		$('#sideNavButton>input').prop('checked', true)
		toggleSideNav.expanded = true
	} else if ((toggleSideNav.expanded > 0 && expand == null) || (expand != null && !expand && toggleSideNav.expanded)) {
		nav.css('transform', 'translateX(100%)')
		closer.addClass('inv')
		$('#sideNavButton>input').prop('checked', false)
		toggleSideNav.expanded = false
	}
}

function showAccount() {
	logout()
}

function reloadLinks() {
	ajax('/PHP/ajax.php', {
		method: 'POST',
		body: 'type=get&getType=additionalLinks'
	})
		.then(async (resp) => {
			$('#additionalLinks').html(await resp.text())
		})
		.catch(() => {})
}
class WaitGroup {
	constructor(size = null) {
		this.size = size || 0
	}

	start(count = 1) {
		this.size += count
	}

	stop() {
		this.size--
		if (this.size == 0 && this.then != null) this.then()
		if (this.size < 0) console.warn('Invalid use of waitgroup. More stoppped than started')
	}

	then(func) {
		this.then = func
	}
}
function agbCheck() {
	if (localStorage.getItem('agb') != AGB_VERSION) {
		agbCheck.complete = function () {
			$('#agbCheck').css('display', 'none')
			localStorage.setItem('agb', AGB_VERSION)
		}
		if (!window.location.pathname.startsWith('/agb')) $('#agbCheck').css('display', 'block')
	}
}
function homeworkNotAvailable() {
	if (!homeworkNotAvailable.done) {
		homeworkNotAvailable.done = true
		new Toast('Hausübungen nicht verfügbar', 3)
	}
}
function loadSettings() {
	localSettings = localStorage.getItem(settingsKey)
	if (localSettings == 'undefined' || localSettings == null) localSettings = {}
	else localSettings = JSON.parse(localSettings)

	$.each(globalSettings.settings, (name, setting) => {
		if (!localSettings[name]) localSettings[name] = setting.default
	})

	$.each(globalSettings.settings, function (k, gs) {
		var ls = localSettings[k]
		if (ls != null) {
			gs.value = ls
		}
	})

	if (localSettings['autoFullscreen']) {
		//FIXME: This is just bad
		const tempBtn = document.createElement('button')
		tempBtn.addEventListener('click', () => {
			tempBtn.remove()
			requestFullscreen(document.body)
		})
		tempBtn.classList.add('hidden')
		document.body.append(tempBtn)
		tempBtn.dispatchEvent(new Event('click'))
	}

	console.log('loaded settings: ' + JSON.stringify(localSettings))

	if (onSettingsLoad != null) onSettingsLoad()
}

class FetchError {
	status
	statusText
	jptrError
	constructor(resp, jptrError) {
		this.status = resp.status
		this.statusText = resp.statusText
		this.jptrError = jptrError
	}

	toString() {
		return `Request unsucessfull, status ${error.statusText}`
	}
}

function ajax(url, options = {}) {
	ajax.id = ++ajax.id || 0
	const requestId = ajax.id
	const requestStyle = `border: 2px solid hsl(${Math.random() * 360}deg, ${Math.random() * 50 + 50}%, ${Math.random() * 55 + 35}%)`
	options = {
		headers: {},
		method: 'GET',
		...options
	}
	if (!('Content-Type' in options.headers)) {
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
	}
	console.log('%c[fetch] #%s%c %s %s %o', requestStyle, requestId, '', options.method, url, options.body)

	let timeoutId
	if (options.timeout) {
		const controller = new AbortController()
		options.signal = controller.signal
		timeoutId = setTimeout(() => controller.abort(), options.timeout)
	}

	return fetch(url, options)
		.then((resp) => {
			if (!resp.ok) throw resp
			if (timeoutId != null) clearTimeout(timeoutId)
			console.log('%c[fetch] #%s%c %csucessfull%c: %s', requestStyle, requestId, '', 'background-color: green; color: white', '', resp.status)
			return resp
		})
		.catch(async (error) => {
			if (timeoutId != null) clearTimeout(timeoutId)
			if (error instanceof Response) {
				if (error.status == 444) {
					console.warn('Offline / Server not reachable')
					new Toast('Server nicht erreichbar', 2)
					return new FetchError(error, null)
				}
				const respText = await error.text()
				console.warn('%c[fetch] #%s%c %cfailed%c: %s: %s', requestStyle, requestId, '', 'background-color: red; color: white', '', error.status, respText)
				const jptrErr = getError(respText)
				console.error(jptrErr.console)
				new Toast(jptrErr.user)
				sendDebugInfo()
				throw new FetchError(error, jptrErr)
			} else {
				if (error instanceof DOMException && error.name == 'AbortError') {
					console.warn('%c[fetch] #%s%c %aborted%c: %s', requestStyle, requestId, '', 'background-color: red; color: white', '', error.toString())
					throw error
				}
				console.warn('%c[fetch] #%s%c %cfailed%c: %s', requestStyle, requestId, '', 'background-color: red; color: white', '', error.toString())
				new Toast('Netzwerkfehler', 1)
				throw error
			}
		})
}
