var server = require('../server/module/server.js');
var fs = require('fs');
require.extensions['.json'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var exampleInput = '../data/exampleInput.json';
var message = JSON.parse(require(exampleInput));
var testUpload = '../data/testUpload.png';
var exampleUrl = "https://s3-ap-southeast-2.amazonaws.com/pals-test/7WvTivgRT3GgnePfZequ_example.txt";
var exampleKey = "7WvTivgRT3GgnePfZequ_example.txt";

var domain = require('domain');
var assert = require("assert");

function runTests() {
	fileDoesNotExist();
    noScript();
    noFiles();
}

runTests();

function noFiles() {
	var noFiles = {_id:'1234'};
    server.handleMessage(noFiles,function(output){
    	assert.equal(output.error,'No input files provided');
    });
}

function noScript() {
	var noScript = {_id:'1234',files:[{   
        "type" : "InputDataSet",
        "url" : exampleUrl,  
        "filename" : "example.txt",
        "mimetype" : "text/plain",   
        "size" : 8942,  
        "key" : exampleKey,    
        "isWriteable" : true,   
        "created" : 13029298292
    }]};
    server.handleMessage(noScript,function(output){
    	assert.equal(output.error,'Please upload an experiment script to run');
    	assert(output.dir);
    	assert(!fs.existsSync(output.dir));
    });
}

function fileDoesNotExist() {
	var message = {_id:'1234',files:[{   
        "type" : "InputDataSet",
        "url" : "http://dodygyurl.com.co.uk",  
        "filename" : "example.txt",
        "mimetype" : "text/plain",   
        "size" : 8942,  
        "key" : exampleKey,    
        "isWriteable" : true,   
        "created" : 13029298292
    }]};
    server.handleMessage(message,function(output){
    	assert(output.error);
    });
}