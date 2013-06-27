exports.executions = '/pals/executions';
exports.localDatabase = '/pals/data';
var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');

exports.copyFilesToLocal = function(message) {
    if( message.files ) {
        for( var i=0; i < message.files.length; ++i ) {
            var file = message.files[i];
            exports.copyFileToLocal(file);
        }
    }
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
                if (err) throw err
                //console.log('File saved: ' + file.key);
                if( callback ) callback(file);
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
	var exists = fs.existsSync(dirName);
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
	console.log(inputFilename);
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
}