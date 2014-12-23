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

var loginURL = "http://127.0.0.1:8000/rest-auth/login/"
//var loginURL = "http://httpbin.org/post"
var signIn = document.getElementById('signInBtn');
var username = document.getElementById('usernameInp');
var password = document.getElementById('passwordInp');

// Callback to deal with SIGN IN button
signIn.addEventListener('click', function (e) {
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", loginURL, true);
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.onreadystatechange = onAnswerReceived;
    xmlHttp.send('{\"username\":\"' + username.value + '\",\"password\":\"' + password.value + '\"}');
    console.log(xmlHttp);
    return xmlHttp.responseText;
});

function onAnswerReceived() {
	console.log("ANSWER");
}