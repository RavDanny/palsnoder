var amqp = require('amqp');

var exchangeName = 'pals';
var outgoingQueue = 'pals.output';
var outgoingRoutingKey = 'pals.output';
var connection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"},{reconnect:false});
var queue = undefined;

process.setMaxListeners(0);

connection.on('ready', function () {
//   if( !queue ) {
	   queue = connection.queue(outgoingQueue, function(q){ 
	       console.log('Queue ' + q.name + ' is open');  
		   q.bind(exchangeName,outgoingRoutingKey);
	       q.subscribe(function (message) {
	    	   console.log(JSON.stringify(message));
	       });
	   });
//   }
});