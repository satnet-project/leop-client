/*
   Copyright 2014 Diego Hurtado de Mendoza Pombo

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
	Diego Hurtado de Mendoza Pombo (diego.hdmp@gmail.com)
*/

/* 
    Simple class for parsing KISS TNC input
    http://www.ka9q.net/papers/kiss.html

    Only listens to command 0 (data frame).

    Usage:
    	// cb is the frame callback function. Parameter 'frame' is of type Uint8Array
    	var cb = function(frame) { console.log(frame); };
        var parser = new kissParser(cb);

		// On new serial data, call the following method, where data is an ArrayBuffer
		parser.update(data); 
*/

var kissParser = function(cb) {

	// KISS protocol constants as defined in http://www.ka9q.net/papers/kiss.html
	var constants = {
		KISS_FRAME_END: 			0xC0,
		KISS_FRAME_ESCAPE: 			0xDB,
		KISS_FRAME_COMMAND: 		0x00,
		KISS_TRANS_FRAME_END: 		0xDC,
		KISS_TRANS_FRAME_ESCAPE: 	0xDD
	};
	// Possible states for internal finite state machine
	var states = { NOSYNC: 0, SYNC: 1, DATA: 2 };

	// Variables for each kissParser instance
	this.state = states.NOSYNC;
	this.escaped = false;
	this.frame = new Uint8Array(1024);
	this.frameLen = 0;

	// Function to parse new input data. cb will be called for each frame found.
	// parameter data is an ArrayBuffer
	this.update = function(data) {
		var dataLength = data.byteLength;
		var dataArray = new Uint8Array(data,0,dataLength);
		for (var i = 0; i < dataLength; i++) {
			var newByte = dataArray[i];

			if (newByte == constants.KISS_FRAME_END) {
				if (this.state == states.DATA && this.frameLen > 0) {
					// Pass a copy of the frame buffer to the callback
					cb(new Uint8Array(this.frame.subarray(0, this.frameLen)));
				}
				this.state = states.SYNC;
				this.frameLen = 0;
				this.escaped = false;
				continue;
			}

			switch (this.state) {
				case states.SYNC:
					if (newByte == constants.KISS_FRAME_COMMAND) {
						this.state = states.DATA;
					} else {
						this.state = states.NOSYNC;
					}
					break;
				case states.DATA:
					if (this.escaped) {
						if (newByte == constants.KISS_TRANS_FRAME_END) {
							newByte = constants.KISS_FRAME_END;
						} else if (newByte == constants.KISS_TRANS_FRAME_ESCAPE) { 
							newByte = constants.KISS_FRAME_ESCAPE;
						} else {
							this.state = states.NOSYNC;
						}
					} else {
						if (newByte == constants.KISS_FRAME_ESCAPE) this.escaped = true;
						else this.frame[this.frameLen++] = newByte;
					}
					break;
			}

		}
	};

};
