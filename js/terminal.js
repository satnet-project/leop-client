function append(text) {
	var terminalID = chrome.app.window.get('terminal').contentWindow.window.document.getElementById('terminal');
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(text));
	terminalID.appendChild(li);
}
