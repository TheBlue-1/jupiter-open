/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

const showNotification = registration.showNotification.bind(registration)
registration.showNotification = (title, options) => {
	options = options || {}
	options.badge = options.badge || '/DATA/logo/logo192alpha.png'
	options.icon = options.icon || '/DATA/logo/logo256.png'
	showNotification(title, options)
}

importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js')

firebase.initializeApp({
	apiKey: 'AIzaSyBuQPKxuSxya9ba3gl6qU6plz6KVnsK4us',
	authDomain: 'jupiter-7b73a.firebaseapp.com',
	databaseURL: 'https://jupiter-7b73a.firebaseio.com',
	projectId: 'jupiter-7b73a',
	storageBucket: 'jupiter-7b73a.appspot.com',
	messagingSenderId: '292198005223',
	appId: '1:292198005223:web:9cafc933ace259db99a542'
})
firebase.messaging()

const CACHE_VERSION = '1.8.6.6'
const CACHE_NAME = 'cache-v' + CACHE_VERSION
const NOCACHE_URL = '/nocache/'
var requestsToCache = [
	{url: '/manifest.webmanifest'},
	{url: '/JS/'},
	{url: '/JS/api/jquery-3.5.1-slim.js'},
	{url: '/JS/api/datalist-polyfill.min.js'},
	{url: '/DATA/logo/logo.svg'},
	{url: 'https://www.gstatic.com/firebasejs/7.21.1/firebase-app.js', init: {mode: 'no-cors'}},
	{url: 'https://www.gstatic.com/firebasejs/7.21.1/firebase-messaging.js', init: {mode: 'no-cors'}},
	{url: NOCACHE_URL}
]

const offlineResponse = {
	status: 444,
	stausText: 'Server Not Reachable',
	ok: false,
	headers: {
		'Content-Type': 'text/plain'
	},
	type: 'error'
}

self.addEventListener('activate', (event) => {
	console.log('[SW] Service Worker activating')
	var cacheWhitelist = [CACHE_NAME]
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				console.log('[SW] Found caches: ' + JSON.stringify(cacheNames))
				if (!cacheNames.includes(CACHE_NAME)) {
					addRequestsToCache(requestsToCache)
				}
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheWhitelist.indexOf(cacheName) === -1) {
							console.log('[SW] Deleted cache "' + cacheName + '"')
							return caches.delete(cacheName)
						}
					})
				)
			})
			.then(() => {
				console.log('[SW] Claiming all clients')
				return clients.claim() //Take control immediately
			})
	)
})

function addRequestsToCache(reqs) {
	caches.open(CACHE_NAME).then((cache) => {
		console.log('[SW] Opened cache "' + CACHE_NAME + '"')
		return cache.addAll(reqs.map((req) => new Request(req.url, req.init))).catch(console.error)
	})
}

self.addEventListener('install', (event) => {
	// Perform install steps
	console.log('[SW] Service Worker installing')
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(async (cache) => {
				console.log('[SW] Opened cache "' + CACHE_NAME + '"')
				let [opaque, transparent] = requestsToCache.reduce(
					([o, t], req) => {
						if (req.init && req.init.mode == 'no-cors') {
							o.push(req)
						} else {
							t.push(req)
						}
						return [o, t]
					},
					[[], []]
				)
				await cache.addAll(transparent.map((req) => new Request(req.url, {...req.init, cache: 'reload'}))).catch(console.error)
				await Promise.allSettled(opaque.map((req) => fetch(req.url, {...req.init, cache: 'reload'}))).catch(console.error)
			})
			.then(() => {
				console.log('[SW] Skipping SW waiting')
				return self.skipWaiting()
			})
	)
})

self.addEventListener('fetch', (event) => {
	console.log('[SW] Fetch request info; Type: ' + event.request.method + ' to ' + event.request.url + '; cache: ' + event.request.cache)

	if (event.request.method == 'GET' || event.request.method == 'HEAD') {
		const cache = getFromCache(event.request)
		event.respondWith(cache.then((cache) => (cache.ok ? cache.response : cache.response.clone())))
		event.waitUntil(
			cache.then(async (cache) => {
				if (cache.ok) {
					await updateRequest(event.request).then((resp) => {
						if (!resp) {
							console.warn('[SW] No Response from: ' + event.request.url)
						}
					})
				} else {
					await updateResponse(cache.response, event.request)
				}
			})
		)
	}
})

