function handleErrors(promise) {
	return promise.catch(handleError)
}
function handleError(error) {
	if (error instanceof JupiterError) {
		error.send(true)
	} else {
		if (error === 'STOP_EXECUTION') {
			return
		}
		throw error
	}
}
function phpError(error) {
	var code = error.code
	var console = error.console
	var user = error.user
	var params = error.errorData
	var type = code.startsWith('#e') ? ErrorType.ERROR : code.startsWith('#w') ? ErrorType.WARNING : ErrorType.INFO
	var number = parseInt(code.slice(-3))
	return new JupiterError('PHP', type, number, code, console, user, params)
}
function jsError(type, number, params) {
	var error = jsErrorList[type][number]
	var code = error.code
	var console = error.console
	var user = error.user
	return new JupiterError('JS', type, number, code, console, user, params)
}
const jsErrorList = {
	error: {
		0: {
			code: 'error#000',
			console: 'Unbekannter Fehler',
			user: 'Interner Fehler'
		},
		1: {
			code: 'error#001',
			console: 'param $0 not set',
			user: ''
		},
		2: {
			code: 'error#002',
			console: 'json invalid ($0)',
			user: 'Interner Fehler'
		}
	},
	warning: {
		0: {
			code: 'warning#000',
			console: 'Unbekannte Warnung',
			user: ''
		}
	},
	info: {
		0: {
			code: 'info#000',
			console: 'Unbekannte Information',
			user: ''
		}
	}
}

class JupiterError {
	source
	type
	number
	code
	console
	user
	params
	constructor(source, type, number, code, console, user, params) {
		this.source = source
		this.type = type
		this.number = number
		this.code = code
		this.console = console
		this.user = user
		this.params = params ? (Array.isArray(params) ? params : [params]) : []
		for (let i = 0; i < this.params.length; i++) {
			var data = this.params[i]
			var replaceIndex = '$' + i
			this.user = this.user.replace(replaceIndex, data)
			this.console = this.console.replace(replaceIndex, data)
		}
		if (!this.user) this.user = ''
		if (!this.console) this.console = jsErrorList[this.type][0].console
		this.existing++
		if (source == 'php') $('#loginLoader').css('visibility', 'hidden')
	}
	send(throwError = false) {
		this.sent++
		if (this.user) new Toast(this.user)
		if (this.console) console[this.type](`[${this.source}:${this.code}] ${this.console}`)
		if (throwError && this.type == ErrorType.ERROR) throw this
	}
}
JupiterError.existing = 0
JupiterError.sent = 0
const ErrorType = {
	ERROR: 'error',
	WARNING: 'warning',
	INFO: 'info'
}

window.addEventListener('error', (event) => {
	event.preventDefault()
	console.error('Uncaught %o', event.error)
})
