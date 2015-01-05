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
var rememberUser = document.getElementById('rememberUser');


// Callback to deal with SIGN IN button
function signIn() {
	satnet.rpc.system.login([ usernameInp.value, passwordInp.value ])
		.onSuccess(function(result) {
			if (result) {
				terminal.log("Successfully logged in");
				if (rememberUser.checked) {
					chrome.storage.local.set({'email': usernameInp.value, 'password': passwordInp.value}, function() {
          				terminal.log('User credentials saved');
        			});
				} else {
					usernameInp.value = "";
					passwordInp.value = "";
				}
				document.getElementById("login").style.display = "none";
				document.getElementById("main").style.display = "block";
				satnet.refreshDevices();
				satnet.refreshGS();

				//Modify username at the footer 
				//(http://stackoverflow.com/questions/4784568/set-content-of-html-span-with-javascript)
				var span = document.getElementById('userEmailSpan');
				while( span.firstChild ) {
				    span.removeChild( span.firstChild );
				}
				span.appendChild( document.createTextNode(usernameInp.value) )
			} else {
				terminal.log("Email/password incorrect")
			}	
		})
		.onException(jsonRPCerror)
		//.onComplete()
		.execute();
}

// Callback to deal with LOG OUT button
function signOut() {
	satnet.rpc.system.logout()
		.onSuccess(function(result) {
			if (result) {	
				terminal.log("Successfully logged out");
				document.getElementById("login").style.display = "block";
				document.getElementById("main").style.display = "none";
			} else {
				terminal.log("Error when logging out. Try again later");
			}	
		})
		.onException(jsonRPCerror)
		//.onComplete()
		.execute();
}

var jsonRPCerror = function(error) {
	terminal.log("An error has been produced!")
	terminal.log("Details: " + error.message + ' (' + error.code + ')');
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

chrome.storage.local.get(["email", "password"], function (items) {
	if (items.email && items.password) {
		usernameInp.value = items.email;
		passwordInp.value = items.password;
		rememberUser.checked = true;
	}
});