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

var Terminal = function() {

	var terminalElem = document.getElementById('terminal');

	this.log = function(text) {
		console.log(text);
		var date = new Date();
		var line = '[' + date.toUTCString() + '] ' + text;
		var li = document.createElement("li");
		li.appendChild(document.createTextNode(line));
		terminalElem.appendChild(li);
	}

}

var terminal = null;
document.addEventListener("DOMContentLoaded", function(event) { 
	terminal = new Terminal();
});