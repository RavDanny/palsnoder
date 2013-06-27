var amqp = require('amqp');

var exchange = 'pals';
var queue = 'pals.input';
var routingKey = 'pals.input';

var server = require('./module/server.js');

var connection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"});

connection.on('ready', function () {
   connection.queue(queue, function(q){ 
       console.log('Queue ' + q.name + ' is open');  
	    q.bind(exchange,routingKey);
        q.subscribe(function (message) {
            handleMessage(message);
        });
    });
});

function handleMessage(message) {
	message = server.copyFilesToLocal(message);
	message = server.localFilenames(message);
	message = server.createDir(message);
	server.prepareScript(message, function(preparedScript){
		server.writeInput(preparedScript,function(wroteInput){
			
		});
	});
}