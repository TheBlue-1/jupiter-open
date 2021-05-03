'use strict'

class IDB {
	/** @type {IDBFactory} */
	static idb = globalThis.indexedDB || globalThis.mozIndexedDB || globalThis.webkitIndexedDB || globalThis.msIndexedDB
	/** @type {IDBDatabase} */
	db
	__ready
	error
	constructor(name, stores = {}, version) {
		const req = IDB.idb.open(name, version)
		req.onupgradeneeded = () => {
			const db = req.result

			for (const store of db.objectStoreNames) {
				db.deleteObjectStore(store)
			}

			for (const storeName in stores) {
				const options = stores[storeName]
				const os = db.createObjectStore(storeName, options)
				for (const indexName in options.indices) {
					const index = options.indices[indexName]
					os.createIndex(indexName, index.keyPath, index)
				}
			}
		}
		this.__ready = IDB.promise(req).then((db) => {
			this.db = db
			return this
		})
		this.__ready.catch((e) => {
			this.error = e
			if (e.name == 'VersionError') new Toast('Diese Version ist zu alt, bitte lade die Seite neu.', 3)
		})
	}

	get ready() {
		return this.__ready
	}

	access(...stores) {
		let tx
		try {
			tx = this.db.transaction(stores, 'readwrite')
		} catch (error) {
			this.error = error
			return {}
		}
		const ret = {}
		for (const store of stores) {
			ret[store] = tx.objectStore(store)
		}
		return ret
	}

	static promise(obj) {
		return new Promise((resolve, reject) => {
			obj.onsuccess = () => {
				resolve(obj.result)
			}
			obj.onerror = () => {
				reject(obj.error)
			}
		})
	}
}

var cache = (() => {
	const CACHE_VERSION = 5

	/** @type {IDB} */
	let cacheDB = new IDB(
		'cache',
		{
			cache: {
				keyPath: 'key',
				indices: {expire: {keyPath: 'expires'}}
			}
		},
		CACHE_VERSION
	)
	cacheDB.ready.then(async (db) => {
		let {cache} = db.access('cache')
		cache.index('expire').openCursor(IDBKeyRange.upperBound(Date.now())).onsuccess = (ev) => {
			const cursor = ev.target.result
			if (!cursor) return
			cursor.delete()
			cursor.continue()
		}
	})

	return {
		async set(key, data, lifetime) {
			await cacheDB.ready
			let {cache} = cacheDB.access('cache')
			const expireDate = DateFormat.addDays(new Date(), lifetime)
			let expireTime = expireDate.getTime()
			if (lifetime == null) expireTime = null

			await IDB.promise(cache.put({key: key, data: data, expires: expireTime}))
		},
		async get(key) {
			await cacheDB.ready
			let {cache} = cacheDB.access('cache')
			const entry = await IDB.promise(cache.get(key))
			if (entry == null) return
			const {data, expires} = entry
			if (expires != null && expires <= Date.now()) {
				await IDB.promise(cache.delete(key))
				return
			}
			return data
		},
		async clear() {
			await cacheDB.ready
			let {cache} = cacheDB.access('cache')
			await IDB.promise(cache.clear())
		}
	}
})()
