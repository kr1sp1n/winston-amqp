/*
 * winston-amqp.js: Transport for emitting messages to an AMQP server
 *
 * (C) 2011 Krispin Schulz
 * MIT LICENCE
 *
 */

var amqp = require('amqp');
    
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
  this.exchange   = options.exchange   || 'winston.log';
  this.level      = options.level      || 'info';
  this.silent     = options.silent     || false;

  this.keepAlive  = options.keepAlive  || 10000;
  this.state      = 'unopened';
  this.pending    = [];

  this.connection = amqp.createConnection({ 
    host: this.host,
    port: this.port,
    vhost: this.vhost,
    login: this.login,
    password: this.password
  });
};

//
// ### function log (level, msg, [meta], callback)
// Core logging method exposed to Winston. Metadata is optional.
//
AMQP.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  if (this.silent) {
    return callback(null, true);
  }
    
  this.open(function (err) {
    if (err) {
      return callback(err, false);
    }
    self._exchange.publish(level, {'text': msg, 'meta': meta});
    callback(null, true);

/*

    self._db.collection(self.collection, function (err, col) {
      if (err) {
        return callback(err, false);
      }

      var entry = { 
        level: level, 
        message: msg, 
        meta: meta
      };
      
      col.save(entry, { safe: self.safe }, function (err, doc) {
        if (err) {
          return callback(err, false);
        }

        callback(null, true);
      });
    });
*/
  });
};

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
    var exchange = self.connection.exchange(self.exchange, {});
    exchange.on('open', function () {
      //console.log('Exchange \"' + exchange.name + '\" is open');
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