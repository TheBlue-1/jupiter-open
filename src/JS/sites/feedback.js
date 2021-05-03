/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */
setEnableFields(false)
onLogin = function () {
	if (me && me.loginServiceConfig && me.loginServiceConfig.user && me.loginServiceConfig.user.email) $('#emailIn').val(me.loginServiceConfig.user.email)
	setEnableFields(true)
	return true
}
onLogout = function () {
	$('#emailIn').val('')
	setEnableFields(false)
}
verified = false

onLoad(init)

size = function () {
	$('.g-recaptcha > div').each(function (i, e) {
		e = $(e)
		if (e.parent().parent().width() > e.width()) {
			e.parent().css('transform', 'scale(' + 1 + ')')
			return
		}
		var scale = e.parent().parent().width() / e.width()
		if (scale > 1 || scale == 0) return
		e.parent().css('transform', 'scale(' + scale + ')')
	})
}

function init() {
	$('textarea').on('click', function (event) {
		event.currentTarget.scrollIntoView({behavior: 'smooth', block: 'start'})
	})
}

function setEnableFields(enable) {
	var suggBox = $('#suggestionBox')
	if (enable) {
		suggBox.removeAttr('disabled')
		suggBox.prop('placeholder', 'Vorschläge')
	} else {
		suggBox.prop('disabled', true)
		suggBox.prop('placeholder', 'Du musst dich anmelden um Verbesserungsvorschläge zu machen')
	}
}

function verifyCallback(resp) {
	ajax('/PHP/ajax.php', {
		method: 'POST',
		body: 'type=validateChapta&response=' + resp
	})
		.then(async (resp) => {
			const data = safeJSONParse(await resp.text())
			if (data == null) {
				verified = false
				resetCaptchas()
				return
			}
			if (data.success == true) {
				verified = true
			} else {
				verified = false
				resetCaptchas()
			}
		})
		.catch(() => {})
}

function resetCaptchas() {
	grecaptcha.reset(0)
	grecaptcha.reset(1)
}

function validateForm(formId) {
	if ($('#' + formId)[0].checkValidity()) {
		return true
	} else {
		$('#' + formId)[0].reportValidity()
		return false
	}
}

function sendSuggestion(formId) {
	if (!loggedIn) return
	if (!validateForm(formId)) return
	var msg = $('#' + formId).serializeArray()
	send(msg, 'suggestion', '', null, function () {
		$('#' + formId)[0].reset()
		new Toast('Danke für dein Feedback', 2)
	})
}

function sendProblem(formId) {
	if (!validateForm(formId)) return
	var msg = $('#' + formId).serializeArray()
	send(msg, 'problem', $('#emailIn').val(), null, function () {
		$('#' + formId)[0].reset()
		if (me && me.loginServiceConfig && me.loginServiceConfig.user && me.loginServiceConfig.user.email) $('#emailIn').val(me.loginServiceConfig.user.email)
		new Toast('Danke für dein Feedback', 2)
	})
}

function send(msg, type, email = '', onError, onSuccess) {
	if (msg == null) return
	if (!verified) {
		new Toast('Bitte bestätigen Sie das Captcha', 3)
		return
	}
	msg = JSON.stringify(msg, null, 2)
	msg = encodeURIComponent(msg)
	/*var log = HijackedConsole.toString();
    if(!confirm("Ich bin damit einverstanden, dass der Log dieser Website zur erleichterten Fehlerbehebung Serverseitig gespeichert wird.")) log = null;
    if(log == null || log.length == 0)
        log = "NOLOG";*/
	var log = 'NOLOG'
	//reset needs to be after confirm
	resetCaptchas()
	verified = false
	//log = log.slice(-1024);
	log = encodeURIComponent(log)
	email = encodeURIComponent(email)
	ajax('/PHP/ajax.php', {
		body: 'type=put&putType=putMsg&email=' + email + '&log=' + log + '&msg=' + msg + '&msgType=' + type,
		method: 'POST'
	})
		.then(onSuccess)
		.catch((error) => {
			if (error instanceof FetchError) {
				if (error.jptrError.code == '#error006') {
					logout()
				}
			}
		})
}

async function clearCache() {
	await cache.clear()
	await messageSW({
		command: 'reloadCache'
	})
	new Toast('Dein Cache wurde geleert')
}
