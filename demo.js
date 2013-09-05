var mtgox = require('./mtgox');
var consoleFormatting = require('./console-formatting')

var getTradeFormat = consoleFormatting.getTradeFormat;
var getPriceFormat = consoleFormatting.getPriceFormat;
var getTickerFormat = consoleFormatting.getTickerFormat;
var getDepthFormat = consoleFormatting.getDepthFormat;
var getTimeFormat = consoleFormatting.getTimeFormat;

// var MtGoxClient = require('./mtgox').MtGoxClient

var lastTradePrice = -1;
var lastTickerPrice = -1;
var lastTickerVolume = -1;

// var client = new MtGoxClient();
var client = mtgox.connect();

client.on('connect', function() {
  // Good place to unsubscribe from unwanted channels
  // client.unsubscribe(mtgox.getChannel('trade').key);
  // client.unsubscribe(mtgox.getChannel('depth').key);
  // client.unsubscribe(mtgox.getChannel('ticker').key);
});

client.on('subscribe', function(message) {
  renderSubscribeMessage(message);
});

client.on('unsubscribe', function(message) {
  renderUnsubscribeMessage(message);
});

client.on('trade', function(trade) {
  renderTradeMessage(trade, lastTradePrice);
  lastTradePrice = trade.price;
});

client.on('depth', function(depth) {
  renderDepthMessage(depth);
});

client.on('ticker', function(ticker) {
  renderTickerMessage(ticker, lastTickerPrice);
  lastTickerPrice = ticker.last;
  lastTickerVolume = ticker.vol;
});

process.on('exit', function() {
  console.log('Goodbye!'.bold);
  client.close();
});

var renderSubscribeMessage = function(message) {
  var format = 'Subscribed to channel:'.green;
  console.log(getTimeFormat(), format, getChannelFormat(message));
};

var renderUnsubscribeMessage = function(message) {
  var format = 'Unsubscribed from channel:'.red;
  console.log(getTimeFormat(), format, getChannelFormat(message));
};

var renderTradeMessage = function(trade, lastPrice) {
  console.log(getTimeFormat(), getTradeFormat(trade, lastPrice));
};

var renderTickerMessage = function(ticker, lastPrice) {
  console.log(getTimeFormat(), getTickerFormat(ticker, lastPrice));
};

var renderDepthMessage = function(depth) {
  console.log(getTimeFormat(), getDepthFormat(depth));
};

var getChannelFormat = function(message) {
  var channel = mtgox.getChannel(message.channel)||message.channel;
  return channel.name.magenta;
};
