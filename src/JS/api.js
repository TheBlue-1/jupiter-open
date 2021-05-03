const WebUntis = {
	CACHE: {
		CB_NONE: 0,
		CB_SCHOOL: 1,
		CB_SCHOOL_AND_UN: 2
	},
	handledAjax: async function (params = null, useCache = false, makeCache = false, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		var result = await handleErrors(this.ajax(params, useCache, makeCache, cacheBuster))
		return result ? result : new Result(undefined, undefined)
	},
	ajax: async function (params = null, useCache = false, makeCache = false, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		let cacheBusterString = ''
		switch (cacheBuster) {
			case WebUntis.CACHE.CB_SCHOOL_AND_UN:
				if (me == null || me.username == null) {
					useCache = false
					makeCache = false
				} else cacheBusterString += me.username
			case WebUntis.CACHE.CB_SCHOOL:
				if (me == null || me.school == null) {
					useCache = false
					makeCache = false
				} else cacheBusterString += me.school
		}
		params.push(['_', btoa(cacheBusterString)])
		params = params.filter((p) => p[1] != null)
		params = new URLSearchParams(params).toString()

		const resp = new Promise((resolve, reject) => {
			ajax('/PHP/ajax.php', {
				body: params,
				method: 'POST'
			})
				.then(async (resp) => {
					if (!resp.ok) throw resp
					const data = await resp.text()
					if (makeCache) cache.set('ajaxRequest-' + params, data, 1)
					resolve(data)
				})
				.catch(async (error) => {
					if (error instanceof FetchError) {
						if (error.status == 444) {
							return
						}
						if (!error.jptrErr) return reject(error)
						if (error.jptrErr.code == '#error003') {
							fakeLogout()
						}
						reject(phpError(error.jptrErr))
					}
				})
		})

		if (!useCache) {
			return new Result(await resp)
		}

		const cacheResp = cache.get('ajaxRequest-' + params)
		const race = await Promise.race([
			cacheResp.then(async (value) => {
				if (value != null) {
					return {loser: resp, winner: value}
				} else {
					return {loser: undefined, winner: await resp}
				}
			}),
			resp.then((value) => ({loser: cacheResp, winner: value}))
		])

		return new Result(race.winner, race.loser)
	},
	login: function (username, password, school, remember = false) {
		return WebUntis.handledAjax([
			['type', 'login'],
			['username', username],
			['password', password],
			['school', school],
			['saveLogin', remember]
		])
	},
	logout: function () {
		return WebUntis.handledAjax([['type', 'logout']])
	},
	getTeachers: function (date = new Date(), useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'teachers'],
				['date', date]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getSubjects: function (date = new Date(), useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'subjects'],
				['date', date]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getRooms: function (date = new Date(), buildingID = '', useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'rooms'],
				['date', date],
				['bdid', buildingID]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getStudents: function (date = new Date(), classID = '', useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'students'],
				['date', date],
				['classId', classID]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getGroups: function (date = new Date(), useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'classes'],
				['date', date]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	/*Type can be "teacher","class","subject","room" and "student"*/
	getTimegrid: function (type, id, date = new Date(), useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		date = DateFormat.inYYYYMMDD(DateFormat.toMonday(date), '-')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'timegrid'],
				['timegridType', typeToInt[type]],
				['date', date],
				['id', id]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	whoAmI: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'personalInfo']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getGroupsAlt: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'classes2']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getInfo: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'info']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getAvailableRooms: function (startDate, endDate, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'availableRooms'],
				['startDate', startDate.toISOString().slice(0, -8) + 'Z'],
				['endDate', endDate.toISOString().slice(0, -8) + 'Z']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getNews: function (date = new Date(), useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		data = DateFormat.inYYYYMMDD(date, '')
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'news'],
				['date', data]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getAbsence: function (studentId, startDate, endDate, excuseStatus = '', useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'absence'],
				['stid', studentId],
				['astartdate', DateFormat.inYYYYMMDD(startDate, '')],
				['aenddate', DateFormat.inYYYYMMDD(endDate, '')],
				[excuseStatus == '' ? '' : 'excusestatus', excuseStatus]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getRoles: function (startDate, endDate, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'roles'],
				['rstartdate', DateFormat.inYYYYMMDD(startDate, '')],
				['renddate', DateFormat.inYYYYMMDD(endDate, '')]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getTimegridPeriodInfo: function (date, type, id, startTime = null, endTime = null, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'timegridPeriodInfo'],
				['date', date],
				['ownerType', type],
				['id', id],
				['startTime', startTime],
				['endTime', endTime]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getHomeworks: function (startDate, endDate, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'homeworks'],
				['hstartdate', DateFormat.inYYYYMMDD(startDate, '')],
				['henddate', DateFormat.inYYYYMMDD(endDate, '')]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getExams: function (startDate, endDate, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'exams'],
				['estartdate', DateFormat.inYYYYMMDD(startDate, '')],
				['eenddate', DateFormat.inYYYYMMDD(endDate, '')]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getReport: function (startDate, endDate, splittype, ids, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'report'],
				['restartdate', DateFormat.inYYYYMMDD(startDate, '')],
				['reenddate', DateFormat.inYYYYMMDD(endDate, '')],
				['splittype', splittype],
				['ids', ids]
			],
			false,
			cacheBuster
		)
	},
	getReportInfo: function (cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'reportInfo']
			],
			false,
			cacheBuster
		)
	},
	getConsultationHours: function (date = new Date(), classID = '', useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'consultationHours'],
				['date', DateFormat.inYYYYMMDD(date, '')],
				['clid', classID]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getRegisteredConsultations: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'consultationRegs']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getTableLayout: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'timegridInfo']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getJupiterEvents: function (startTimeStamp = '', endTimeStamp = '', type = '', useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'getEvents'],
				['startTime', startTimeStamp],
				['endTime', endTimeStamp],
				['eventType', type]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getTeachersClasses: function (useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL_AND_UN) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'teachersClasses']
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	getConsultationRegInfo: function (period, teacher, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'consultationRegInfo'],
				['period', period],
				['teacher', teacher]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	},
	downloadReport: function (id, useCache = true, makeCache = true, cacheBuster = WebUntis.CACHE.CB_SCHOOL) {
		return WebUntis.handledAjax(
			[
				['type', 'get'],
				['getType', 'downloadReport'],
				['id', id]
			],
			useCache,
			makeCache,
			cacheBuster
		)
	}
}
class Result {
	first
	second
	firstOnline
	secondExists
	exists
	constructor(first, second) {
		this.first = first
		this.second = second
		this.exists = first ? true : false
		this.secondExists = second ? true : false
		this.firstOnline = !this.secondExists
	}
}
