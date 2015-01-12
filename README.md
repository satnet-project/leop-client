LEOP SATNet Client
==================

This repository contains the source code of a SATNet client for supporting LEOP satellite operations. The client reads the data received from a TNC and sends it to the SATNet servers. **The serial communication between the TNC and the app shall be based on the [KISS protocol](http://www.ka9q.net/papers/kiss.html)**.

The current release can be downloaded from the Chrome web store but right now it is only available for beta testers. If you want to become one of them, please contact us.

[<img src="https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton_small.png">](https://chrome.google.com/webstore/detail/satnet-leop-client/cloiengfacgdmggnhpnpfoofaphjjkcb)

Usage instructions
------------------
###Registration
1. Register at [SATNet website](https://satnet.aero.calpoly.edu/accounts/signup/). Confirm your email account and wait until the SATNet administrator manually validates your account.
2. Login at [SATNet website](https://satnet.aero.calpoly.edu/) and create a Ground Station by clicking in the [*Operations* tab](https://satnet.aero.calpoly.edu/operations/).

 ![Create GS](https://raw.github.com/satnet-project/leop-client/master/doc/create-gs.png)

###Chrome app
1. Download the app from the [Chrome web store](https://chrome.google.com/webstore/detail/satnet-leop-client/cloiengfacgdmggnhpnpfoofaphjjkcb).

 [<img src="https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton_small.png">](https://chrome.google.com/webstore/detail/satnet-leop-client/cloiengfacgdmggnhpnpfoofaphjjkcb)
2. Open the Chrome App directly from the browser or from your OS app launcher.

 ![Open app](https://raw.github.com/satnet-project/leop-client/master/doc/open-app.png)
3. Enter your user credentials and click *Sign in*

 ![Sign in](https://raw.github.com/satnet-project/leop-client/master/doc/login-app.png)
4. Configure your TNC serial port, the baudrate and select the GS you are working on.

 ![Configure app](https://raw.github.com/satnet-project/leop-client/master/doc/configure-app.png)
