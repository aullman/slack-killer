var static = require('node-static-alias');
var http = require('http');

var args = require('minimist')(process.argv.slice(2));

var host = args.h || '0.0.0.0';
var port = args.p || 8080;
var socketPort = args.ws || 9001;

var websockets = require('./websockets.js')(host, socketPort);

var file = new static.Server('webclient');

var app = http.createServer(function(req, res) {
  console.log(req.url);
  req.addListener('end', function() {
    file.serve(req, res);
  }).resume();

}).listen(port, host);
console.log('Server running at http://' + host + ':' + port + '/');

