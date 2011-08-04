/*
 * Subscribe to winston log levels over an AMQP exchange
 * First start subscribe.js and then publish.js to see log messages
 * 
 * (C) 2011 Krispin Schulz
 * MIT LICENCE
 *
 */
var amqp = require('amqp'),
    connection = amqp.createConnection({ 
      host: 'localhost',
      login: 'guest',
      password: 'guest'
    }),
    cli_colors = require('winston/lib/winston/config/cli-config').colors, // Just for nifty color effects
    colors = require('colors');

// Wait for connection to become established.
connection.on('ready', function () {
  console.log('Connection with ' + connection.options.host + ' is ready.');
  // Create an exchange.
  // You can set the name of the exchange as an option in the winston-amqp Transport; default is "winston.log"
  var exchange = connection.exchange('winston.log');

  exchange.on('open', function () {
    console.log('Exchange \"' + exchange.name + '\" is open.');

    // Create a queue.
    var queue = connection.queue('my-queue', function(queue) {
      console.log('Queue \"' + queue.name + '\" is declared.');

      // Bind queue and listen to routing key defined in log_level (all winston log levels are available here).
      // You can also use the binding keys '*' (can substitute for exactly one word) and '#' (can substitute for zero or more words)
      var log_level = "#" // we are only interested in error messages
      queue.bind(exchange, log_level);

      queue.on('queueBindOk', function() {
        console.log('Queue \"' + queue.name + '\" is binded.');
        console.log('Listen for log level '+log_level);
        // Receive messages
        var options = {};	
        //options.ack = true; // only for message acknowledgement
        queue.subscribe(options, function(message, headers, deliveryInfo){
	      var color = cli_colors[deliveryInfo.routingKey];
          console.log(deliveryInfo.routingKey[color]+":	" + message.text + ((message.meta) ? " with metadata: " + JSON.stringify(message.meta).blue : ''));
          //queue.shift(); // only for message acknowledgement
        });
      });
    });
  });
});