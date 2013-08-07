var amqp = require('amqp');

var exchangeName = 'pals';
var incomingQueue = 'pals.input';
var incomingRoutingKey = 'pals.input';
var outgoingRoutingKey = 'pals.output';
var server = require('./module/server.js');
var connection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"},{reconnect:false});
var fs = require('fs');
var queue = undefined;

process.setMaxListeners(0);

connection.on('ready', function () {
   queue = connection.queue(incomingQueue, function(q){ 
       console.log('Queue ' + q.name + ' is open');  
	   q.bind(exchangeName,incomingRoutingKey);
       q.subscribe(function (message) {
    		server.handleMessage(message,sendMessage);
       });
   });
});

function sendMessage(output) {
	console.log('sending message');
	var outgoingConnection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"},
			{reconnect:false});
    console.log('created connection');
	outgoingConnection.on('ready', function () {
		console.log('connection ready');
		outgoingConnection.exchange(exchangeName,{}, function (exchange) {
			console.log('exchange ready');
output.error = 'This was an error';
			exchange.publish(outgoingRoutingKey, output);
			console.log('Sent output message');
	    });
	});
}