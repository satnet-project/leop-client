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
  _this.connectionId = connectionInfo.connectionId;
}

document.getElementById('connectBtn').addEventListener('click', function(e) {
	var path = select.options[select.selectedIndex].value
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
