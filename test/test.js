var server = require('../server/module/server.js');
var fs = require('fs');
require.extensions['.json'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var exampleInput = '../data/exampleInput.json';
var message = JSON.parse(require(exampleInput));
var testUpload = '../data/testUpload.png';

var domain = require('domain');
var assert = require("assert");

describe('server', function(){
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
        	result = server.createDir(message);
        	server.writeInput(result,function(inputWritten){
        		server.prepareScript(inputWritten,function(preparedScript){
        			server.executeScript(preparedScript,function(err,executedScript){
                        server.readOutput(executedScript,function(err,readOutput,output){
                    	    fs.unlinkSync(readOutput.scriptFilename);
                    	    fs.unlinkSync(readOutput.inputFilename);
                    	    assert.equal(fs.existsSync(readOutput.outputFilename),true);
                    	    fs.unlinkSync(readOutput.outputFilename);
                            fs.unlinkSync(readOutput.dir + '/' + output.files[0].filename);
                    	    fs.rmdirSync(readOutput.dir);
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
                    fs.unlinkSync(message.dir + '/' + output.files[0].filename);
            	    fs.rmdirSync(result.dir);
            	    done();
            	});
        	});
        })
    });
    describe('#copyFilesToDataDir()', function(){
        it('should copy files to data dir', function(done){
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
	            	    ],
                        dir : process.cwd()
	            	}
	            	server.copyFilesToDataDir(output,function(err,output){
	            		var file = output.files[0];
	            		assert(file.path,'No url returned');
	            		assert(file.key,'No key returned');
	            		assert(!fs.exists(file.filename));
	            		assert.equal(file.path,server.localDatabase+'/'+file.key);
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
                "path" : "/vagrant/palsnoder/test/example.txt",  
                "filename" : "example.txt",
                "mimetype" : "text/plain",   
                "size" : 8942,  
                "key" : "WEKJFEWF89787987FEWEF",    
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