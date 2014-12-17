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

var select = document.getElementById("serialPorts");

// Callback to deal with REFRESH button
var onGetDevices = function(ports) {
	while (select.length > 1) {
		select.remove(1);
	}
	for (var i=0 ; i < ports.length ; i++) {
		console.log("Ports: " + ports[i].path);
		var option = document.createElement("option");
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
	chrome.app.window.create('terminal.html', {
		id: 'terminal',
		bounds: { width: 600, height: 400 }
	});

	if (!connectionInfo) {
		document.getElementById('connectBtn').classList.add('button-error');
		append('Connection error');
		console.log('Connection error');		
		chrome.serial.getDevices(onGetDevices);
		window.setTimeout(function () {
			document.getElementById('connectBtn').classList.remove('button-error');
		}, 2000);
	} else {
		append('Connection succeded (ID: ' + connectionInfo.connectionId + ')');
		console.log('Connection succeded (ID: ' + connectionInfo.connectionId + ')');
		document.getElementById('connectBtn').classList.add('button-success');
	}
}

document.getElementById('connectBtn').addEventListener('click', function (e) {
	var path = select.options[select.selectedIndex].value;
	chrome.serial.connect(path, {bitrate: 115200}, onConnect);
});

// Callback to read from serial port
var onReceiveCallback = function(info) {
	var stringReceived = '';
	if (info.data) {
		var str = convertArrayBufferToString(info.data);
		if (str.charAt(str.length-1) === '\n') {
			stringReceived += str.substring(0, str.length-1);
			onLineReceived(stringReceived);
			stringReceived = '';
		} else {
			stringReceived += str;
		}
	}
};

chrome.serial.onReceive.addListener(onReceiveCallback);

// Callback to attend serial port events
var onReceiveErrorCallback = function(info) {
	chrome.app.window.create('terminal.html', {
		id: 'terminal',
		bounds: { width: 600, height: 400 }
	});

	document.getElementById('connectBtn').classList.remove('button-success');
	chrome.serial.getDevices(onGetDevices);
	append(info);
	console.log(info);
};

chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);