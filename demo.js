var util = require('util');
var colors = require('colors');
var datetime = require('datetime');
var mtgox = require('./mtgox');

var lastTradePrice = -1;
var lastTickerPrice = -1;
var lastTickerVolume = -1;
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

client.on('trade', function(message) {
  renderTradeMessage(message, lastTradePrice);
  lastTradePrice = message.trade.price;
});

client.on('depth', function(message) {
  renderDepthMessage(message);
});

client.on('ticker', function(message) {
  renderTickerMessage(message, lastTickerPrice);
  lastTickerPrice = message.ticker.last;
  lastTickerVolume = message.ticker.vol;
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

var renderTradeMessage = function(message, lastPrice) {
  console.log(getTimeFormat(), getTradeFormat(message.trade, lastPrice));
};

var renderTickerMessage = function(message, lastPrice) {
  console.log(getTimeFormat(), getTickerFormat(message.ticker, lastPrice));
};

var renderDepthMessage = function(message) {
  console.log(getTimeFormat(), getDepthFormat(message.depth));
};

var getDepthFormat = function(depth) {
  var format = '';

  if (depth.volume < 0) {
    format += '+ '.grey;
  }
  else {
    format += '- '.grey;
  }

  if (depth.type_str == 'ask') {
    format += 'Ask: '.grey.bold;
  }
  else if (depth.type_str == 'bid') {
    format += 'Bid: '.grey.bold;
  }

  var amount = Math.abs(depth.volume);
  var price = Math.abs(depth.price);

  format += (amount + ' ' + depth.item).yellow + ' @ ';
  format += getPriceFormat(price, price, depth.currency);

  return format;
};

var getTickerFormat = function(ticker, lastPrice) {
  var format = '> ';

  var last = 'Last: '.bold;
  var high = 'High: '.bold;
  var low = 'Low: '.bold;
  var vol = 'Vol: '.bold;
  var avg = 'Avg: '.bold;

  last += getPriceFormat(ticker.last.display, lastPrice);
  high += ticker.high.display;
  low += ticker.low.display;
  vol += ticker.vol.display;
  avg += ticker.vwap.display;

  return format + [vol, high, low, avg, last].join(' ');
};

var getTradeFormat = function(trade, lastPrice) {
  var format = '$ ';

  if (trade.trade_type == 'ask') {
    format += 'Ask: '.bold;
  }
  else if (trade.trade_type == 'bid') {
    format += 'Bid: '.bold;
  }

  format += (trade.amount + ' ' + trade.item).yellow + ' @ ';
  format += getPriceFormat(trade.price, lastPrice, trade.price_currency);

  return format;
};

var getChannelFormat = function(message) {
  var channel = mtgox.getChannel(message.channel)||message.channel;
  return channel.name.magenta;
};

var getTimeFormat = function() {
  var now = new Date();
  var time = '[' + datetime.format(now, '%T') + ']';
  return time.blue;
};

var getPriceFormat = function(currentPrice, lastPrice, currency) {
  var format = currentPrice + (currency ? ' ' + currency : '');
  if (lastPrice < 0) {
    return format;
  }

  var delta = lastPrice - currentPrice;
  var percent = (lastPrice > 0) ? (delta / lastPrice) * 100 : 100;
  var round = function(n) {
    return Math.round(Math.abs(n) * 100) / 100;
  };

  if (delta > 0) {
    format += (' \u25b2 +' + round(delta) + ' +' + round(percent) + '%').green;
  }
  else if (delta < 0) {
    format += (' \u25bc -' + round(delta) + ' -' +round( percent) + '%').red;
  }

  return format;
};
