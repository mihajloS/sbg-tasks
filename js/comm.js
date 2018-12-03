// Source of http communication - API

// urls
const urlUser     = 'https://cavatica-api.sbgenomics.com/v2/user'
const urlTasks    = 'https://cavatica-api.sbgenomics.com/v2/tasks?fields=_all'
const urlTask     = 'https://cavatica-api.sbgenomics.com/v2/tasks/'
const urlBilling  = 'https://cavatica-api.sbgenomics.com/v2/billing/groups'
const urlProjects = 'https://cavatica-api.sbgenomics.com/v2/projects'

// headers
const authTokenHeader = [{name: 'X-SBG-Auth-Token', val: 'dfc3d93282b44bc185991bb2f67c9f6f'}, 
						 {name: 'content-type', val: 'application/json'}]

const METHOD_GET    = 'GET'
const METHOD_DELETE = 'DELETE'
const METHOD_POST   = 'POST'

// Deal with http communication
class Communicator {
	constructor() {
		this.Http = new XMLHttpRequest()
		this.requestOnGoing = false
		this.queueOfRequests = []
	}

	// queue request in strict format but don't executed them
	addReqToQueue(url, headers, reqType, params, cb) {
		if (typeof url !== 'string' || url.length < 7)
			return console.error('Bad url')
		headers = (headers instanceof Array) === true ? headers : []
		params = typeof params !== 'string' ? '' : params
		cb = (typeof cb === 'function') === true ? cb : null
		this.queueOfRequests.push({url: url, headers: headers, reqType: reqType, params: params, cb: cb})
	}

	// execute requests from queue
	startRequestSequence() {
		if (this.queueOfRequests.length === 0)
			return console.log('end of requests')
		if (this.requestOnGoing === true)
			return console.log('prevented!') // prevent overriding requests
			
		this.requestOnGoing = true
		var reqData = this.queueOfRequests.shift()
		this.Http.open(reqData.reqType, reqData.url)
		this.Http.timeout = 10000;
		// set headers
		for (var i = reqData.headers.length - 1; i >= 0; i--) {
			this.Http.setRequestHeader(reqData.headers[i].name, reqData.headers[i].val)
		}
		if (reqData.reqType == METHOD_POST)
			this.Http.send(reqData.params)	
		else
			this.Http.send()
		var self = this
		this.Http.onreadystatechange = function() {
			// uncomment next two lines in case of disaster
			// console.log('readyState =', this.readyState) 
			// console.log('status =', this.status)
			// handle data
			if (this.readyState == 4 && this.status >= 200 && this.status < 300) {
				reqData.cb(true, this.responseText)
				self.requestOnGoing = false;
				self.startRequestSequence();
				return
			}
			// http error
			if (this.readyState == 4) {
				console.error('HTTP error: ' + this.status + ' response: ' + this.responseText)
				reqData.cb(false, null) // fixme: there is room for custom error
				self.requestOnGoing = false;
				self.startRequestSequence();
			}
		}
	}

	_buildRequestPromise(query, headers, METHOD, params) {
		var promise = new Promise((resolve, reject) => {
			this.addReqToQueue(query, headers, METHOD, params, function(success, data) {
				success ? resolve(data) : reject()
			})
		})
		this.startRequestSequence()
		return promise
	}
}

// Deal with specific sbg API
class SBGCommunicator extends Communicator {
	constructor() {
		super()
		this.billingID = null
		this.taskLimit = ''
		this.taskStatus = ''
	}

	set limitTasks(limit) { this.taskLimit = '&limit=' + limit }

	set limitStatus(status) { this.taskStatus = '&status=' + status }

	// API start ------------------------------

	deleteTask(taskID) {
		var deleteQuery = urlTask + taskID;
		var promise = this._buildRequestPromise(deleteQuery, authTokenHeader, METHOD_DELETE, null)
		return promise
	}

	getUsername() {
		var self = this
		var promise = new Promise((resolve, reject) => {
			this.addReqToQueue(urlUser, authTokenHeader, METHOD_GET, null, function(success, rawData) {
				if (!success) { reject() }
				else {
					var username = self._getUsernameFromRaw(rawData)
					username === null ? reject() : resolve(username)
				}
			})
		})
		this.startRequestSequence()
		return promise
	}

	getTasks() {
		var queryParameters = this.taskStatus + this.taskLimit
		var url = urlTasks + queryParameters
		var self = this
		var promise = new Promise((resolve, reject) => {
			this.addReqToQueue(url, authTokenHeader, METHOD_GET, null, function(success, rawData) {
				if (!success) { reject() }
				else {
					var tasks = self._getTasksFromRaw(rawData)
					tasks === null ? reject() : resolve(tasks)
				}
			})
		})
		this.startRequestSequence()
		return promise
	}

	getTask(id) {
		var url = urlTask + id
		var self = this
		var promise = new Promise((resolve, reject) => {
			this.addReqToQueue(url, authTokenHeader, METHOD_GET, null, function(success, rawData) {
				if (!success) { reject() }
				else {
					var task = SBGCommunicator.safeJSONParse(rawData)
					task === null ? reject() : resolve(task)
				}
			})
		})
		this.startRequestSequence()
		return promise
	}

	getBillingId() {
		// clear project name
		var promise
		// check is there billing id in cache
		if (this.billingID !== null) {
			console.log('Using billing id from cache', this.billingID)
			promise = new Promise((resolve, reject) => {
				resolve(this.billingID)
			})
			return promise
		}
		// no billing id in cache, make request
		var self = this
		promise = new Promise((resolve, reject) => {
			this.addReqToQueue(urlBilling, authTokenHeader, METHOD_GET, null, function(success, data) {
				if (!success) { reject() }
				else {
					self.billingID = self._getBillingIDFromRaw(data)
					self.billingID === null ? reject() : resolve(self.billingID)
				}

			})
		})
		this.startRequestSequence()
		return promise
	}

	addProject(name) {
		if (this.billingID === null){
			return new Promise((resolve, reject) => {
				console.error('Missing billingID. use "getBillingId" before "addProject" API function')
				reject()
			})
		}
		// Note: Documentation says that property "name" in payload should be called "project" <- Using "name" since "project" won't work
		var params = JSON.stringify({"billing_group": this.billingID, "name": name})
		return this._buildRequestPromise(urlProjects, authTokenHeader, METHOD_POST, params)
	}

	// API end ------------------------------

	_getBillingIDFromRaw(rawData) {
		var data = SBGCommunicator.safeJSONParse(rawData);
		if (data === null || !data.hasOwnProperty('items') || !(data.items instanceof Array) || data.items.length === 0
			|| !data.items[0].hasOwnProperty('id') || typeof data.items[0].id !== 'string') {
			console.error('Failed billing id parse', rawData)
			return null
		}
			
		return data.items[0].id
	}

	_getTasksFromRaw(rawData) {
		var data = SBGCommunicator.safeJSONParse(rawData)
		console.log(data)
		if (typeof data !== 'object' || data === null || !data.hasOwnProperty('items') || !(data.items instanceof Array)) {
			console.error('Failed task parse: ', rawData)
			return null
		}
		return data.items
	}

	_getUsernameFromRaw(rawData) {
		var data = SBGCommunicator.safeJSONParse(rawData)
		if (data === null || !data.hasOwnProperty('username') || typeof data.username !== 'string') {
			console.error('Failed username parse', rawData)
			return null
		}
		return data.username
	}

	// may be an overkill but who knows
	static safeJSONParse(text) {
		try { return JSON.parse(text) }
		catch(e) {
			console.log(e)
			return null
		}
	}
}