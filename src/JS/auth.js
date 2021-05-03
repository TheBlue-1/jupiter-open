function schoolOutput(answer) {
	var box = document.getElementById('schoolSuggestionBox')
	box.innerHTML = "<option value=''></option>"
	var json = JSON.parse(answer)
	if (json.result == null || json.result.schools == null || json.result.schools.length == 0) return

	if (document.getElementById('school').value == json.result.schools[0].displayName + ' (' + json.result.schools[0].loginName + ')') return
	for (let i = 0; i < json.result.schools.length; i++) {
		var listItem = document.createElement('OPTION')
		listItem.innerHTML = json.result.schools[i].displayName + ' (' + json.result.schools[i].loginName + ')'
		box.appendChild(listItem)
	}
}

function schoolChangeCorrection(answer) {
	if (schoolOutput.dontReplace == true) {
		schoolOutput.dontReplace = false
		return
	}
	if (document.getElementById('school').value == 'admin') return
	schoolOutput.dontReplace = false

	var json = JSON.parse(answer)
	if (json.result == null || json.result.schools == null || json.result.schools.length == 0) return
	schoolChange.isFullSchool = true
	document.getElementById('school').value = json.result.schools[0].displayName + ' (' + json.result.schools[0].loginName + ')'
}

function schoolChange(event) {
	schoolChange.isFullSchool = false
	if (event.currentTarget.value.length >= 3) {
		ajax('/PHP/ajax.php', {
			method: 'POST',
			body: 'type=get&getType=findSchools&string=' + encodeURIComponent(event.currentTarget.value)
		})
			.then(async (resp) => {
				schoolChangeCorrection(await resp.text())
			})
			.catch(() => {})
	} else {
		event.currentTarget.value = ''
	}
}

function schoolInput(event) {
	if (event.currentTarget.value.length >= 3) {
		ajax('/PHP/ajax.php', {
			method: 'POST',
			body: 'type=get&getType=findSchools&string=' + encodeURIComponent(event.currentTarget.value)
		})
			.then(async (resp) => {
				if (!resp.ok) throw await resp.text()
				schoolOutput(await resp.text())
			})
			.catch(() => {})
	}
}

function correctLoginState() {
	console.log('corrector called')
	ajax('/PHP/shortquestion.php?x=lp', {
		method: 'POST'
	})
		.then(async (resp) => {
			const data = await resp.text()
			if (data == '11' && (loggedIn == false || me.userName == 'Anonym')) {
				loginInit()
				console.log('corrector loggedin')
			} else if (data == '10' && (loggedIn == false || me.userName != 'Anonym')) {
				ajax('/PHP/ajax.php', {
					method: 'POST',
					body: 'type=get&getType=school'
				})
					.then(async (resp) => {
						loginInit(await resp.json())
					})
					.catch(() => {})
				console.log('corrector schoolloggedin')
			} else if (data == '00' && loggedIn == true) {
				logout()
				console.log('corrector loggedout')
			} else if (data == '00' && loggedIn == false) {
				fakeLogout()
			}
		})
		.catch(() => {})
}

async function logout() {
	let res = await WebUntis.logout()
	if (res.first != '') {
		new Toast('Nicht Erfolgreich Ausgeloggt')
		return
	}
	console.log('logout successfull!')
	loggedIn = false
	resetLogin()
	if (onLogout != null) onLogout()
	new Toast('Erfolgreich Ausgeloggt')
}

function fakeLogout() {
	loggedIn = false
	resetLogin()
	if (onLogout != null) onLogout()
}

function login() {
	if (login.disabled == true) return
	if ($('#popupForm')[0].checkValidity()) {
		login.disabled = true
		$('#loginBtn').prop('disabled', true)
		$('#loginLoader').css('visibility', 'visible')
		var school = $('#school').val()
		var username = $('#username').val()
		var password = $('#password').val()
		var rememberMe = $('#rememberMe').prop('checked')
		loginInit.isNewLogin = true
		WebUntis.login(username, password, school, rememberMe)
			.then((data) => {
				if (data.exists) loginInit(data.first)
			})
			.catch((_) => {
				resetLogin()
			})
	} else {
		$('#popupForm')[0].reportValidity()
	}
}

function forceLogin() {
	if (loggedIn || forceLogin.set || autoLoginData != null) return
	forceLogin.set = true
	$(document).ready(function () {
		if (loggedIn || autoLoginData != null) return
		toggleLoginEnforcer('Wir können dir diese Seite nicht zeigen wenn du nicht angemeldet bist.')
	})
}

