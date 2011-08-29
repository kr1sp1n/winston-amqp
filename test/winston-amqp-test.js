/*
 * winston-amqp-test.js: Tests for instances of the AMQP transport
 *
 * (C) 2011 Krispin Schulz
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('winston/test/helpers'),
    AMQP = require('../lib/winston-amqp').AMQP;

function assertAMQP(transport) {
  assert.instanceOf(transport, AMQP);
  assert.isFunction(transport.log);
};

var config = helpers.loadConfig(__dirname),
    transport = new (AMQP)(config.transports.amqp);

vows.describe('winston-amqp').addBatch({
 "An instance of the AMQP Transport": {
   "should have the proper methods defined": function () {
     assertAMQP(transport);
   },
   "the log() method": helpers.testNpmLevels(transport, "should log messages to AMQP server", function (ign, err, logged) {
     assert.isTrue(!err);
     assert.isTrue(logged);
   })
 }
}).export(module);
/*.addBatch({
  "An instance of the AMQP Transport": {
    "when the timeout has fired": {
      topic: function () {
        setTimeout(this.callback, config.transports.amqp.keepAlive);
      },
      "the log() method": helpers.testNpmLevels(transport, "should log messages to AMQP server", function (ign, err, logged) {
        assert.isTrue(!err);
        assert.isTrue(logged);
      })
    }
  }
})*/