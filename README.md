mtgox-socket-client
===========================

A Node.js Socket.io client for the MtGox bitcoin exchange Streaming API. This is a port from [dlanod](https://github.com/dlanod)'s https://github.com/dlanod/node-mtgox-websocket-client (the WebSocket API is now deprecated in favor of Socket.io).

Installation
------------

$ npm install mtgox-socket-client

You may also need to put your API keys inside of 'keys.js' if you want to access the 'client' channel (e.g. your personal trades).

$ node demo.js

Example Use
------------

	var MtGoxClient = require('./lib/mtgox-client').MtGoxClient;

	var client = new MtGoxClient({channels: {client: true, trade: true}});

	function showMessage(message) {
		console.log("Got message from mt!",message);
	}

	/* Show the trade message every time someone makes a trade */
	client.on("trade",function(message) {
		console.log("Got trade message from mtgox!",message);	
	});

	/* Show the trade message every there is a client-specific action (buy, sell, etc) */
	client.on("other",function(message) {
		console.log("Got client-specific message from mtgox!",message);	
	});


Contributors
------------

* [johnwarden](https://github.com/johnwarden)
* [olalonde](https://github.com/olalonde)
* [dlanod](https://github.com/dlanod)
* [cronopio](https://github.com/cronopio)
* [marak](https://github.com/marak)

License
-------

Copyright 2011 Donald Ness, Olivier Lalonde

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
