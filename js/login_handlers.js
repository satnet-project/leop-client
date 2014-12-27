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

var satnetURL ="http://127.0.0.1:8000/" 
var logInURL = "http://127.0.0.1:8000/rest-auth/login/"
var logOutURL = "http://127.0.0.1:8000/rest-auth/logout/"
//var loginURL = "http://httpbin.org/post"
var signIn = document.getElementById('signInBtn');
var logOut = document.getElementById('logOutBtn');
var username = document.getElementById('usernameInp');
var password = document.getElementById('passwordInp');

var xmlHttp = null;

// Callback to deal with SIGN IN button
signIn.addEventListener('click', function (e) {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", logInURL, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/json');
	xmlHttp.onreadystatechange = onLoginRequestReceived;
	xmlHttp.send('{\"username\":\"' + username.value + '\",\"password\":\"' + password.value + '\"}');
	console.log(xmlHttp);
	return xmlHttp.responseText;
});

function onLoginRequestReceived() {
	// If request state == done
	if (xmlHttp.readyState = 4) {
		switch (xmlHttp.status) {
			case 200:
				console.log("Successfully logged in");
				document.getElementById("login").style.display = "none";
				document.getElementById("main").style.display = "block";
				break;
			case 400:
				console.log("Username/password incorrect");
				break;
			case 403:
				console.log("Log in forbidden");
				break;
			default:
				console.log("Log in error");
				break;
		}
	}
}

// Callback to deal with LOG OUT button
logOut.addEventListener('click', function (e) {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", logOutURL, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/json');
	xmlHttp.onreadystatechange = onLogOutRequestReceived;
	xmlHttp.send();
	console.log(xmlHttp);
	return xmlHttp.responseText;
});

function onLogOutRequestReceived() {
	// If request state == done
	if (xmlHttp.readyState = 4) {
		switch (xmlHttp.status) {
			case 200:
				console.log("Successfully logged out");
				document.getElementById("main").style.display = "none";
				document.getElementById("login").style.display = "block";
				break;
			case 400:
				break;
			case 403:
				break;
			default:
				console.log("Log out error");
				break;
		}
	}
}
