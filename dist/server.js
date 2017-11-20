'use strict';

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _csurf = require('csurf');

var _csurf2 = _interopRequireDefault(_csurf);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('es6-promise').polyfill();

var app = (0, _express2.default)();

app.use((0, _compression2.default)());
app.use((0, _cookieParser2.default)());
app.use(_bodyParser2.default.json());
app.use((0, _csurf2.default)({ cookie: true }));

app.use(_express2.default.static(__dirname + '/public'));

app.get('/*', function (request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.listen(3002, function () {
  console.log('Go to http://localhost:3002');
});