function getFromCache(req) {
	console.log('[SW] Getting cache for: ' + req.url)
	return caches.match(req).then((resp) => {
		if (resp && req.mode == 'no-cors') {
			console.log('[SW] Got cache: opaque')
			return {response: resp, ok: true}
		}
		if (resp) console.log('[SW] Got cache: ' + resp.statusText + ' ' + resp.url)
		else console.log('[SW] Got cache: null')
		// Cache hit - return response
		if (resp != null && resp.ok) return {response: resp, ok: true}

		// Else fetch from server
		return fetch(req, {cache: 'reload'})
			.then((resp) => {
				return {response: resp, ok: false}
			})
			.catch((error) => {
				console.warn(error)
				//No cache and offline
				if (req.mode == 'navigate') {
					return caches.match(NOCACHE_URL).then((resp) => {
						if (resp) return {response: resp, ok: false}
						//nocache.html isn't cached
						return {response: Response.error(), ok: false}
					})
				} else {
					return {response: offlineResponse, ok: false}
				}
			})
	})
}

function updateRequest(req) {
	const cacheControlPolicy = req.headers ? req.headers.get('Cache-Control') || '' : ''
	if (cacheControlPolicy.includes('no-store')) {
		console.log('[SW] NOT Updating response to ' + req.url + ' (no-store is set)')
		return
	}

	console.log('[SW] Updating response to ' + req.url)
	return fetch(req.clone())
		.then((resp) => updateResponse(resp, req))
		.catch((error) => {
			console.warn("[SW] Can't update response to '" + req.url + "': " + error)
		})
}

async function updateResponse(resp, req) {
	const cache = await caches.open(CACHE_NAME).catch((error) => {
		console.warn("[SW] Could not open cache '" + CACHE_NAME + "' for: " + req.url + ' beacuse ' + error)
	})
	if (!cache) return resp

	if (req.mode == 'no-cors') {
		return cache.put(req, resp.clone()).then(() => {
			console.log("[SW] Put response to '" + req.url + "' into cache")
			return resp
		})
	}
	const cacheControlPolicy = resp.headers ? resp.headers.get('Cache-Control') || '' : ''
	const pargma = resp.headers ? resp.headers.get('Pragma') || '' : ''
	if (cacheControlPolicy.includes('no-store') || pargma.includes('no-store')) {
		console.log('[SW] DID NOT Update response to ' + req.url + ' (no-store is set)')
		return resp
	}

	console.log('[SW] Updated response to: ' + req.url + ', got: ' + resp.statusText + ' from: ' + resp.url)
	if (resp.status < 400)
		return cache.put(req, resp.clone()).then(() => {
			console.log("[SW] Put response to '" + req.url + "' into cache")
			return resp
		})
	else {
		console.log("[SW] NOT putting response to '" + req.url + "' into cache, response.status>=400")
		return resp
	}
}

self.addEventListener('message', (event) => {
	console.log('[SW] SW Copy: ' + JSON.stringify(event.data))
	if (event.data.command) {
		if (event.data.command == 'clearCache') {
			event.waitUntil(
				caches.delete(CACHE_NAME).then(() => {
					event.ports[0].postMessage('Cleared Cache')
					console.log('[SW] Cleared Cache')
					addRequestsToCache(requestsToCache)
					return true
				})
			)
		} else if (event.data.command == 'reloadCache') {
			console.log('[SW] Reloading Cache')
			event.waitUntil(
				caches.open(CACHE_NAME).then((cache) => {
					cache
						.keys()
						.then((keys) =>
							Promise.allSettled(
								keys.map((req) => {
									console.log('[SW] Reloading ' + req.url)
									return fetch(req, {credentials: 'same-origin', cache: 'reload'})
										.then((resp) => {
											cache.put(req, resp)
										})
										.catch((error) => {
											console.warn('[SW] Failed to update ' + req.url + ': ' + error)
										})
								})
							)
						)
						.then(() => event.ports[0].postMessage('Reloaded Cache'))
				})
			)
		}
	} else event.ports[0].postMessage('Copy?')
})

function messageClient(client, type, data, eTag) {
	console.log('[SW] Messaging Client (' + client.url + '): ' + type + ' "' + data + '"')
	return new Promise((resolve, reject) => {
		var msg_chan = new MessageChannel()

		msg_chan.port1.onmessage = (event) => {
			if (event.data.error) {
				reject(event.data.error)
			} else {
				resolve(event.data)
			}
		}

		var msg = {
			type: type,
			data: data,
			eTag: eTag
		}

		client.postMessage(msg, [msg_chan.port2])
	})
}

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const action = event.notification.data.click_action
	event.waitUntil(
		clients
			.matchAll({
				type: 'window'
			})
			.then((clientList) => {
				for (const client of clientList) {
					if (client.focused) {
						if (action) return client.navigate(action)
						return
					} else if ('focus' in client)
						return client.focus().then(() => {
							if (action) client.navigate(action)
						})
				}
				if (action && clients.openWindow) return clients.openWindow(action)
			})
	)
})
