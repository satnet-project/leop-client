/*
JSON RPC library for Javascript. Source:
https://github.com/Mtnt/jsonRPC.js
*/

(function (window) {
	var requestId = 1;

	/**
	 * Request class
	 *
	 * @param {JsonRPC} JsonRPCInstance
	 * @param methodName
	 * @param {Array} data
	 * @param {boolean} isNotification
	 *
	 * @return JsonRPCRequest
	 */
	function JsonRPCRequest(JsonRPCInstance, methodName, data, isNotification) {
		if (data != undefined && !(data instanceof Object)) {
			throw 'The parameters for the ' + methodName + '() must be passed as an array or an object; the value you supplied (' + String(data) + ') is of type "' + typeof(data) + '".';
		}

		this.rpcInstance      = JsonRPCInstance;
		this._isNotification  = isNotification;

		// prepare request
		this._request = {
			jsonrpc: this.rpcInstance._protocolVersion,
			method: methodName
		};
		if (data != undefined) {
			this._request.params = data;
		}
		if (!this._isNotification) {
			this._request.id = requestId++;
		}

		return this;
	}

	JsonRPCRequest.prototype.successHandler   = function() {};
	JsonRPCRequest.prototype.exceptionHandler = function() {};
	JsonRPCRequest.prototype.completeHandler  = function() {};

	/**
	 * Add success callback to the request;
	 * Callback will gets result-object from response
	 *
	 * @param callback
	 *
	 * @return JsonRPCRequest
	 */
	JsonRPCRequest.prototype.onSuccess = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onSuccess handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.successHandler = callback;
			}
		}
		return this;
	};

	/**
	 * Add exception callback to the request;
	 * Callback will gets error-object or string;
	 *
	 * @param callback
	 *
	 * @return JsonRPCRequest
	 */
	JsonRPCRequest.prototype.onException = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onException handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.exceptionHandler = callback;
			}
		}

		return this;
	};

	/**
	 * Add callback to the request, it will be called when response will be got (independently on result of request);
	 * Callback doesn`t gets any parameters;
	 *
	 * @param callback
	 *
	 * @return JsonRPCRequest
	 */
	JsonRPCRequest.prototype.onComplete = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onComplete handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.completeHandler = callback;
			}
		}

		return this;
	};

	/**
	 * Send the request
	 */
	JsonRPCRequest.prototype.execute = function() {
		doRequest(this.rpcInstance._requestURL, this.rpcInstance._authUsername, this.rpcInstance._authPassword, this._request, (function(requestInstance) {
			return function(response) {
				var result = handleRequestResponse(requestInstance, response.code, response.message);

				if (result === false) {
					result = requestInstance.rpcInstance.exceptionHandler({code: response.code, message: response.message});
				} else if (result == null) {
					result = requestInstance.rpcInstance.successHandler(response.message);
				}

				if (!result) {
					requestInstance.rpcInstance.completeHandler();
				}
			}
		})(this));
	};

	function handleRequestResponse(request, responseCode, responseMessage) {
		if (responseCode == 200 && request._isNotification) {
			if (responseMessage != '') {
				setTimeout(function() {
					throw 'Request "' + JSON.stringify(request) + '" specified as notification have got response message "' + JSON.stringify(responseMessage) + '"';
				}, 0);
			}

			return true;
		}

		//if (responseCode == 200 && responseMessage.hasOwnProperty('result')) {
		// Replace by the line above when the issue 32	of RPC4Django (https://github.com/davidfischer/rpc4django/issues/32)
		// gets solved
		if (responseCode == 200 && responseMessage.result != null) {			
			if (request.successHandler(responseMessage.result)) {
				return true;
			}
		} else {
			//if (responseCode != 200 || responseMessage.hasOwnProperty('error')) {
			// Replace by the line above when the issue 32	of RPC4Django (https://github.com/davidfischer/rpc4django/issues/32)
			// gets solved				
			if (responseCode != 200 || responseMessage.error != null) {				
				var exception = {};
				if (responseCode != 200) {
					exception.code    = responseCode;
					exception.message = responseMessage;
				} else {
					exception = responseMessage.error;
				}

				if (request.exceptionHandler(exception)) {
					return true;
				}
			} else {
				// Exception shouldn‘t stop the function executing
				setTimeout(function() {
					throw 'The JSON RPC response "responseCode: ' + JSON.stringify(responseCode) + '; responseMessage: ' + JSON.stringify(responseMessage) + ';" hasn`t properties "result" and "error".';
				}, 0);
			}

			var isError = true;
		}

		if (request.completeHandler()) {
			return true;
		}

		if (isError) {
			return false;
		}

		return null;
	}


	/**
	 * Batch class
	 *
	 * @param {JsonRPC} JsonRPCInstance
	 *
	 * @return JsonRPCBatch
	 */
	function JsonRPCBatch(JsonRPCInstance) {
		this.rpcInstance = JsonRPCInstance;

		this._requests = [];
		this._objects  = {};

		return this;
	}

	/**
	 * Add request to the batch
	 *
	 * @param {JsonRPCRequest} requestObj
	 *
	 * @return JsonRPCBatch
	 */
	JsonRPCBatch.prototype.addRequest = function(requestObj) {
		if (!(requestObj instanceof JsonRPCRequest)) {
			throw 'The parameter for addRequest() must be instance of JsonRPCRequest; the value you provided (' + String(requestObj) + ') is of type "' + typeof(requestObj) + '".';
		}

		var body = requestObj._request;

		this._requests[this._requests.length] = body;

		if (!requestObj._isNotification) {
			this._objects[body.id] = requestObj;
		}

		return this;
	};

	/**
	 * Add several request to the batch simultaneously
	 *
	 * @param {JsonRPCRequest[]} requestsArr
	 *
	 * @return JsonRPCBatch
	 */
	JsonRPCBatch.prototype.addRequests = function(requestsArr) {
		if (!(requestsArr instanceof Array)) {
			throw 'The parameter for the addRequests() must be passed as an array; the value you supplied (' + String(requestsArr) + ') is of type "' + typeof(requestsArr) + '".';
		}

		for (var i = 0; i < requestsArr.length; i++) {
			this.addRequest(requestsArr[i]);
		}

		return this;
	};

	JsonRPCBatch.prototype.successHandler   = function() {};
	JsonRPCBatch.prototype.exceptionHandler = function() {};
	JsonRPCBatch.prototype.completeHandler  = function() {};

	/**
	 * Add success callback to the batch;
	 * Callback will gets all response
	 *
	 * @param callback
	 *
	 * @return JsonRPCBatch
	 */
	JsonRPCBatch.prototype.onSuccess = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onSuccess handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.successHandler = callback;
			}
		}

		return this;
	};

	JsonRPCBatch.prototype.onException = function(callback) {
		if (callback) {
			if (typeof(callback) != 'function') {
				throw 'The onException handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			this.exceptionHandler = callback;
		}

		return this;
	};
	/**
	 * Add callback to the batch, it will be called when response will be got (independently on result of request);
	 * Callback doesn`t gets any parameters;
	 *
	 * @param callback
	 *
	 * @return JsonRPCBatch
	 */
	JsonRPCBatch.prototype.onComplete = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onComplete handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.completeHandler = callback;
			}
		}

		return this;
	};

	/**
	 * Send the batch
	 */
	JsonRPCBatch.prototype.execute = function() {
		doRequest(this.rpcInstance._requestURL, this.rpcInstance._authUsername, this.rpcInstance._authPassword, this._requests, (function(batchInstance) {
			return function(response) {
				var result = handleBatchResponse(batchInstance, response.code, response.message);

				if (result === false) {
					result = batchInstance.rpcInstance.exceptionHandler({code: response.code, message: response.message});
				} else if (result == null) {
					result = batchInstance.rpcInstance.successHandler(response.message);
				}

				if (!result) {
					batchInstance.rpcInstance.completeHandler();
				}
			}
		})(this));
	};

	function handleBatchResponse(batch, responseCode, responseMessage) {
		// Each request in the batch was sent as notification
		if (Object.keys(batch._objects).length == 0) {
			if (responseMessage != '') {
				setTimeout(function() {
					throw 'Batch call "' + JSON.stringify(batch._requests) + '" in which each request was specified as notification have got response message "' + JSON.stringify(responseMessage) + '".';
				}, 0);
			}

			return true;
		}

		var id;
		var index;
		var error;

		// HTTP error is occurred
		if (responseCode != 200 && responseCode > 0) {
			error = {
				code: responseCode,
				message: 'Http error is occurred. Response message: ' + JSON.stringify(responseMessage) + '.',
				data: null
			};

		// Unexpected result is returned: Server error is occurred
		} else if (!(responseMessage instanceof Object)) {
			error = {
				code: -32001,
				message: 'Server error is occurred. Object was expected, received: ' + JSON.stringify(responseMessage) + '.',
				data: null
			};

		// Parse error was occurred
		} else if (responseMessage instanceof Object && !(responseMessage instanceof Array) && responseMessage.hasOwnProperty('error') && responseMessage.error.hasOwnProperty('code') && responseMessage.error.code == -32700) {
			error = {
				code: -32700,
				message: 'Parse error is occurred.',
				data: null
			};
		}

		/**
		 * @type {Boolean|Null} result can be:
		 *  null  - don‘t stop handling and don‘t execute batch.exceptionHandler();
		 *  false - don‘t stop handling and execute batch.exceptionHandler();
		 *  true  - stop handling
		 */
		var result = null;
		for (index in batch._objects) {
			if (!batch._objects.hasOwnProperty(index)) {
				continue;
			}

			var response = undefined;

			// If some batch error was occurred
			if (error != undefined) {
				response = {
					jsonrpc: batch._objects[index]._request.jsonrpc,
					id: batch._objects[index]._request.id,
					error: error
				};
			} else {
				if (Object.keys(batch._objects).length == 1 && (responseMessage instanceof Object) && !(responseMessage instanceof Array) && responseMessage.hasOwnProperty('id') && batch._objects[index]._request.id == responseMessage.id) {
					response = responseMessage;
				} else if (Object.keys(batch._objects).length > 1 && responseMessage instanceof Array) {
					for (var responseIndex in responseMessage) {
						if (!responseMessage.hasOwnProperty(responseIndex)) {
							continue;
						}

						if (responseMessage[responseIndex].hasOwnProperty('id') && responseMessage[responseIndex].id == batch._objects[index]._request.id) {
							if (response != undefined) {
								response = {
									jsonrpc: batch._objects[index]._request.jsonrpc,
									id: batch._objects[index]._request.id,
									error: {
										code: -32001,
										message: 'This request have got several responses in batch.',
										data: null
									}
								}
							} else {
								response = responseMessage[responseIndex];
							}
						}
					}
				}

				if (response == undefined) {
					response = {
						jsonrpc: batch._objects[index]._request.jsonrpc,
						id: batch._objects[index]._request.id,
						error: {
							code: -32001,
							message: 'This request haven‘t got response.',
							data: null
						}
					};
				}
			}
			var requestResult = handleRequestResponse(batch._objects[index], responseCode, response);

			// If result is true already, executing will be stopped anyway
			if (!result) {
				result = requestResult !== null ?
					requestResult :
					result === false ?
						result :
						requestResult;
			}
		}

		if ((result == null && batch.successHandler(responseMessage)) || (result === false && batch.exceptionHandler({code: responseCode, message: responseMessage}))) {
			return true;
		}

		if (!result && batch.completeHandler()) {
			return true;
		}

		return result;
	}


	function JsonRPC(url, options) {
		if (!(options instanceof Object)) {
			throw 'The options for the initialization must be passed as an array or an object; the value you supplied (' + String(options) + ') is of type "' + typeof(options) + '".';
		}
		if (!(options.methods instanceof Object)) {
			throw 'The options.methods for the initialization must be passed as an array or an object; the value you supplied (' + String(options.methods) + ') is of type "' + typeof(options.methods) + '".';
		}

		this._protocolVersion = '2.0';
		this._requestURL      = url;
		this._authUsername    = options.user != undefined ? options.user : null;
		this._authPassword    = options.password != undefined ? options.password : null;
		this._methodsList     = options.methods;

		for (var i = 0; i < this._methodsList.length; i++) {
			var methodObject = this;

			if (this._methodsList[i] == undefined) {
				throw 'The method is undefined; The index of method is ' + i + ';';
			}

			var method = typeof(this._methodsList[i]) == 'object' ? this._methodsList[i] : [this._methodsList[i]];

			if (typeof(method[0]) != 'string') {
				throw 'The method name must be a string; the value you supplied (' + String(method[0]) + ') is of type "' + typeof(method[0]) + '".';
			}

			if (method[1] != undefined && typeof(method[1]) != 'boolean') {
				throw 'The "is notification" flag must be a boolean; the value you supplied (' + String(method[1]) + ') is of type "' + typeof(method[1]) + '".';
			}
			var methodName = method[0];
			var isNotification = method[1] != undefined ? method[1] : false;

			var propChain = methodName.split('.');

			var j = 0;
			for (; j < propChain.length - 1; j++) {
				if (!methodObject[propChain[j]]) {
					methodObject[propChain[j]] = {};
				}
				methodObject = methodObject[propChain[j]];
			}

			methodObject[propChain[j]] = (function(instance, methodName, isNotification) {
				return function(params) {
					return new JsonRPCRequest(instance, methodName, params, isNotification);
				};
			})(this, methodName, isNotification);
		}
	}

	JsonRPC.prototype.successHandler   = function() {};
	JsonRPC.prototype.exceptionHandler = function() {};
	JsonRPC.prototype.completeHandler  = function() {};

	/**
	 * Add success callback to the request;
	 * Callback will gets result-object from response
	 *
	 * @param callback
	 *
	 * @return JsonRPC
	 */
	JsonRPC.prototype.onSuccess = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onSuccess handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.successHandler = callback;
			}
		}
		return this;
	};

	/**
	 * Add exception callback to the request;
	 * Callback will gets error-object or string;
	 *
	 * @param callback
	 *
	 * @return JsonRPC
	 */
	JsonRPC.prototype.onException = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onException handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.exceptionHandler = callback;
			}
		}

		return this;
	};

	/**
	 * Add callback to the request, it will be called when response will be got (independently on result of request);
	 * Callback doesn`t gets any parameters;
	 *
	 * @param callback
	 *
	 * @return JsonRPC
	 */
	JsonRPC.prototype.onComplete = function(callback) {
		if (callback) {
			if (typeof callback != 'function') {
				throw 'The onComplete handler callback function you provided is invalid; the value you provided (' + callback.toString() + ') is of type "' + typeof(callback) + '".';
			}

			if (!this._isNotification) {
				this.completeHandler = callback;
			}
		}

		return this;
	};

	JsonRPC.prototype.batchRequest = function() {
		return new JsonRPCBatch(this);
	};

	function doRequest(url, authUserName, authPassword, request, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true, authUserName, authPassword);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.setRequestHeader('Accept', 'application/json');

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var message;
				var code;
				if (xhr.status != 200) {
					code    = xhr.status;
					message = xhr.statusText;
				} else {
					try {
						code = xhr.status;
						if (xhr.responseText != '') {
							message = JSON.parse(xhr.responseText);
						} else {
							message = xhr.responseText;
						}
					} catch (e) {
						code    = -32001;
						message = xhr.responseText;
					}
				}
				callback({code: code, message: message});
			}
		};

		xhr.send(JSON.stringify(request));
	}

	window.JsonRPC = JsonRPC;
})(window);