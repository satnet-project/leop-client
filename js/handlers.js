/*
   Copyright 2014 Xabier Crespo Álvarez

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

	   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

:Author:
	Xabier Crespo Álvarez (xabicrespog@gmail.com)
	Diego Hurtado de Mendoza Pombo (diego.hdmp@gmail.com)
*/

var SatnetClient = function() {

	var rpc_url = 'https://satnet.aero.calpoly.edu/jrpc/';
	var rpc_url = 'http://127.0.0.1:8000/jrpc/';
	this.rpc = new JsonRPC(rpc_url, { methods: 
		['system.login',
		 'system.logout',
		 'communications.gs.storePassiveMessage',
		 'configuration.gs.list',
		 'leop.getMessages'] });

	var kissparser = new kissParser(onReceiveFrameCallback);
	var connectionInfo = null;
	var satnetConnection = {
		serialPort:null,
		baudRate:null,
		groundStation:null
	};

	// Vars for testing purposes
	var framesReceived = 0;
	var framesUploaded = 0;

	// Elements in DOM
	var serialPortSel = document.getElementById('serialPortSel');
	var refreshPortsBtn = document.getElementById('refreshPortsBtn');	
	var baudRateSel = document.getElementById('baudRateSel');
	var baudRateInp = document.getElementById('baudRateInp');
	var groundStationSel = document.getElementById('groundStationSel');
	var refreshGroundStationsBtn = document.getElementById('refreshGroundStationsBtn');
	var connectBtn = document.getElementById('connectBtn');
	var disconnectBtn = document.getElementById('disconnectBtn');
	var framesUploadedInp = document.getElementById('framesUploadedInp');
	var framesReceivedInp = document.getElementById('framesReceivedInp');
	var enDownloadMsgForm = document.getElementById('enDownloadMsgForm');
	var downloadMsgBtn = document.getElementById('downloadMsgBtn');
	var enDownloadMsgFormBtn = document.getElementById('enDownloadMsgFormBtn');
	var downloadMsgStartDateInp = document.getElementById('downloadMsgStartDateInp');

	this.initialize = function() {
		refreshGS();
		refreshDevices();		
	}
	/********************************
	* Event callbacks
	*********************************/
	// Refreshes the list of GS stations in main window. Called after log in
	// from login_handlers
	function refreshGS() {
		while (groundStationSel.length > 1) {
			groundStationSel.remove(1);
		}		
		satnet.rpc.configuration.gs.list()
			.onSuccess(function(result) {
				terminal.log(result.length + " ground station(s) was(were) found");
				if (!result.length) terminal.log("Please, create a GS through SATNET website", 1);

				for (var i = 0; i < result.length; i++) {
					var option = document.createElement('option');
					option.text = result[i];
					groundStationSel.add(option);
				}
				chrome.storage.local.get(["groundStation"], function (items) {
					// If the GS is available select saved value
					if (items.groundStation) {
						for (i=0 ; i < groundStationSel.length ; i++) {
							if (groundStationSel[i].value == items.groundStation) {
								groundStationSel.selectedIndex = i;
								break;
							}
						}
					}
				});		
			})
			.onException(jsonRPCerror)
			//.onComplete()
			.execute();
	}

	// Refreshes the list of serial devices in main window
	function refreshDevices() {
		chrome.serial.getDevices(function(ports) {
			while (serialPortSel.length > 1) {
				serialPortSel.remove(1);
			}
			terminal.log(ports.length + " serial device(s) was(were) found");
			for (var i = 0; i < ports.length; i++) {
				var option = document.createElement('option');
				option.text = ports[i].path;
				serialPortSel.add(option);
			}
		});
		chrome.storage.local.get(["serialPort", "baudRate"], function (items) {
			// If the port is available select saved value
			if (items.serialPort && items.baudRate) {
				for (i=0 ; i < serialPortSel.length ; i++) {
					if (serialPortSel[i].value == items.serialPort) {
						terminal.log('Serial port ' +items.serialPort + ' found');
						serialPortSel.selectedIndex = i;
						break;
					}
				}
				baudRateSel.style.display = "none";
				baudRateInp.style.display = "block";
				baudRateInp.value = items.baudRate;
			}
		});
	}

	// Callback to deal with 'CONNECT' button
	var onConnect = function(connInfo) {
		if (!connInfo) {
			connectBtn.classList.add('button-error');
			terminal.log('Connection error');
			refreshDevices();
			window.setTimeout(function() {
				connectBtn.classList.remove('button-error');
			}, 1000);
		} else {
			// Init connections
			framesUploaded = 0;
			framesReceived = 0;
			framesUploadedInp.value = framesUploaded;
			framesReceivedInp.value = framesReceived;

			terminal.log('Succesful serial connection (ID ' + connInfo.connectionId + ')');
			terminal.log('Serial port : ' + satnetConnection.serialPort);
			terminal.log('Baud rate : ' + satnetConnection.baudRate);
			terminal.log('Ground Station : ' + satnetConnection.groundStation);
			chrome.storage.local.set({'serialPort': satnetConnection.serialPort, 
				'baudRate': satnetConnection.baudRate, 'groundStation': satnetConnection.groundStation }, function() {
   					terminal.log('Connection parameters saved');
   			});

			connectionInfo = connInfo;
			connectBtn.classList.add('button-success');
			connectBtn.innerHTML = 'CONNECTED';
			// Disable parameter changes while connected
			disableElement(connectBtn);
			enableElement(disconnectBtn);
			disableElement(serialPortSel);
			disableElement(refreshPortsBtn);
			disableElement(baudRateSel);
			disableElement(baudRateInp);
			disableElement(groundStationSel);
			disableElement(refreshGroundStationsBtn);

		}
	}

	// Callback to deal with DISCONNECT button
	var onDisconnect = function(result) {
		if (result) {
			closeConnection(connectionInfo.connectionId);
		} else {
			terminal.log('Connection with ID ' + connectionInfo.connectionId + ' could not be closed');
		}
	}

	// Callback to read from serial port
	var onReceiveCallback = function(info) {
		if (info.data && info.connectionId == connectionInfo.connectionId) {
			kissparser.update(info.data);
		}
	};
	
	function onReceiveFrameCallback(frame) {
		var b64_frame = btoa(String.fromCharCode.apply(null, frame));
		terminal.log('FRAME RECEIVED  >>>>>>>>>  ' + b64_frame);
		framesReceived++;
		framesReceivedInp.value = framesReceived;

		satnet.rpc.communications.gs.storePassiveMessage([ satnetConnection.groundStation, Date.now(), 0, b64_frame ])
			.onSuccess(function(result) {
				if (result) {
					terminal.log('FRAME STORED    <<<<<<<<<  ' + b64_frame);
					framesUploaded++;
					framesUploadedInp.value = framesUploaded;
				}
			})
			.onException(function(error) {
				fileSystem.newFrame(satnetConnection.groundStation, Date.now(), 0, b64_frame);
				terminal.log("The frame could not be stored", 1)
				terminal.log("An option to export the frame to a local file will promt after clicking disconnect", 1)
			})
			//.onComplete()
			.execute();
	};

	// Callback to attend serial port events
	var onReceiveErrorCallback = function(info) {
		closeConnection(info.connectionId);
		getDevices();
	};

	// Callback corresponding to a flush event
	function onFlush(result) {
		if (result) terminal.log('Serial port successfully flushed');
		else terminal.log('Nothing to flush');
	}

	function closeConnection(connectionId) {
		terminal.log('Connection closed (ID: ' + connectionId + ')');
		terminal.log('Frames received: ' + framesReceived);
		terminal.log('Frames stored:   ' + framesUploaded);
		if (framesReceived > 0 && framesReceived/framesUploaded != 1) {
			fileSystem.enableSaveBtn();
			terminal.log('One or more frames have not been stored in the server', 1);
			terminal.log('Please, save the frames to a local file and send us the file to satnet.uvigo@gmail.com', 1);
		}	

		chrome.serial.flush(connectionInfo.connectionId, onFlush);
		connectionInfo = null;
		disconnectBtn.classList.add('pure-button-disabled');
		connectBtn.innerHTML = 'CONNECT';
		connectBtn.classList.remove('button-success');
		// Enable parameter changes
		enableElement(connectBtn);
		disableElement(disconnectBtn);
		enableElement(serialPortSel);
		enableElement(refreshPortsBtn);
		enableElement(baudRateSel);
		enableElement(baudRateInp);
		enableElement(groundStationSel);
		enableElement(refreshGroundStationsBtn);
	}

	function disableElement(element) {
		element.disabled = true;
		element.classList.add('pure-button-disabled');
	}
	
	function enableElement(element) {
		element.disabled = false;
		element.classList.remove('pure-button-disabled');
	}

	//Callback to Download all available messages from the server
	function downloadMessages() {
		enDownloadMsgFormBtn.style.display = "block";
		downloadMsgForm.style.display = "none";
		if (downloadMsgStartDateInp.value == "") {
			terminal.log('Please, pick the date from which you want to retrieve the data', 1);
			return;
		}
		
		satnet.rpc.leop.getMessages(['ELANA', downloadMsgStartDateInp.value])
			.onSuccess(function(result) {
				//TODO: save messages to file
				terminal.log(result);
			})
			.onException(jsonRPCerror)
			//.onComplete()
			.execute();		
	}

	//Callback to Download all available messages from the server
	function enDownloadMessagesForm() {
		enDownloadMsgFormBtn.style.display = "none";
		downloadMsgForm.style.display = "block";
	}

	/********************************
	* Event listeners
	*********************************/
	connectBtn.addEventListener('click', function (e) {
		// Check if either the baud rate or the port id is not selected
		if (serialPortSel.selectedIndex == 0) {
			terminal.log('Please, select the TNC serial port');
			return;
		}
		if (!baudRateInp.value.length) {
			terminal.log('Please, select the TNC baud rate');
			return;
		}
		if (groundStationSel.selectedIndex == 0) {
			terminal.log('Please, select a ground station');
			return;
		}

		var path = serialPortSel.options[serialPortSel.selectedIndex].value;
		var baudrate = baudRateInp.value;
		disconnectBtn.classList.remove('pure-button-disabled');
		satnetConnection.serialPort = path;
		satnetConnection.baudRate = Math.round(baudrate);
		satnetConnection.groundStation = groundStationSel[groundStationSel.selectedIndex].value;
		kissparser = new kissParser(onReceiveFrameCallback);
		fileSystem.disableSaveBtn();
		chrome.serial.onReceive.addListener(onReceiveCallback);
		chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);
		chrome.serial.connect(path, {bitrate: Math.round(baudrate), persistent: true}, onConnect);		
	});

	// Handling baud rate selection, if the selected option is 'Other'
	// replaces an input field by the select form. Otherwise copies the
	// option to the input to ease the code
	baudRateSel.addEventListener('change', function() {
		if (baudRateSel.selectedIndex == baudRateSel.length-1) {
			baudRateSel.style.display = "none";
			baudRateInp.style.display = "block";
		} else {
			baudRateInp.value = baudRateSel.value;
		}
	});

	disconnectBtn.addEventListener('click', function (e) {
		chrome.serial.onReceive.removeListener(onReceiveCallback);
		chrome.serial.onReceiveError.removeListener(onReceiveErrorCallback);
		chrome.serial.disconnect(connectionInfo.connectionId, onDisconnect);
	});

	refreshPortsBtn.addEventListener('click', refreshDevices);
	refreshGroundStationsBtn.addEventListener('click', refreshGS);

	downloadMsgBtn.addEventListener('click', downloadMessages);
	enDownloadMsgFormBtn.addEventListener('click', enDownloadMessagesForm);
}

// Create instance of satnet client on document ready
var satnet;
document.addEventListener("DOMContentLoaded", function(event) {
	satnet = new SatnetClient();
	terminal.log('Welcome to SATNet Client!');
});
