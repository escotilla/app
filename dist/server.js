'use strict';

var _es6Promise = require('es6-promise');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _csurf = require('csurf');

var _csurf2 = _interopRequireDefault(_csurf);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _server = require('react-dom/server');

var _redux = require('redux');

var _reactRouterDom = require('react-router-dom');

var _reactRedux = require('react-redux');

var _index = require('./src/reducers/index');

var _index2 = _interopRequireDefault(_index);

var _App = require('./src/components/App');

var _App2 = _interopRequireDefault(_App);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _es6Promise.polyfill)();


var app = (0, _express2.default)();
var port = 8000;

app.use((0, _compression2.default)());
app.use((0, _cookieParser2.default)());
app.use((0, _cors2.default)());
app.use(_bodyParser2.default.json());
app.use((0, _csurf2.default)({ cookie: true }));

app.use(function (req, res, next) {
  if (req.url.match(/^\/(css|js|img|font|png)\/.+/)) {
    res.setHeader('Cache-Control', 'public, max-age=259200');
  }
  next();
});

app.use('/public', _express2.default['static'](__dirname + '/public'));

app.get('*', handleRender);

app.listen(port, function () {
  console.log('listing on port ' + port);
});

function handleRender(req, res) {
  var store = (0, _redux.createStore)(_index2.default);
  var context = {};

  var html = (0, _server.renderToString)(_react2.default.createElement(
    _reactRouterDom.StaticRouter,
    {
      location: req.url,
      context: context
    },
    _react2.default.createElement(
      _reactRedux.Provider,
      { store: store },
      _react2.default.createElement(_App2.default, null)
    )
  ));

  var preloadedState = store.getState();

  res.send(renderApp(html, preloadedState));
}

function renderApp(html, preloadedState) {
  return '\n    <!doctype html>\n    <html>\n      <head>\n        <meta charset="utf-8"> \n        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"> \n        <meta name="theme-color" content="#000000"> \n        <title>Sam Stanton-Reid</title> \n        <meta name="description" content="Sam Stanton-Reid\'s Website"/> \n        <meta property="og:description" content="Sam Stanton-Reid\'s Website"/> \n        <meta property="og:title" content="Sam Stanton-Reid"/> \n        <meta property="og:site_name" content="Sam Stanton-Reid"/> \n        <meta property="og:type" content="website"/> \n        <meta name="author" content="Sam Stanton-Reid"/> \n        <noscript id="deferred-styles"}>\n           <link\n        rel="stylesheet"\n        href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">\n        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">\n        <link rel="stylesheet" href="https://cdn.rawgit.com/konpa/devicon/df6431e323547add1b4cf45992913f15286456d3/devicon.min.css">\n        <link rel="stylesheet" type="text/css" href="/public/styles.css">\n        </noscript>\n         <script>\n      var loadDeferredStyles = function() {\n        var addStylesNode = document.getElementById("deferred-styles");\n        var replacement = document.createElement("div");\n        replacement.innerHTML = addStylesNode.textContent;\n        document.body.appendChild(replacement);\n        addStylesNode.parentElement.removeChild(addStylesNode);\n      };\n      var raf = requestAnimationFrame || mozRequestAnimationFrame ||\n          webkitRequestAnimationFrame || msRequestAnimationFrame;\n      if (raf) raf(function() { window.setTimeout(loadDeferredStyles, 0); });\n      else window.addEventListener(\'load\', loadDeferredStyles);\n    </script>\n    <script>\n      if (typeof Object.assign != \'function\') {\n        // Must be writable: true, enumerable: false, configurable: true\n        Object.defineProperty(Object, "assign", {\n          value: function assign(target, varArgs) { // .length of function is 2\n            \'use strict\';\n            if (target == null) { // TypeError if undefined or null\n              throw new TypeError(\'Cannot convert undefined or null to object\');\n            }\n      \n            var to = Object(target);\n      \n            for (var index = 1; index < arguments.length; index++) {\n              var nextSource = arguments[index];\n      \n              if (nextSource != null) { // Skip over if undefined or null\n                for (var nextKey in nextSource) {\n                  // Avoid bugs when hasOwnProperty is shadowed\n                  if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {\n                    to[nextKey] = nextSource[nextKey];\n                  }\n                }\n              }\n            }\n            return to;\n          },\n          writable: true,\n          configurable: true\n        });\n      }\n    </script>\n      </head>\n      <body>\n        <div id="app">' + html + '</div>\n        <script>\n          window.__PRELOADED_STATE__ = ' + JSON.stringify(preloadedState).replace(/</g, '\\u003c') + '\n        </script>\n        <script src="/public/bundle.js" async defer></script>\n        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCpVI0dT4zjgVZLsbVB-FR7ENQdtZVf52I" async defer></script>\n      </body>\n    </html>\n    ';
}