function append(text) {
	var terminalID = chrome.app.window.get('terminal').contentWindow.window.document.getElementById('terminal');
	var date = new Date();
	var line = '[' + date.toUTCString() + '] ' + text;
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(line));
	terminalID.appendChild(li);
}
