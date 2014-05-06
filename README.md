palsnoder
=========

R execution service for pals written for node.js

Dependencies
* node.js
* R
* Redis
* R packages (RJSONIO,..)
* node.js packages (amqp,async,mocha,aws-sdk,node-uuid,underscore)
* 

## FAQ:

### How do I connect to an external redis server?

By default palsnoder connects to a redis server at the host 127.0.0.1 and port 6379. If you want to use different values set the following environment variables:

    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379

### How do I run palsnoder?

    cd server
    node server.js

