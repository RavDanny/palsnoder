exports.executions = '/pals/executions';
exports.localDatabase = '/pals/data';
exports.bucket = 'pals-test';
exports.baseUrl = 'https://s3-ap-southeast-2.amazonaws.com/'+exports.bucket;

var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var async = require('async');
var AWS = require('aws-sdk');
AWS.config.loadFromPath(__dirname + '/config.json');
var uuid = require('node-uuid');

exports.copyFilesToLocal = function(message,callback) {
	var asyncFunctions = new Array();
	
	function makeCallbackFunction(file) {
		return function(callback) {
			exports.copyFileToLocal(file,callback);
		}
	}
	
    if( message.files ) {
        for( var i=0; i < message.files.length; ++i ) {
        	var ff = makeCallbackFunction(message.files[i]);
        	asyncFunctions.push(ff);
        }
    }
    async.parallel(asyncFunctions,
        function(err, results){
    	    callback(err,message);
        }
    );
};
exports.copyFileToLocal = function(file,callback) {

    var parsedUrl = url.parse(file.url,true);
    var port = 80;
    if( parsedUrl.protocol == 'https:' ) port = 443;

    var options = {
        host: parsedUrl.host, 
        port: port, 
        path: parsedUrl.pathname
    };
    if( parsedUrl.protocol == 'http:' ) http.get(options, handleResult);
    else if( parsedUrl.protocol == 'https:' ) https.get(options, handleResult);
    
    function handleResult(res) {
    	
        var data = '';
        res.setEncoding('binary');

        res.on('data', function(chunk){
            data += chunk
        });

        res.on('end', function(){
            fs.writeFile(exports.localDatabase+'/'+file.key, data, 'binary', function(err){
                if (err) callback(err);
                else callback(null,file);
            })
        });
    }
};

exports.localFilenames = function(message) {
    if( message.files ) {
        for( var i=0; i < message.files.length; ++i ) {
            var file = message.files[i];
            file.filename = exports.localDatabase + '/' + file.key;
        }
    }
    return message;
};

exports.createDir = function(message) {
	var dirName = exports.executions + '/' + message._id;
	if( !fs.existsSync(dirName) ) fs.mkdirSync(dirName);
	message.dir = dirName;
	return message;
};

exports.prepareScript = function(message,callback) {
	var scriptFilename = message.dir + '/rRunner.r';
	var experimentScript = '';
	for( var i =0; i < message.files.length; ++i ) {
	    var file = message.files[i];
	    if( file.type == 'Script' ) {
	    	experimentScript = file.filename;
	    }
	}
	if( experimentScript.length <= 0 ) throw 'No script input found';
	var inputString = '';
	inputString += 'library("RJSONIO")\n';
    inputString += 'inputFile <- "input.json"\n';
    inputString += 'input <- fromJSON(paste(readLines(inputFile), collapse=""))\n';
    inputString += 'source("'+experimentScript+'")\n';
    inputString += 'output <- toJSON(output)\n';
    inputString += 'fileConn<-file("'+message.dir+'/output.json")\n';
    inputString += 'writeLines(output, fileConn)\n';
    inputString += 'close(fileConn)\n';
    
    fs.writeFile(scriptFilename, inputString, function (err) {
    	if (err) throw err
    	message.scriptFilename = scriptFilename;
  	    callback(message);
    });
};

exports.writeInput = function(message,callback) {
	var inputFilename = message.dir + '/input.json';
	var stream = fs.createWriteStream(inputFilename);
	stream.once('open', function(fd) {
        stream.write(JSON.stringify(message)+'\n')
		stream.end();
    	message.inputFilename = inputFilename;
    	callback(message);
	});
}

exports.executeScript = function(message,callback) {
	var scriptFilename = message.scriptFilename;
	var exec=require('child_process').exec;
	process.chdir(message.dir);
	exec('R --no-save < '+scriptFilename,function(err,stdout,stderr){
		if( err ) callback(err);
		else {
			console.log(stdout);
			message.outputFilename = message.dir + '/' + 'output.json';
			callback(null,message);
		}
	});
}

exports.readOutput = function(message,callback) {
	fs.readFile(message.outputFilename, 'utf8', function (err,data) {
	    if (err) callback(err);
	    else {
	    	var output = JSON.parse(data);
	    	output._id = message._id;
	    	callback(null,message,output);
	    }
	});
}

exports.moveFileToS3 = function(file,callback) {
	if( file.error ) {
		callback(null,file);
		return;
	}
	
	fs.readFile(file.filename, function (err,data) {
	    if (err) callback(err);
	    else {
	    	
	    	var s3 = new AWS.S3();
	    	
	    	file.key = uuid.v4();
	    	file.url = exports.baseUrl + '/' + file.key;
	    	
	    	s3.putObject({
	    		ACL : "public-read",
	    		Bucket : exports.bucket,
	    		ContentType : file.mimetype,
	    		Key : file.key,
	    		Body : data
	    	},function(err,data){
	    		if( err ) callback(err,file);
	    		else {
	    			fs.unlinkSync(file.filename);
	    		    callback(null,file);
	    		}
	    	});
	    }
	});
};

exports.moveFilesToS3 = function(output,callback) {
	
	if( output.error ) {
		callback(output.error);
		return;
	}
	
	var asyncFunctions = new Array();
	
	function makeCallbackFunction(file) {
		return function(callback) {
			exports.moveFileToS3(file,callback);
		}
	}
	
    if( output.files ) {
        for( var i=0; i < output.files.length; ++i ) {
        	var ff = makeCallbackFunction(output.files[i]);
        	asyncFunctions.push(ff);
        }
    }
    async.parallel(asyncFunctions,
        function(err, results){
    	    callback(err,output);
        }
    );
};

exports.deleteFile = function(file,callback) {
	var s3 = new AWS.S3();
	s3.deleteObject({
		Bucket : exports.bucket,
		Key : file.key
	},function(err,data){
		callback(err,file);
	})
}