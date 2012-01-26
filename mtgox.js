var util = require('util');
var fs = require('fs');
var events = require('events');
var io = require('socket.io-client');

var MTGOX_WEBSOCKET_URL = 'https://socketio.mtgox.com/mtgox';
var MTGOX_CHANNELS = [];

try {
  var config = JSON.parse(fs.readFileSync('./config.json'));
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
  var socket = io.connect(MTGOX_WEBSOCKET_URL);

  var emitChannelMessage = function(message) {
    var channel = getChannel(message.channel);
    if (channel) {
      self.emit(channel.private, message);
    }
  };

  socket.on('message', function(raw) {
    // Emit raw data
    var data = raw;
    self.emit('data', data);

    // Emit JSON messages
      var message = data;
      self.emit('message', message);

      if (message.op == 'subscribe') {
        self.emit('subscribe', message);
      }

      if (message.op == 'unsubscribe') {
        self.emit('unsubscribe', message);
      }

      if (message.op == 'private') {
        emitChannelMessage(message);
      }
  });

  socket.onerror = function(error) {
    util.debug(error);
    self.emit('error', error);
  };

  socket.onopen = function() {
    self.emit('open');
  };

  socket.onclose = function() {
    self.emit('close');
  }

  self.subscribe = function(channel) {
    var message = {
      "op": "subscribe",
      "channel": channel
    };
    socket.send(JSON.stringify(message));
  };

  self.unsubscribe = function(channel) {
    var message = {
      "op": "unsubscribe",
      "channel": channel
    };
    socket.send(message);
  };

  self.close = function(timeout) {
    socket.close(timeout);
  };

  // Allow access to underlying socket
  self.socket = socket;
};

util.inherits(MtGoxClient, events.EventEmitter);

exports.MtGoxClient = MtGoxClient;
exports.CHANNELS = MTGOX_CHANNELS;
exports.URL = MTGOX_WEBSOCKET_URL;
exports.getChannel = getChannel;

exports.connect = function() {
  return new MtGoxClient();
};
