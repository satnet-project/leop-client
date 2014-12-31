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

var signInBtn = document.getElementById('signInBtn');
var logOutBtn = document.getElementById('logOutBtn');
var usernameInp = document.getElementById('usernameInp');
var passwordInp = document.getElementById('passwordInp');


// Callback to deal with SIGN IN button
function signIn() {
	satnet.rpc.system.login([ usernameInp.value, passwordInp.value ])
		.onSuccess(function(result) {
			if (result) {
				terminal.log("Successfully logged in");
				document.getElementById("login").style.display = "none";
				document.getElementById("main").style.display = "block";
				satnet.refreshDevices();
				satnet.refreshGS();
			} else {
				terminal.log("Email/password incorrect")
			}	
		})
		//.onException()
		//.onComplete()
		.execute();
}


// Callback to deal with LOG OUT button
function signOut() {
	satnet.rpc.system.logout()
		.onSuccess(function() {
			if (result) {	
				terminal.log("Successfully logged out");
				document.getElementById("login").style.display = "block";
				document.getElementById("main").style.display = "none";
			} else {
				terminal.log("Error when logging out. Try again later");
			}	
		})
		//.onException()
		//.onComplete()
		.execute();
}


signInBtn.addEventListener('click', function (e) {
	signIn();
});

logOutBtn.addEventListener('click', function (e) {
	signOut();
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