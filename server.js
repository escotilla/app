var compression = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csurf = require('csurf');
var express = require('express');

require('es6-promise').polyfill();

var app = express();

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(csurf({cookie: true}));

app.use(express.static(__dirname + '/public'));

app.get('/*', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.listen(3002, function () {
  console.log('Go to http://localhost:3002');
});