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
		 [ 'communications.gs.storePassiveMessage', false ],
		 'configuration.gs.list'] });

	var kissparser = new kissParser(onReceiveFrameCallback);
	this.connectionInfo = null;

	// Elements in DOM
	var serialPortSel = document.getElementById('serialPortSel');
	var baudRateSel = document.getElementById('baudRateSel');
	var baudRateInp = document.getElementById('baudRateInp');
	var groundStationSel = document.getElementById('groundStationSel');
	var connectBtn = document.getElementById('connectBtn');
	var disconnectBtn = document.getElementById('disconnectBtn');
	var refreshPortsBtn = document.getElementById('refreshPortsBtn');

	// Refreshes the list of GS stations in main window. Called after log in
	// from login_handlers
	this.refreshGS = function() {
		satnet.rpc.configuration.gs.list()
			.onSuccess(function(result) {
				terminal.log("Successfully downloaded GS list");
				terminal.log(result);			

				for (var i = 0; i < result.length; i++) {
					var option = document.createElement('option');
					option.text = result[i];
					groundStationSel.add(option);
				}
			})
			.onException(jsonRPCerror)
			//.onComplete()
			.execute();		
	}

	// Refreshes the list of serial devices in main window
	this.refreshDevices = function() {
		chrome.serial.getDevices(function(ports) {
			while (serialPortSel.length > 1) {
				serialPortSel.remove(1);
			}
			for (var i = 0; i < ports.length; i++) {
				var option = document.createElement('option');
				option.text = ports[i].path;
				serialPortSel.add(option);
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
			terminal.log('Connection succeeded (ID: ' + connInfo.connectionId + ')');
			connectionInfo = connInfo;
			connectBtn.classList.add('button-success');
			connectBtn.classList.add('pure-button-disabled');
			connectBtn.innerHTML = 'CONNECTED';
			chrome.serial.onReceive.addListener(onReceiveCallback);
		}
	}

	// Callback to deal with DISCONNECT button
	var onDisconnect = function(result) {
		if (result) {
			connectionClosed(connectionId);
		} else {
			terminal.log('Connection with ID ' + connectionId + ' could not be closed');
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
		connectionClosed(info.connectionId);
		getDevices();
	};
	chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);


	function connectionClosed(connectionId) {
		terminal.log('Connection closed (ID: ' + connectionId + ')');
		disconnectBtn.classList.add('pure-button-disabled');
		connectBtn.innerHTML = 'CONNECT';
		connectBtn.classList.remove('button-success');
		connectBtn.classList.remove('pure-button-disabled');	
	}


	connectBtn.addEventListener('click', function (e) {
		// If the connection is already active
		if (connectBtn.classList.contains('pure-button-disabled')) return;
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
		if (disconnectBtn.classList.contains('pure-button-disabled')) return;
		chrome.serial.disconnect(connectionId, onDisconnect);
	});

}


// Create instance of satnet client on document ready
var satnet;
document.addEventListener("DOMContentLoaded", function(event) { 
	satnet = new satnetClient();
	terminal.log('Welcome to SATNet Client!');
});
