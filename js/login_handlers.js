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
var logInURL = satnetURL.concat("rest-auth/login/");
var logOutURL = satnetURL.concat("rest-auth/logout/");
//var loginURL = "http://httpbin.org/post"

var signInBtn = document.getElementById('signInBtn');
var logOutBtn = document.getElementById('logOutBtn');
var usernameInp = document.getElementById('usernameInp');
var passwordInp = document.getElementById('passwordInp');

var xmlHttp = null;

// Callback to deal with SIGN IN button
function signIn() {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", logInURL, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/json');
	xmlHttp.onreadystatechange = onLoginRequestReceived;
	xmlHttp.send('{\"username\":\"' + usernameInp.value + '\",\"password\":\"' + passwordInp.value + '\"}');
	append(xmlHttp);
	return xmlHttp.responseText;

}

signInBtn.addEventListener('click', function (e) {
	signIn();
});

// Press ENTER to write the password
usernameInp.addEventListener('keypress', function (e) {
	if (e.keyCode == 13 || e.which == 13)
		passwordInp.focus();
});

// Press ENTER to sign in
passwordInp.addEventListener('keypress', function (e) {
	if (e.keyCode == 13 || e.which == 13)
		signIn();
});

function onLoginRequestReceived() {
	// If request state == done
	if (xmlHttp.readyState == 4) {
		switch (xmlHttp.status) {
			case 200:
				append("Successfully logged in");
				document.getElementById("login").style.display = "none";
				document.getElementById("main").style.display = "block";
				break;
			case 400:
				append("Username/password incorrect");
				break;
			case 403:
				append("Log in forbidden");
				break;
			default:
				append("Log in error");
				break;
		}
	}
}

// Callback to deal with LOG OUT button
logOutBtn.addEventListener('click', function (e) {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", logOutURL, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/json');
	xmlHttp.onreadystatechange = onLogOutRequestReceived;
	xmlHttp.send();
	append(xmlHttp);
	return xmlHttp.responseText;
});

function onLogOutRequestReceived() {
	// If request state == done
	if (xmlHttp.readyState == 4) {
		switch (xmlHttp.status) {
			case 200:
				append("Successfully logged out");
				document.getElementById("main").style.display = "none";
				document.getElementById("login").style.display = "block";
				break;
			case 400:
				break;
			case 403:
				break;
			default:
				append("Log out error");
				break;
		}
	}
}
