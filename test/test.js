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

describe('server', function(){
    describe('#copyFilesToLocal()', function(){
        it('should copy files', function(done){
        	this.timeout(100000);
            var result = server.copyFilesToLocal(message,function(err,message){
            	for( var i=0; i < message.files.length; ++i ) {
            		var file = message.files[i];
            		var path = server.localDatabase+'/'+file.key;
            		if( fs.existsSync(path) ) fs.unlinkSync(path);
            	}
            	done();
            });
        })
    });
    describe('#copyFileToLocal()', function(){
        it('should copy file', function(done){
        	this.timeout(100000);
        	var file = {
        	           type : "ModelOutput",
        	           url : exampleUrl,  
        	           filename : "example.txt",
        	           mimetype : "text/plain",   
        	           size : 8942,  
        	           key : exampleKey,    
        	           isWriteable : true,   
        	           created : 13029298292
        	       };
            server.copyFileToLocal(file,function(err,file){
            	var path = server.localDatabase+'/'+file.key;
            	fs.unlinkSync(path);
            	done();
            });
        })
    });
    describe('#localFilenames()', function(){
        it('should replace filenames', function(){
        	var result = server.localFilenames(message);
        	for( var i=0; i < result.files.length; ++i ) {
        		assert.equal(result.files[i].filename,server.localDatabase+'/'+result.files[i].key);
        	}
        })
    });
    describe('#createDir()', function(){
        it('should create working directory', function(){
        	var result = server.createDir(message);
        	assert.equal(fs.existsSync(result.dir),true);
        	fs.rmdir(result.dir);
        })
    });
    describe('#prepareScript()', function(){
        it('should create the r script', function(done){
        	var result = server.createDir(message);
        	result = server.prepareScript(result,function(preparedScript){
            	fs.unlinkSync(preparedScript.scriptFilename);
            	fs.rmdirSync(preparedScript.dir);
            	done();
        	});
        })
    });
    describe('#writeInput()', function(){
        it('should create the input json', function(done){
        	var result = server.createDir(message);
        	result = server.writeInput(result,function(result){
        		fs.unlinkSync(result.inputFilename);
            	fs.rmdirSync(result.dir);
            	done();
        	});
        })
    });
    describe('#executeScript()', function(){
        it('should execute the script', function(done){
        	this.timeout(100000);
        	server.copyFilesToLocal(message,function(err,message){
        		result = server.localFilenames(message);
            	result = server.createDir(result);
            	server.writeInput(result,function(inputWritten){
            		server.prepareScript(inputWritten,function(preparedScript){
            			server.executeScript(preparedScript,function(err,executedScript){
                    	    fs.unlinkSync(executedScript.scriptFilename);
                    	    fs.unlinkSync(executedScript.inputFilename);
                    	    assert.equal(fs.existsSync(executedScript.outputFilename),true);
                    	    fs.unlinkSync(executedScript.outputFilename);
                    	    fs.rmdirSync(executedScript.dir);
                    	    done();
            			});
                	});
            	});
        	});
        })
    });
    describe('#read output()', function(){
        it('should read output', function(done){
        	var result = server.createDir(message);
        	var outputFilename = message.dir + '/output.json';
        	var stream = fs.createWriteStream(outputFilename);
        	stream.once('open', function(fd) {
                stream.write(JSON.stringify(result)+'\n')
        		stream.end();
                result.outputFilename = outputFilename;
            	server.readOutput(result,function(err,message,output){
            		assert.equal(output.files.length, message.files.length);
            		assert.equal(output._id, message._id);
            		fs.unlinkSync(outputFilename);
            	    fs.rmdirSync(result.dir);
            	    done();
            	});
        	});
        })
    });
    describe('#moveFilesToS3()', function(){
        it('should copy files to S3', function(done){
        	this.timeout(100000);
        	
        	// first we make a copy of the test file because it is deleted at the end
        	var tempFile = 'temp.png';
        	fs.readFile(testUpload, function (err,data) {
        		fs.writeFile(tempFile, data, function (err) {
    	        	if (err) throw err
    	        	var output = {
	            	    _id : message._id,
	            	    files : [
	                        {
	                            "type" : "NEEAverageWindow", 
	                            "filename" : tempFile,
	                            "mimetype" : "image/png"     
	                        }
	            	    ]
	            	}
	            	server.moveFilesToS3(output,function(err,output){
	            		var file = output.files[0];
	            		assert(file.url,'No url returned');
	            		assert(file.key,'No key returned');
	            		assert(!fs.exists(file.filename));
	            		assert.equal(file.url,server.baseUrl+'/'+file.key);
	            		server.deleteFile(file,function(err,data){
	            			done();
	            		});
	            	});
    	        });
        	});
        });
    });
	describe('#removeFiles()', function(){
      it('should remove directory', function(){
    	  var testDir = 'testDir';
    	  fs.mkdirSync(testDir);
    	  var testFile = testDir + '/testFile';
    	  fs.writeFileSync(testFile,'This is the contents');
    	  var message = {dir:testDir};
    	  server.removeDirectory(message);
    	  assert(!fs.existsSync(testDir));
    	  assert(!fs.existsSync(testFile));
      });
    });
	describe('#dodgy script', function(){
        it('should produce an error gracefully', function(done){
        	this.timeout(100000);
        	var dodgy = {_id:'1234',files:[{   
                "type" : "Script",
                "url" : exampleUrl,  
                "filename" : "example.txt",
                "mimetype" : "text/plain",   
                "size" : 8942,  
                "key" : exampleKey,    
                "isWriteable" : true,   
                "created" : 13029298292
            }]};
        	server.handleMessage(dodgy,function(output){
        		console.log(JSON.stringify(output));
        		done();
        	})
        });
    });
})