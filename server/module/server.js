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

exports.prepareScript = function(message) {
	var scriptFilename = message.dir + '/script.r';
	var stream = fs.createWriteStream(scriptFilename);
	stream.once('open', function(fd) {
	  stream.write('print ( "Hello, world!", quote = FALSE )\n');
	  stream.end();
	});
	return message;
};