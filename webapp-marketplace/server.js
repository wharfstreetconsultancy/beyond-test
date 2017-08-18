// 'use strict';

var express = require('express');
var app = express();

// Static content
app.use(express.static('assets'));

// GET - root context
app.get('/', function (req, res) {
	// res.send('Hello world\n');
	res.sendFile( __dirname + "/" + "index.html" );
})


var server = app.listen(8080, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://" + host + ":" + port + "/");
})