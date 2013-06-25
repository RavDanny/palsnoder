var server = require('../server/module/server.js');
var fs = require('fs');
require.extensions['.json'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var exampleInput = '../data/exampleInput.json';
var message = JSON.parse(require(exampleInput));

var assert = require("assert")
describe('server', function(){
    describe('#copyFilesToLocal()', function(){
        it('should copy files', function(){
            var result = server.copyFilesToLocal(message);
        })
    });
    describe('#copyFileToLocal()', function(){
        it('should copy file', function(done){
        	this.timeout(5000);
        	var file = {
        	           type : "ModelOutput",
        	           url : "https://s3-ap-southeast-2.amazonaws.com/pals-test/7WvTivgRT3GgnePfZequ_example.txt",  
        	           filename : "example.txt",
        	           mimetype : "text/plain",   
        	           size : 8942,  
        	           key : "7WvTivgRT3GgnePfZequ_example.txt",    
        	           isWriteable : true,   
        	           created : 13029298292
        	       };
            var result = server.copyFileToLocal(file,function(file){
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
})