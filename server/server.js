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
	server.copyFilesToLocal(message,function(err,message){
		result = server.localFilenames(message);
    	result = server.createDir(result);
    	server.writeInput(result,function(inputWritten){
    		server.prepareScript(inputWritten,function(preparedScript){
    			server.executeScript(preparedScript,function(err,executedScript){
            	    fs.unlinkSync(executedScript.scriptFilename);
            	    fs.unlinkSync(executedScript.inputFilename);
            	    assert.equal(fs.existsSync(executedScript.outputFilename),true);
            	    server.readOutput(executedScript,function(err,outputRead,output){
            	    	fs.unlinkSync(outputRead.outputFilename);
                 	    fs.rmdirSync(outputRead.dir);
                 	    done();
            	    });
    			});
        	});
    	});
	});
}