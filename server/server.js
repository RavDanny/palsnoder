var redis = require("redis");
var server = require('./module/server.js');
var fs = require('fs');

var client = redis.createClient();

console.log('Listening for messages on queue pals.input');

processNext();

function processNext() {
	client.lpop('pals.input',function(err,value){
	    if( value ) {
			console.log('Received message');
	    	server.handleMessage(JSON.parse(value),sendMessage);
	    }	
		setTimeout(processNext,100);
	});
}

function sendMessage(output) {
	client.rpush('pals.output',JSON.stringify(output));
}

process.setMaxListeners(0);