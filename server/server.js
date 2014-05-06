var redis = require("redis");
var server = require('./module/server.js');
var fs = require('fs');

var REDIS_HOST = process.env.REDIS_HOST;
if( !REDIS_HOST ) REDIS_HOST = '127.0.0.1';
var REDIS_PORT = process.env.REDIS_PORT;
if( !REDIS_PORT ) REDIS_PORT = 6379;
var client = redis.createClient(REDIS_PORT,REDIS_HOST);

console.log('Listening for messages on queue pals.input');

var workers = 0;
var hangSeconds = 0;
var maxWorkers = 4;
var maxHangSeconds = 10000;

processNext();

function processNext() {
	if( workers < maxWorkers ) {
	    client.lpop('pals.input',function(err,value){
	        if( value ) {
			    console.log('Received message, number of workers: ' + workers);
				++workers;
	    	    server.handleMessage(JSON.parse(value),sendMessage);
	        }	
		    setTimeout(processNext,100);
	    });
    }
	else {
		++hangSeconds;
		if( hangSeconds > maxHangSeconds ) {
			hangSeconds = 0;
			workers = 0;
		}
		setTimeout(processNext,1000);
	}
}

function sendMessage(output) {
	console.log('sending reply to client');
	--workers;
	client.rpush('pals.output',JSON.stringify(output));
}

process.setMaxListeners(0);