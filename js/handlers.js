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

var satnetClient = function() {

	var rpc_url = 'http://172.19.51.170:8000/jrpc/';
	this.rpc = new JsonRPC(rpc_url, { methods: 
		['system.login',
		 'system.logout',
		 'communications.gs.storePassiveMessage',
		 'configuration.gs.list'] });

	var kissparser = new kissParser(onReceiveFrameCallback);
	var connectionInfo = null;
	var satnetConnection = {
		serialPort:null,
		baudRate:null,
		groundStation:null
	};

	// Elements in DOM
	var serialPortSel = document.getElementById('serialPortSel');
	var refreshPortsBtn = document.getElementById('refreshPortsBtn');	
	var baudRateSel = document.getElementById('baudRateSel');
	var baudRateInp = document.getElementById('baudRateInp');
	var groundStationSel = document.getElementById('groundStationSel');
	var refreshGroundStationsBtn = document.getElementById('refreshGroundStationsBtn');
	var connectBtn = document.getElementById('connectBtn');
	var disconnectBtn = document.getElementById('disconnectBtn');


	this.initialize = function() {
		refreshGS();
		refreshDevices();		
	}
	/********************************
	* Event callbacks
	*********************************/
	// Refreshes the list of GS stations in main window. Called after log in
	// from login_handlers
	var refreshGS = function() {
		while (groundStationSel.length > 1) {
			groundStationSel.remove(1);
		}		
		satnet.rpc.configuration.gs.list()
			.onSuccess(function(result) {
				terminal.log(result.length + " ground station(s) was(were) found");
				if (!result.length) terminal.log("Please, create a GS through SATNET website");

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
								terminal.log('Ground station ' + items.groundStation + ' found');					
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
	var refreshDevices = function() {
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
			disableElement(serialPortSel);
			disableElement(refreshPortsBtn);
			disableElement(baudRateSel);
			disableElement(baudRateInp);
			disableElement(groundStationSel);
			disableElement(refreshGroundStationsBtn);

			chrome.serial.onReceive.addListener(onReceiveCallback);
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
		if (info.data && info.connectionId == connectionId) {
			kissparser.update(info.data);
		}
	};

	var onReceiveFrameCallback = function(frame) {
		terminal.log('New frame received: ' + frame);
	};

	// Callback to attend serial port events
	var onReceiveErrorCallback = function(info) {
		closeConnection(info.connectionId);
		getDevices();
	};

	function closeConnection(connectionId) {
		terminal.log('Connection closed (ID: ' + connectionId + ')');
		disconnectBtn.classList.add('pure-button-disabled');
		connectBtn.innerHTML = 'CONNECT';
		connectBtn.classList.remove('button-success');
		// Enable parameter changes
		enableElement(connectBtn);
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
		satnetConnection.groundStation = groundStationSel.options[groundStationSel.selectedIndex].value;
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
		chrome.serial.disconnect(connectionInfo.connectionId, onDisconnect);
	});

	refreshPortsBtn.addEventListener('click', this.refreshDevices);
	refreshGroundStationsBtn.addEventListener('click', this.refreshGS);

	chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);

}

// Create instance of satnet client on document ready
var satnet;
document.addEventListener("DOMContentLoaded", function(event) { 
	satnet = new satnetClient();
	terminal.log('Welcome to SATNet Client!');
});
