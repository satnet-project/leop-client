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

/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */

function launch() {
  // Open TERMINAL window on startup
  chrome.app.window.create('terminal.html', {
    id: 'terminal',
    innerBounds: { width: 600, height: 400, top: 0, left: 300 }
  });

  // Open MAIN window
  chrome.app.window.create('index.html', {
    innerBounds: { width: 300, height: 400, top: 0, left: 0},
    resizable: false,
  });
}
chrome.app.runtime.onLaunched.addListener(launch);
