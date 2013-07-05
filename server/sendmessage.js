var amqp = require('amqp');

var exchangeName = 'pals';
var routingKey = 'pals.input';
var exampleInput = '../data/exampleInputOneFile.json';

var fs = require('fs');

require.extensions['.json'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var message = JSON.parse(require(exampleInput));

var connection = amqp.createConnection({url: "amqp://guest:guest@localhost:5672"},{reconnect:false});

connection.on('ready', function () {
	connection.exchange(exchangeName,{}, function (exchange) {
		exchange.publish(routingKey, message);
		process.exit(code=0);
    });
});