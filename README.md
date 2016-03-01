# winston-amqp

An AMQP transport for [winston][0].
Use [winston][0] logging with RabbitMQ to react on log messages.
Inspired by [winston-mongodb][1].

[![Build Status](https://travis-ci.org/kr1sp1n/winston-amqp.png?branch=master)](https://travis-ci.org/kr1sp1n/winston-amqp)

## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing winston-amqp
```
  [sudo] npm install winston-amqp
```

## Usage
``` js
  var AMQP = require('winston-amqp').AMQP;
  winston.add(AMQP, options);
```

The AMQP transport takes the following options:

* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.
* __exchange__: The name of the exchange you want to push log messages in, defaults to 'winston.log'.
* __host:__ The host running RabbitMQ, defaults to localhost.
* __port:__ The port on the host that RabbitMQ is running on, defaults to 5672.
* __vhost:__ virtual host entry for the RabbitMQ server, defaults to '/'
* __login:__ login for the RabbitMQ server, defaults to 'guest'
* __password:__ password for the RabbitMQ server, defaults to 'guest'
* __authMechanism:__ authMechanism to use with RabbitMQ server, defaults to 'AMQPLAIN'
* __ssl:__ ssl connect via SSL to RabbitMQ server, defaults to '{ enabled : false }'. For options check: https://github.com/postwait/node-amqp

*Metadata:* Logged as part of the message body with key 'meta' (see examples/subscribe.js).

#### Author: [Krispin Schulz](http://kr1sp1n.tumblr.com/)

[0]: https://github.com/indexzero/winston
[1]: https://github.com/indexzero/winston-mongodb
