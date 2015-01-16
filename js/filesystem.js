/*
   Copyright 2015 Xabier Crespo Álvarez

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

var FileSystem = function() {
	var dataFrames = [];
	var saveFileBtn = document.getElementById('saveFileBtn');
	saveFileBtn.addEventListener('click', function (e) {
		var d = new Date();
		// "SATNET_dd/mm/yyyy_hh.MM.csv"
		var fileName = 'SATNet' + '_' + d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear() + '_' + d.getHours() + '.' + d.getMinutes() + '.csv';
		chrome.fileSystem.chooseEntry({type:'saveFile', suggestedName:fileName}, onSaveFile);
	});

	this.enableSaveBtn = function() {
		saveFileBtn.style.display = "inline-block";
		saveFileBtn.disabled = false;
	}

	this.disableSaveBtn = function() {
		saveFileBtn.style.display = "none";
		saveFileBtn.disabled = true;
		dataFrames = [];
	}
	// Workaround to have a private version of the disableSaveBtn function
	var privDisableSaveBtn = this.disableSaveBtn;

	this.newFrame = function(groundStation, timestamp, doppler, frame) {
		dataFrames.push(groundStation + ',' + timestamp + ',' + doppler + ',' + frame + '\n');
	}

	function onSaveFile(writableEntry) {
		if (!writableEntry) {
			terminal.log('File not selected', 1);
			return;
		}

		writableEntry.createWriter(function(writer) {
			writer.onerror = function(e) {
				terminal.log('An error has been produced while saving the file. Please, try again.', 1);
			};
			writer.onwriteend = function(e) {
				terminal.log('File succesfully saved');				
				privDisableSaveBtn();
			};

			writer.write(new Blob(dataFrames, {type:'text/plain'}));
		});
	}
}

var fileSystem = null;
document.addEventListener("DOMContentLoaded", function(event) { 
	fileSystem = new FileSystem();
});