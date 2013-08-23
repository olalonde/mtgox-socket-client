
var fs = require('fs');
var events = require('events');
var io = require('socket.io-client');
var mtGoxAPIV2 = require("mtgox-apiv2");
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var keys = require('./keys').keys;

var MTGOX_SOCKET_URL = 'https://socketio.mtgox.com/mtgox';
var MTGOX_CHANNELS = [
		{ "key":"dbf1dee9-4f2e-4a08-8cb7-748919a71b21", "private":"trade", "name":"Trade" },
		{ "key":"d5f06780-30a8-4a48-a2f8-7ed181b4a13f", "private":"ticker", "name":"Ticker" },
		{ "key":"24e67e0d-1cad-4cc0-9e7a-f8523ef460fe", "private":"depth", "name":"Market Depth" },
		{ "key":"85174711-be64-4de1-b783-0628995d7914", "private":"lag", "name":"Lag" }
];


/* Look up channel by name (e.g. "Market Depth", id (e.g. 24e67e0d-1cad-4cc0-9e7a-f8523ef460fe) or type (e.g. "depth") */

var getChannel = function(key) {
  return MTGOX_CHANNELS.filter(function(channel) {
    return (channel.key == key || channel.private == key);
  })[0];
};



var MtGoxClient = function(options) {
	if(!options) {
		options = {};
	}

	var self = this;

	var socket;

	var lastPulse = new Date() / 1E3;
	var threshhold = 300; // 

	function openSocket() {

		console.info("Opening socket.");

		var socket = io.connect(MTGOX_SOCKET_URL, {
			"force new connection": !0,
			reconnect: !0,
			"reconnection delay": 500 + Math.random() * 500,
			"max reconnection attempts": 10,
			transports: ["websockets"],
			"try multiple transports": !0
		});


		socket.on('message', function(raw) {
			lastPulse = new Date() / 1E3;

			var data = raw;

			var message = data;

			if (message.op == 'remark') {
				 console.info("Remark",message);
			}
			else if (message.op == 'subscribe') {
				console.info("Got subscribe confirmation",getChannel(message.channel).name);
			}
			else if (message.op == 'unsubscribe') {
				console.info("Got unsubscribe confirmation",getChannel(message.channel).name);
			}
			else if (message.op == 'private') {
				if (message.private == "trade") {
					self.emit("trade",message.trade)
				} else if (message.private == "depth") {
					self.emit("depth",message.depth)
				} else if (message.private == "ticker") {
					self.emit("ticker",message.ticker)
				} else {
					self.emit("other",message);
				}
			} else {
				console.info("Other op",message)
			}
		});

		socket.on('heartbeat', function(data) {
			console.info("Got hearbeat");
			console.info(data);
		})
		socket.on('connecting', function(data) {
			console.info("connecting");
			console.info(data);
		})
		socket.on('reconnecting', function(data) {
			console.info("reconnecting");
			console.info(data);
		})

		socket.on('error', function(error) {
			console.info("error", error);

			//openSocket();
			console.info("Reopening socket after error");
			setTimeout(reopenSocket, 30000 + Math.round(Math.random() * 30000));
		});

		socket.on('connect', function() {
			console.info("Successfully connected");

			if(options.channels) {
				if(options.channels.client) {
					console.info("subscribing to private client data");
					self.subscribePrivate();
				}
				if(!options.channels.trades) {
					console.info("unsubscribing trade");
					self.unsubscribe(getChannel('trade').key)
				}
				if(!options.channels.depth) {
					console.info("unsubscribing depth");
					self.unsubscribe(getChannel('depth').key)
				}
			}

		});

		socket.on('disconnected', function() {
			console.info("disconnected");
		});


		socket.on('disconnect', function() {
			console.info("disconnect");
		});


		socket.on('close', function() {
			console.info("Got socket close");
		});

		function reSubscribe() {
			console.info("Resubscribing");
			self.subscribe('lag');
		}


		self.subscribePrivate = function() {
			console.info("Subscribe private");
			var httpsClient = new mtGoxAPIV2(keys.keys[0], keys.keys[1]);

			httpsClient.idKey(function(err, json) {
			    if (err) { throw err; }

			    console.info("---------------Client Id Key:--------------");
			    console.info(json);

			    var key = json.data;
			    console.info("Subscribing private")
				var message = {
					"op": "mtgox.subscribe",
					"key": key
				};
				socket.send(JSON.stringify(message));
				console.info("Sent private subscribe with",message)


			});

		};


		self.subscribe = function(channel) {
			var message = {
				"op": "subscribe",
				"channel": channel
			};
			socket.send(JSON.stringify(message));
		};
		self.subscribeType = function(type) {
			var message = {
				"op": "subscribe",
				"type": type
			};
			socket.send(JSON.stringify(message));
		};

		self.unsubscribe = function(channel) {
			var message = {
				"op": "unsubscribe",
				"channel": channel
			};
			socket.send(JSON.stringify(message));
		};

		self.close = function(timeout) {
			console.info("Close called");
		};

		return socket;
	}

	function reopenSocket() {
		console.info("Disconnecting socket");
		self.socket = null;
		lastPulse = new Date() / 1E3;
		self.socket = openSocket();
	}
	self.socket = openSocket();

	function checkPulse() {
		var now = new Date() / 1E3;
		if((now - lastPulse) > 30) {
			console.info("No activity on socket for " + (Math.round((now - lastPulse)*100)/100) + "s");
		}
		if (now - lastPulse > threshhold) {
			console.info("More than " + threshhold + "s since last activity.  Destroying and re-creating socket.")
			reopenSocket();
		}
	}
	setInterval(checkPulse, 30000);
};
util.inherits(MtGoxClient, EventEmitter); 

exports.MtGoxClient = MtGoxClient;

exports.connect = function() {
	return new MtGoxClient();
}
