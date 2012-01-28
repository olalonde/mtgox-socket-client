var util = require('util');
var fs = require('fs');
var events = require('events');
var io = require('socket.io-client');

var MTGOX_SOCKET_URL = 'https://socketio.mtgox.com/mtgox';
var MTGOX_CHANNELS = [];

try {
  var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
  if (Array.isArray(config.channels)) {
    MTGOX_CHANNELS = config.channels;
  }
}
catch(ex) {
  util.debug(util.inspect(ex));
  util.debug('Failed to parse config.json. No channels available.');
}

var getChannel = function(key) {
  return MTGOX_CHANNELS.filter(function(channel) {
    return (channel.key == key || channel.private == key);
  })[0];
};

var MtGoxClient = function() {
  events.EventEmitter.call(this);
  var self = this;
  var socket = io.connect(MTGOX_SOCKET_URL);

  socket.on('message', function(raw) {
    // Emit raw data
    var data = raw;
    self.emit('data', data);

    // Emit messages
      var message = data;
      self.emit('message', message);

      if (message.op == 'subscribe') {
        self.emit('subscribe', message);
      }

      if (message.op == 'unsubscribe') {
        self.emit('unsubscribe', message);
      }

      if (message.op == 'private') {
        self.emit(message.private, message);
      }
  });

  socket.on('error', function(error) {
    util.debug(error);
    self.emit('error', error);
  });

  socket.on('open', function() {
    self.emit('open');
  });

  socket.on('close', function() {
    self.emit('close');
  });

  self.subscribe = function(channel) {
    var message = {
      "op": "subscribe",
      "channel": channel
    };
    socket.send(message);
  };

  self.unsubscribe = function(channel) {
    var message = {
      "op": "unsubscribe",
      "channel": channel
    };
    socket.send(message);
  };

  self.close = function(timeout) {
  };

  // Allow access to underlying socket
  self.socket = socket;
};

util.inherits(MtGoxClient, events.EventEmitter);

exports.MtGoxClient = MtGoxClient;
exports.CHANNELS = MTGOX_CHANNELS;
exports.URL = MTGOX_SOCKET_URL;
exports.getChannel = getChannel;

exports.connect = function() {
  return new MtGoxClient();
};