function toggleLoginEnforcer(value) {
	if (value != null) {
		$('#fLMessage').text(value)
		$('#forceLogin').css('display', 'block')
		$('#outerWrapper').css('filter', 'blur(3px)')
	} else {
		$('#forceLogin').css('display', 'none')
		$('#outerWrapper').css('filter', '')
	}
}

function resetLogin() {
	var userBtn = $('#userBtn')
	userBtn.text('ANMELDEN')
	/*Muss .attr sein*/
	userBtn.attr('onclick', 'openLoginPopup()')
	$('#loginBtn').attr('disabled', false)
	$('#loginLoader').css('visibility', 'hidden')
	login.disabled = false
	if (forceLogin.set == true) toggleLoginEnforcer('Wir können dir diese Seite nicht zeigen wenn du nicht angemeldet bist.')
	reloadLinks()
}

//Gets called from php
async function autoLogin(meData) {
	autoLoginData = meData
	await loginInit(autoLoginData)
	correctLoginState()
}

async function loginInit(meData = null, isJSON = false) {
	try {
		if (meData == 'AlreadyLoggedIn') {
			const data = await cache.get('meData')
			if (data === undefined) await loginInit()
			else await loginInit(data, false)
			return
		}
		if (meData == null || meData == 'undefined' || meData.length == 0) {
			const meNewData = await WebUntis.whoAmI()
			if (meNewData.exists) await loginInit(meNewData.first)
			return
		}
		//senseful data
		cache.set('meData', typeof meData === 'string' ? meData : JSON.stringify(meData), 7)
		if (meData.startsWith('school:')) {
			me = {}
			me.school = meData.replace('school: ', '')
			console.log('Logged in as: Anonym')
			var userName = 'Anonym'
		} else {
			//isPerson
			if (isJSON === true) {
				me = meData.data
				if (meData.adminName) me.adminName = meData.adminName
				if (meData.classId && meData.classId != 'NO_CLASS_FOUND') me.classId = meData.classId
				if (me == null) {
					new Toast('Ein Fehler ist beim Login aufgetreten', 2)
					console.warn('meData == null')
					fakeLogout()
					return
				}
			} else {
				try {
					meData = safeJSONParse(meData)
					if (meData == null || meData.data == null) {
						new Toast('Ein Fehler ist beim Login aufgetreten', 2)
						console.warn('meData == null')
						fakeLogout()
						return
					}
					me = meData.data
					if (meData.adminName) me.adminName = meData.adminName
					if (meData.classId && meData.classId != 'NO_CLASS_FOUND') me.classId = meData.classId
					me.stid = me.loginServiceConfig.user.personId
				} catch (e) {
					new Toast('Ein Fehler ist beim Login aufgetreten', 2)
					console.warn('Error could not parse me data. Data:')
					console.log(meData)
					sendDebugInfo()
					fakeLogout()
					return
				}
			}
			console.log('Logged in as: ' + me.loginServiceConfig.user.name + ' ID: ' + me.stid)
			var userName = me.loginServiceConfig ? me.loginServiceConfig.user.name : null
		}

		if (me.loginServiceConfig) me.loginServiceConfig.user.name = userName

		me.userName = userName
		me.stid = me.stid || -1
		me.school = me.mandantName || me.school
		if (!me.school) {
			console.warn('Schule nicht angegeben')
			fakeLogout()
			return
		}
		console.log('Me: %o', me)

		loggedIn = true
		clientLogin = () => {
			try {
				if (onLogin != null)
					if (onLogin() != true) {
						console.warn('onLogin did not return true')
						fakeLogout()
						return
					}
			} catch (e) {
				console.warn('Fehler bei der onLogin methode!')
				console.warn(e)
				new Toast('Initialisierungs-Fehler', 1)
				sendDebugInfo()
				fakeLogout()
				return
			}
		}
		clientLogin()

		var userBtn = $('#userBtn')

		if (userName != 'Anonym') {
			if (me.adminName) userBtn.text(me.adminName.toUpperCase())
			else userBtn.text(userName.toUpperCase())
		} else userBtn.text('ABMELDEN')
		/*Muss .attr sein*/
		userBtn.attr('onclick', 'showAccount();')
		if (!navigator.onLine) {
			userBtn.text('OFFLINE')
			userBtn.attr('onclick', 'location.reload()')
		}
		$('#loginBtn').attr('disabled', false)
		login.disabled = false

		if (forceLogin.set == true) {
			toggleLoginEnforcer(null)
		}
		if (loginInit.isNewLogin) {
			new Toast('Erfolgreich Eingeloggt', 2)
			loginInit.isNewLogin = false
		}

		closeWindows()
		reloadLinks()
	} catch (e) {
		console.warn(e)
		sendDebugInfo()
		fakeLogout()
	}
}
