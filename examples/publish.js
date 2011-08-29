/*
 * Publish any winston logs to AMQP server
 * First start subscribe.js and then publish.js to see log messages
 *
 * (C) 2011 Krispin Schulz
 * MIT LICENCE
 *
 */

var winston = require('winston'),
    AMQP = require('../lib/winston-amqp').AMQP;

winston.cli();

// No options are required. Check out the lib code to see the defaults
// Be careful with overwriting the default exchange name 
// because this implies also changing the exchange name for every subscriber
var options = {
	'host': 'localhost' // default
};

winston.add(AMQP, options);

winston.log('info', 'Hello AMQP log events!');
winston.log('warn', 'This is a warning!');
winston.log('error', 'ERROR! MUST DESTROY ALL HUMANS', { code: '505', anything: 'This is metadata'});

for(var i=0; i<5; i++) {
	winston.log('help', 'Badabumbadabum');
}

