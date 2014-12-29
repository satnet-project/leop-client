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

var serialPortSel = document.getElementById('serialPortSel');
var baudRateSel = document.getElementById('baudRateSel');
var baudRateInp = document.getElementById('baudRateInp');
var connectBtn = document.getElementById('connectBtn');
var disconnectBtn = document.getElementById('disconnectBtn');
var refreshPortsBtn = document.getElementById('refreshPortsBtn');
var connectionID = null;

// Callback to deal with REFRESH button
var onGetDevices = function(ports) {
	while (serialPortSel.length > 1) {
		serialPortSel.remove(1);
	}
	for (var i=0 ; i < ports.length ; i++) {
		var option = document.createElement('option');
		option.text = ports[i].path;
		serialPortSel.add(option);
	}
}

// Read serial devices when opening the app
chrome.serial.getDevices(onGetDevices);

refreshPortsBtn.addEventListener('click', function (e) {
	chrome.serial.getDevices(onGetDevices);
});

// Callback to deal with CONNECT button
var onConnect = function(connectionInfo) {
	if (!connectionInfo) {
		connectBtn.classList.add('button-error');
		append('Connection error');
		chrome.serial.getDevices(onGetDevices);
		window.setTimeout(function () {
			connectBtn.classList.remove('button-error');
		}, 1000);
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
	// If the connection is already active
	if (connectBtn.classList.contains('pure-button-disabled')) return;
	// Check if either the baud rate or the port id is not selected
	if (serialPortSel.selectedIndex == 0) {
		append('Please, select the TNC serial port');
		return;
	}
	if (!baudRateInp.value.length) {
		append('Please, select the TNC baud rate');
		return;
	}

	var path = serialPortSel.options[serialPortSel.selectedIndex].value;
	var baudrate = baudRateInp.value;
	disconnectBtn.classList.remove('pure-button-disabled');
	chrome.serial.connect(path, {bitrate: Math.round(baudrate), persistent: true}, onConnect);
});

// Handling baud rate selection, if the selected option is 'Other'
// replaces an input field by the select form. Otherwise copies the
// option to the input to facilitate the code
baudRateSel.addEventListener('change', function() {
	if (baudRateSel.selectedIndex == baudRateSel.length-1) {
		baudRateSel.style.display = "none";
		baudRateInp.style.display = "block";
	} else {
		baudRateInp.value = baudRateSel.value;
	}
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
var onReceiveCallback = function(info) {
	if (info.data && info.connectionId == connectionId) {
		var str = serial2str(info.data);		
		if (str.charAt(str.length-1) === '\n') {
			stringReceived += str.substring(0, str.length-1);
			append(stringReceived);
			stringReceived = '';
		} else {
			stringReceived += str;
		}
	}
};

function serial2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

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