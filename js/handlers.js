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
	*/

var select = document.getElementById('serialPorts');
var connectBtn = document.getElementById('connectBtn');
var disconnectBtn = document.getElementById('disconnectBtn');
var connectionID = null;

// Callback to deal with REFRESH button
var onGetDevices = function(ports) {
	while (select.length > 1) {
		select.remove(1);
	}
	for (var i=0 ; i < ports.length ; i++) {
		var option = document.createElement('option');
		option.text = ports[i].path;
		select.add(option);
	}
}

// Read serial devices when opening the app
chrome.serial.getDevices(onGetDevices);

document.getElementById('refreshPorts').addEventListener('click', function (e) {
	chrome.serial.getDevices(onGetDevices);
});

// Callback to deal with CONNECT button
var onConnect = function(connectionInfo) {
	// The serial port has been opened. Save its id to use later.
	//_this.connectionId = connectionInfo.connectionId;	

	if (!connectionInfo) {
		connectBtn.classList.add('button-error');
		append('Connection error');
		chrome.serial.getDevices(onGetDevices);
		window.setTimeout(function () {
			connectBtn.classList.remove('button-error');
		}, 2000);
	} else {
		append('Connection succeded (ID: ' + connectionInfo.connectionId + ')');
		connectionId = connectionInfo.connectionId;
		connectBtn.classList.add('button-success');
		connectBtn.classList.add('pure-button-disabled');
		connectBtn.innerHTML = 'CONNECTED';		
		chrome.serial.onReceive.addListener(onReceiveCallback);
	}
}

connectBtn.addEventListener('click', function (e) {
	if (connectBtn.classList.contains('pure-button-disabled')) return;
	var path = select.options[select.selectedIndex].value;
	disconnectBtn.classList.remove('pure-button-disabled');
	chrome.serial.connect(path, {bitrate: 115200}, onConnect);
});

// Callback to deal with DISCONNECT button
var onDisconnect = function(result) {
	if (result) {
		connectionClosed(connectionId);
	} else {
		append('Connection with ID ' + connectionId + ' could not be closed');
	}	
}

disconnectBtn.addEventListener('click', function (e) {
	if (disconnectBtn.classList.contains('pure-button-disabled')) return;
	chrome.serial.disconnect(connectionId, onDisconnect);
});

// Callback to read from serial port
var stringReceived = '';
var temp = null;
var onReceiveCallback = function(info) {
	console.log('entra: ' + info.data);
	temp = info;
	if (info.data && info.connectionId == connectionId) {
		var str = convertArrayBufferToString(info.data);
		append('Received: ' + info.data);
		if (str.charAt(str.length-1) === '\n') {
			stringReceived += str.substring(0, str.length-1);
			append(stringReceived);
			stringReceived = '';
		} else {
			stringReceived += str;
		}
	}
};


// Callback to attend serial port events
var onReceiveErrorCallback = function(info) {
	connectionClosed(info.connectionId);
	chrome.serial.getDevices(onGetDevices);
};

chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);

function connectionClosed(connectionId) {
	append('Connection closed (ID: ' + connectionId + ')');
	disconnectBtn.classList.add('pure-button-disabled');
	connectBtn.innerHTML = 'CONNECT';
	connectBtn.classList.remove('button-success');
	connectBtn.classList.remove('pure-button-disabled');	
}