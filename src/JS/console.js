'use strict'
;(() => {
	const thisScript = document.currentScript

	class ConsoleEntry extends HTMLElement {
		constructor(trace, ...args) {
			super()
			this.time = new Date()
			this.trace = trace
			this.objects = args
			this.__initialized = false
		}

		__handleFormatString(objs) {
			let result = []

			let format = objs[0]
			if (typeof format !== 'string' || objs.length === 1) {
				let lastComplex = true
				let lastNode = null
				objs.forEach((obj) => {
					let complex = ['object', 'undefined', 'function'].includes(typeof obj)
					if (complex || lastComplex) {
						result.push(lastNode)
						lastNode = new EntryNode(obj)
					} else {
						lastNode.objects.push(obj)
					}
				})
				result.push(lastNode)
				return result.filter((r) => !!r)
			}
			objs.shift()

			let lastComplex = false
			let lastNode = null
			let rgx = /%o|%O|%d|%i|%s|%(\.\d+)?f|%c/g
			let lastIndex = 0
			let match
			let style = ''
			while ((match = rgx.exec(format))) {
				let index = match.index

				if (objs.length === 0) {
					break
				}

				let inbetween = format.substring(lastIndex, index)

				if (lastNode == null) {
					if (inbetween.length === 0) lastComplex = true
					else lastNode = new EntryNode(inbetween, style)
				} else if (lastComplex) {
					result.push(lastNode)
					lastNode = new EntryNode(inbetween, style)
					lastComplex = false
				} else {
					lastNode.objects.push(inbetween)
					lastNode.styles.push(style)
					lastComplex = false
				}

				let type = match[0].replace(/[^%oOdisfc]/g, '')
				let obj = objs.shift()
				let complex = ['object', 'undefined', 'function'].includes(typeof obj)
				switch (type) {
					case '%o':
					case '%O':
						break
					case '%d':
					case '%i':
						obj = Math.floor(obj)
						break
					case '%s':
						obj = String(obj)
						break
					case '%f':
						let digits = parseInt(match[0].replace(/\D+/g, ''))
						if (isNaN(digits)) digits = 6
						obj = Number(obj).toFixed(digits)
						break
					case '%c':
						style = obj
						break
				}

				if (type != '%c') {
					if (complex || lastComplex) {
						result.push(lastNode)
						lastNode = new EntryNode(obj, style)
					} else {
						lastNode.objects.push(obj)
						lastNode.styles.push(style)
					}
				}

				lastIndex = rgx.lastIndex
				lastComplex = complex
			}

			let remainder = format.slice(lastIndex)
			if (remainder) {
				if (lastNode && !lastComplex) {
					lastNode.objects.push(remainder)
					lastNode.styles.push(style)
				} else {
					result.push(new EntryNode(remainder, style))
				}
			}

			lastComplex = true
			objs.forEach((obj) => {
				let complex = ['object', 'undefined', 'function'].includes(typeof obj)
				if (complex || lastComplex) {
					result.push(lastNode)
					lastNode = new EntryNode(obj)
				} else {
					lastNode.objects.push(obj)
				}
			})
			result.push(lastNode)
			return result.filter((r) => !!r)
		}

		connectedCallback() {
			if (!this.__initialized) {
				let timeString = ''
				timeString += [('0' + this.time.getHours()).slice(-2), ('0' + this.time.getMinutes()).slice(-2), ('0' + this.time.getSeconds()).slice(-2)].join(':')
				timeString += '.' + ('00' + this.time.getMilliseconds()).slice(-3)

				let timeElem = document.createElement('span')
				timeElem.textContent = timeString
				this.appendChild(timeElem)

				let rootElem = document.createElement('div')

				if (this.trace != null) {
					rootElem.appendChild(new EntryNode(this.trace))
				}
				if (this.objects.length > 0) {
					let nodes = this.__handleFormatString([...this.objects])
					nodes.forEach((n) => rootElem.appendChild(n))
				}

				this.appendChild(rootElem)
				this.__initialized = true
			}
		}
	}
	customElements.define('mdev-console-entry', ConsoleEntry)

	class EntryNode extends HTMLElement {
		static __intlCollator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'})

		constructor(object, style) {
			super()
			this.objects = [object]
			this.collapsed = true
			this.__initialized = false
			this.styles = [style]
		}

		static __getTypeInfo(obj) {
			let type = ''
			let name = ''
			let value = ''

			if (obj === null) {
				type = value = name = 'null'
			} else if (obj === undefined) {
				type = value = name = 'undefined'
			} else {
				type = typeof obj
				name = obj.constructor.name
			}

			if (Array.isArray(obj)) {
				value = `[${obj.length}]`
			} else if (type === 'object') {
				if (obj instanceof Map) {
					value = `Map[${obj.size}]`
				} else if (obj instanceof Set) {
					value = `Set[${obj.size}]`
				} else if (typeof obj[Symbol.iterator] === 'function' && typeof obj.length === 'number' && typeof obj !== 'string') {
					value = `${name}[${obj.length}]`
				} else {
					value = `${name}{...}`
				}
			} else if (type === 'function') {
				value = `${obj.name}(${obj.length || ' '})`
			} else if (type === 'string' || type === 'number' || type === 'boolean' || type === 'symbol') {
				value = obj.toString()
			}

			return {type, name, value}
		}

		__handleUrls(obj, valueElem, rgx) {
			rgx.lastIndex = 0
			let str = obj
			let lastIndex = 0
			let match
			while ((match = rgx.exec(obj))) {
				let strElem = document.createElement('span')
				let linkElem = document.createElement('a')

				if (!match[0]) {
					break
				}

				strElem.textContent = str.substring(lastIndex, match.index)
				let link = str.substr(match.index, match[0].length)
				linkElem.textContent = link
				linkElem.href = link
				lastIndex = match.index + match[0].length

				valueElem.innerHTML += strElem.textContent + linkElem.outerHTML
			}

			if (lastIndex != str.length - 1) {
				let strElem = document.createElement('span')
				strElem.textContent = str.substring(lastIndex, str.length)
				valueElem.innerHTML += strElem.textContent
			}
		}

		connectedCallback() {
			if (!this.__initialized) {
				let style = ''
				for (const i in this.objects) {
					const obj = this.objects[i]
					if (i < this.styles.length && this.styles[i] != null) style = this.styles[i]
					let {type, value} = EntryNode.__getTypeInfo(obj)

					let valueElem = document.createElement('span')
					valueElem.classList.add('mdev-node-value')
					valueElem.dataset.type = type

					if (type === 'string') {
						let rgx = /((https?|mailto|s?ftp):(\/\/)?)?([\w.+-]+?(:[\w.+-]+?)?@)?((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(\[[\da-fA-F:]+?\])|([a-z0-9-.]+\.[a-z]+)|localhost)(:\d{1,5})?(?=[?\/#])(\/[\/\w-.~!$%&'()*+,;=:@]*)?(\?[\w-.~!$&'()*+,;=:@\/?%]+)?(#[\w-.~!$&'()*+,;=:@\/?%]+)?(?=[^\w-.~!$&'()*+,;=:@\/?%]|$)/gi
						if (rgx.test(obj.toString())) {
							this.__handleUrls(obj, valueElem, rgx)
						} else {
							if (obj === '\n') {
								valueElem.textContent = '↵'
							} else {
								valueElem.textContent = value
							}
						}
					} else {
						valueElem.textContent = value
					}

					if (style) {
						valueElem.setAttribute('style', style)
					}

					this.appendChild(valueElem)
				}

				let body = document.createElement('div')
				this.appendChild(body)
				this.__initialized = true
			}

			if (this.objects != null) this.addEventListener('click', this.__toggle)
		}

		disconnectedCallback() {
			this.removeEventListener('click', this.__toggle)
		}

		__toggle(ev) {
			if (ev.target != this && ev.target.parentNode != this.children[0]) return
			if (this.collapsed) {
				this.expand()
			} else if (ev.target === ev.currentTarget) {
				this.collapse()
			}
		}

		expand() {
			let body = this.lastElementChild
			let enumPropsElem = document.createElement('ul')
			enumPropsElem.classList.add('mdev-props-enum')
			let nonEnumPropsElem = document.createElement('ul')
			nonEnumPropsElem.classList.add('mdev-props-nonenum')

			const obj =
				['object', 'undefined', 'function'].includes(typeof this.objects[0]) || this.objects.length === 1
					? this.objects[0]
					: this.objects.map((o) => (o == null ? String(o) : o.toString())).join()

			if (obj == null) return

			let props = Object.getOwnPropertyNames(obj)
			props = props.sort(EntryNode.__intlCollator.compare)
			props.push('__proto__')

			if (props.length == 0 || typeof obj === 'function') {
				let text = document.createElement('pre')
				text.textContent = obj.toString()
				body.appendChild(text)
			} else {
				for (let i = 0; i < props.length; i++) {
					try {
						let prop = props[i]

						let isEnum = obj.propertyIsEnumerable(prop)

						if (typeof obj === 'string' && isEnum) {
							continue
						}

						let entry = new EntryNode(obj[prop])
						let entryWrapper = document.createElement('li')
						entryWrapper.textContent = `${prop}: `
						entryWrapper.appendChild(entry)
						if (isEnum) {
							enumPropsElem.appendChild(entryWrapper)
						} else {
							nonEnumPropsElem.appendChild(entryWrapper)
						}
					} catch (e) {
						console.log(e)
						let text = document.createElement('pre')
						text.textContent = e.toString()
						body.appendChild(text)
					}
				}
			}

			body.appendChild(enumPropsElem)
			body.appendChild(nonEnumPropsElem)

			this.collapsed = false
			this.dataset.expanded = ''
		}

		collapse() {
			this.lastElementChild.innerHTML = ''
			this.collapsed = true
			delete this.dataset.expanded
		}

		get valueStyle() {
			return this.styles
		}
	}
	customElements.define('mdev-entry-node', EntryNode)

	const hijackFunction = function (object, prop, replacement) {
		let org = object[prop]
		object[prop] = function proxy(...args) {
			replacement.apply(object, [proxy, ...args])
			org.apply(object, args)
		}
		return org
	}

	const getStackTrace = function (slice, caller) {
		let trace = []

		if (Error.captureStackTrace !== undefined) {
			let err = new Error()
			Error.captureStackTrace(err, caller)
			let traceStr = err.stack
			traceStr = traceStr.replace('Error\n', '')
			trace = traceStr.split('\n')
			if (trace[trace.length - 1] === '') trace.pop()
		} else {
			let traceStr = new Error().stack
			traceStr = traceStr.replace('Error\n', '')
			trace = traceStr.split('\n')
			if (trace[trace.length - 1] === '') trace.pop()
			trace = trace.slice(1 + slice)
		}

		return ['Stack Trace', ...trace]
	}

	class ConsoleInput extends HTMLElement {
		constructor() {
			super()
			this.__initialized = false
		}

		__appendChild(node) {
			this.appendChild(node)
		}

		connectedCallback() {
			if (this.__initialized) return
			this.__initialized = true

			// let scriptDirName = thisScript.src.match(/(.*)[\/\\]/)[1] || '';
			// fetch(scriptDirName + '/console.css')
			// 	.then((resp) => resp.text())
			// 	.then((css) => {
			// 		let style = document.createElement('style');
			// 		style.textContent = css;
			// 		this.__appendChild(style);
			// 	});

			let inputHistory = []
			let historyIndex = 0

			let input = document.createElement('textarea')
			input.setAttribute('wrap', 'soft')
			input.setAttribute('autocomplete', 'off')
			input.setAttribute('autocapitalize', 'none')
			input.setAttribute('spellcheck', 'false')
			this.__appendChild(input)
			input.addEventListener('keydown', (ev) => {
				if ((ev.key === 'ArrowUp' && input.selectionStart === 0) || (ev.key === 'ArrowDown' && input.selectionEnd === input.value.length)) {
					if (ev.key === 'ArrowUp') {
						historyIndex++
					} else {
						historyIndex--
					}

					historyIndex = Math.max(Math.min(historyIndex, inputHistory.length), 0)

					if (historyIndex == 0) {
						input.value = ''
					} else {
						let entryIndex = inputHistory.length - historyIndex
						let historyEntry = inputHistory[entryIndex]
						input.value = historyEntry
					}
				}
			})

			let submitBtn = document.createElement('button')
			this.__appendChild(submitBtn)
			submitBtn.textContent = 'GO'
			submitBtn.addEventListener('click', () => {
				let cmd = input.value
				if (cmd == '' || cmd == null) return
				HijackedConsole.execute(cmd)
				input.value = ''
				inputHistory.push(cmd)
			})
		}
	}

	class HijackedConsole extends HTMLElement {
		static __evalResultHandlers = {}
		static __evalId = 0

		constructor() {
			super()
			this.__entries = 0
			this.__body = null
			this.__scroll = null
			this.__initialized = false
			this.__evalId = 0
		}

		__appendChild(node) {
			this.appendChild(node)
		}

		connectedCallback() {
			if (!this.__initialized) {
				this.__initialized = true

				this.__scroll = document.createElement('div')
				this.__appendChild(this.__scroll)
				this.__body = document.createElement('div')
				this.__scroll.appendChild(this.__body)
			}

			HijackedConsole.instances.push(this)
			HijackedConsole.history.slice(this.__entries).forEach((entry) => {
				this.__body.appendChild(entry)
				this.__entries++
			})
		}

		disconnectedCallback() {
			let index = HijackedConsole.instances.indexOf(this)
			HijackedConsole.instances.splice(index, 1)
		}

		appendEntry(entry) {
			this.__body.appendChild(entry)
			this.__entries++
		}

		clear() {
			while (this.__body.firstChild) {
				this.__body.firstChild.remove()
			}
			this.__entries = 0
		}

		static execute(cmd) {
			HijackedConsole.input('🠊 ', cmd)
			try {
				let script = document.createElement('script')
				let id = HijackedConsole.__evalId++
				script.innerHTML = `(() => {
					window.HijackedConsole.__setResult(${id}, (async () => {
						try {
							return (${cmd});
						} catch (e) {
							return e
						}
					})())
				})()`
				HijackedConsole.__evalResultHandlers[id] = (result) => {
					let tmp = {}
					Promise.race([result, Promise.resolve(tmp)]).then(
						(v) => {
							if (v === tmp) {
								HijackedConsole.log(undefined, '🠈 ', result)
								result
									.then((lazyResult) => {
										HijackedConsole.log(undefined, '🠈 ', lazyResult)
									})
									.catch((err) => {
										HijackedConsole.error(undefined, '🠈 ', err)
									})
							} else {
								HijackedConsole.log(undefined, '🠈 ', v)
							}
						},
						(err) => {
							HijackedConsole.error(undefined, '🠈 ', err)
						}
					)
					script.remove()
				}
				document.body.appendChild(script)
			} catch (e) {
				HijackedConsole.error(undefined, e)
			}
		}

		static __setResult(id, value) {
			if (HijackedConsole.__evalResultHandlers[id] !== undefined) {
				HijackedConsole.__evalResultHandlers[id](value)
				delete HijackedConsole.__evalResultHandlers[id]
			}
		}

		static toStringDeep(obj, indent = 0) {
			function recurse(obj, checked) {
				if (obj === window) return '[[Window]]'
				if (obj === document) return '[[Document]]'
				if (obj === undefined) return 'undefined'
				else if (obj === null) return null
				else if (typeof obj === 'object') {
					if (checked.has(obj)) return `[[${obj.constructor ? obj.constructor.name : ''}...]]`
					checked.add(obj)
					if (Array.isArray(obj)) {
						obj = [...obj]
					} else {
						obj = Object.assign({}, obj)
					}
					for (const key in obj) {
						obj[key] = recurse(obj[key], new Set(checked))
					}
					return obj
				} else if (typeof obj === 'number' || typeof obj === 'boolean') {
					return obj
				} else {
					return obj.toString()
				}
			}
			return JSON.stringify(recurse(obj, new Set(), 0), null, indent)
		}

		static log(caller, ...args) {
			HijackedConsole.emit('log', ...args)
			HijackedConsole.print('white', new ConsoleEntry(undefined, ...args))
		}

		static info(caller, ...args) {
			HijackedConsole.emit('info', ...args)
			HijackedConsole.print('#edf4ff', new ConsoleEntry(undefined, ...args))
		}

		static debug(caller, ...args) {
			HijackedConsole.emit('debug', ...args)
			HijackedConsole.print('#edf4ff', new ConsoleEntry(undefined, ...args))
		}

		static warn(caller, ...args) {
			HijackedConsole.emit('warn', ...args)
			HijackedConsole.print('#ffffe0', new ConsoleEntry(getStackTrace(2, caller || HijackedConsole.warn), ...args))
		}

		static error(caller, ...args) {
			HijackedConsole.emit('error', ...args)
			HijackedConsole.print('#fff4f4', new ConsoleEntry(getStackTrace(2, caller || HijackedConsole.error), ...args))
		}

		static input(...args) {
			HijackedConsole.emit('input', ...args)
			HijackedConsole.print('#eeeeee', new ConsoleEntry(undefined, ...args))
		}

		static print(bgColor, entry) {
			entry.style.backgroundColor = bgColor
			HijackedConsole.history.push(entry)
			HijackedConsole.instances.forEach((instance) => {
				instance.appendEntry(entry)
			})
		}

		static on(event, handler) {
			HijackedConsole.addEventListener(event, handler)
		}

		static addEventListener(event, handler) {
			const bucket = HijackedConsole.listeners[event] || []
			if (bucket.indexOf(handler) !== -1) return
			bucket.push(handler)
			HijackedConsole.listeners[event] = bucket
		}

		static off(event, handler) {
			HijackedConsole.removeEventListener(event, handler)
		}

		static removeEventListener(event, handler) {
			const bucket = HijackedConsole.listeners[event]
			if (bucket == null) return
			const index = bucket.indexOf(handler)
			if (index === -1) return
			bucket.splice(index, 1)
			HijackedConsole.listeners[event] = bucket
		}

		static emit(event, data) {
			const eventBucket = HijackedConsole.listeners[event]
			const anyBucket = HijackedConsole.listeners['any']
			const bucket = eventBucket && anyBucket ? eventBucket.concat(anyBucket) : eventBucket || anyBucket
			if (!bucket) return
			if (typeof data === 'object' && data != null) data.toString = (indent) => HijackedConsole.toStringDeep(data, indent)
			bucket.forEach((handler) => handler(data))
		}

		static toString(indent = 0) {
			return HijackedConsole.toStringDeep(
				HijackedConsole.history.map((e) => {
					const entry = {
						time: e.time == null ? undefined : e.time.getTime(),
						args: e.objects
					}
					if (e.trace != null) {
						entry.trace = e.trace
					}
					return entry
				}),
				indent
			)
		}

		static hijack() {
			if (HijackedConsole.hijacked) return
			HijackedConsole.originals = [
				hijackFunction(console, 'log', HijackedConsole.log),
				hijackFunction(console, 'debug', HijackedConsole.debug),
				hijackFunction(console, 'info', HijackedConsole.info),
				hijackFunction(console, 'warn', HijackedConsole.warn),
				hijackFunction(console, 'error', HijackedConsole.error)
			]
			HijackedConsole.hijacked = true
		}

		static release() {
			if (!HijackedConsole.hijacked) return
			;['log', 'debug', 'info', 'warn', 'error'].forEach((prop, i) => {
				if (console[prop].revoke !== undefined) console[prop].revoke()
				console[prop] = HijackedConsole.originals[i]
			})
			HijackedConsole.hijacked = false
		}
	}

	HijackedConsole.listeners = []
	HijackedConsole.history = []
	HijackedConsole.instances = []
	HijackedConsole.hijacked = false
	customElements.define('mdev-console', HijackedConsole)
	customElements.define('mdev-input', ConsoleInput)

	window.HijackedConsole = {
		on: HijackedConsole.on,
		off: HijackedConsole.off,
		addEventListener: HijackedConsole.addEventListener,
		removeEventListener: HijackedConsole.removeEventListener,
		toString: HijackedConsole.toString,
		hijack: HijackedConsole.hijack,
		release: HijackedConsole.release,
		__setResult: HijackedConsole.__setResult
	}
})()
