var amqp = require('amqp');

var exchangeName = 'pals';
var incomingQueue = 'pals.input';
var incomingRoutingKey = 'pals.input';
var outgoingRoutingKey = 'pals.output';
var server = require('./module/server.js');
var connection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"});
var fs = require('fs');

process.setMaxListeners(0);

connection.on('ready', function () {
   connection.queue(incomingQueue, function(q){ 
       console.log('Queue ' + q.name + ' is open');  
	   q.bind(exchangeName,incomingRoutingKey);
       q.subscribe(function (message) {
           handleMessage(message);
       });
   });
});

function handleMessage(message) {
	console.log('processing message: ' + message._id);
	server.copyFilesToLocal(message,function(err,message){
		console.log('Copied files to local filesystem');
		result = server.localFilenames(message);
		console.log('Added local filenames');
    	result = server.createDir(result);
    	console.log('Created working directory');
    	server.writeInput(result,function(inputWritten){
    		console.log('Wrote input file');
    		server.prepareScript(inputWritten,function(preparedScript){
    			console.log('Prepared script');
    			server.executeScript(preparedScript,function(err,executedScript){
    				console.log('Executed script');
            	    fs.unlinkSync(executedScript.scriptFilename);
            	    fs.unlinkSync(executedScript.inputFilename);
            	    console.log('Deleted script and input file');
            	    server.readOutput(executedScript,function(err,outputRead,output){
            	    	console.log('Read output file');
            	    	fs.unlinkSync(outputRead.outputFilename);
                 	    fs.rmdirSync(outputRead.dir);
                 	    console.log('Deleted output file and removed working directory');
                 	    server.moveFilesToS3(output,function(err,movedToS3){
                 	    	console.log('Moved files to S3');
                 	    	sendMessage(movedToS3);
                 	    });
            	    });
    			});
        	});
    	});
	});
}

function sendMessage(output) {
	var outgoingConnection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"});

	outgoingConnection.on('ready', function () {
		outgoingConnection.exchange(exchangeName,{}, function (exchange) {
			exchange.publish(outgoingRoutingKey, message);
			console.log('Sent output message');
	    });
	});
}