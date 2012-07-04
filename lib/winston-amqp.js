/*
 * winston-amqp.js: Transport for emitting messages to an AMQP server
 *
 * (C) 2011 Krispin Schulz
 * MIT LICENCE
 *
 */

var util = require('util'),
    amqp = require('amqp'),
    winston = require('winston');
    
//
// ### function AMQP (options)
// Constructor for the AMQP transport object.
//
var AMQP = exports.AMQP = function (options) {
  options = options || {};
  
  this.name       = 'amqp';
  this.host       = options.host       || 'localhost';
  this.port       = options.port       || 5672;
  this.vhost      = options.vhost      || '/';
  this.login      = options.login      || 'guest';
  this.password   = options.password   || 'guest';  
  this.level      = options.level      || 'info';
  this.silent     = options.silent     || false;
  this.keepAlive  = options.keepAlive  || true;
  this.state      = 'unopened';
  this.pending    = [];  

  this.exchange = (typeof options.exchange == 'object')
    ? options.exchange
    : { name: options.exchange };

  if (!this.exchange.name) {
    this.exchange.name = 'winston.log';
  }
  
  if (!this.exchange.properties) {
    this.exchange.properties = {};
  }

  this.connection = amqp.createConnection({ 
    host: this.host,
    port: this.port,
    vhost: this.vhost,
    login: this.login,
    password: this.password
  });

  this.connection.on('error', function(err){
    var self = this;

    //console.dir(err);

    switch(err.code) {
      case 320: // CONNECTION_FORCED
      case "ECONNREFUSED":
        console.log('NO RABBITMQ CONN');
        // try to reconnect after 10s
        setTimeout(function () {
          //console.log('try to reconnect...');
          self.reconnect();
        }, 10000);
        break;
    }
  });
};

//
// Inherit from `winston.Transport`.
//
util.inherits(AMQP, winston.Transport);

//
// Define a getter so that `winston.transports.AMQP` 
// is available and thus backwards compatible.
//
winston.transports.AMQP = AMQP;

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
AMQP.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  if (this.silent) {
    return callback(null, true);
  }
    
  this.open(function (err) {
    if (err) {
      self.emit('error', err);
    }
    self._exchange.publish(level, {'text': msg, 'meta': meta});
    self.emit('logged');
    callback(null, true);
  });
};

//
// ### function open (callback)
// #### @callback {function} Continuation to respond to when complete
// Attempts to open a new connection to AMQP Server. If one has not opened yet
// then the callback is enqueued for later flushing.
//
AMQP.prototype.open = function (callback) {
  var self = this;
  
  if (this.state === 'opening' || this.state === 'unopened') {
    //
    // While opening our AMQP connection, append any callback
    // to a list that is managed by this instance. 
    //
    this.pending.push(callback);
    
    if (this.state === 'opening') {
      return;
    }
  }
  else if (this.state === 'opened') {
    return callback();
  }
  else if (this.state === 'error') {
    return callback(err);
  }
  
  function flushPending (err, exchange) {
    self._exchange = exchange;
    self.state = 'opened';
    
    //
    // Iterate over all callbacks that have accumulated during
    // the creation of the TCP socket.
    //
    for (var i = 0; i < self.pending.length; i++) {
      self.pending[i]();
    }
    
    // Quickly truncate the Array (this is more performant).
    self.pending.length = 0;
  }
  
  function onError (err) {
    self.state = 'error';
    self.error = err;
    flushPending(err, false);
  }
  
  this.state = 'opening';
  // Wait for connection to become established.
  self.connection.on('ready', function () {
    var exchange = self.connection.exchange(self.exchange.name, self.exchange.properties);
    exchange.on('open', function () {
      console.log('Exchange \"' + exchange.name + '\" is open');
      flushPending(null, exchange);
    });
  });
  
  //
  // Set a timeout to end the amqp connection unless `this.keepAlive`
  // has been set to true in which case it is the responsibility of the 
  // programmer to close the underlying connection.
  //
  if (!(this.keepAlive === true)) {
    setTimeout(function () {
      self.state = 'unopened';
      return self.connection ? self.connection.end() : null
    }, this.keepAlive);
  }
};