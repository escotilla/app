import {polyfill} from 'es6-promise';

polyfill();
import React from 'react';
import compression from 'compression';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import cors from 'cors';
import Express from 'express';
import {renderToString} from 'react-dom/server';
import {createStore} from 'redux';
import {StaticRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import rootReducer from './src/reducers/index';
import App from './src/components/App';

const app = Express();
const port = 8000;

app.use(compression());
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());
app.use(csurf({cookie: true}));

app.use(function (req, res, next) {
  if (req.url.match(/^\/(css|js|img|font|png)\/.+/)) {
    res.setHeader('Cache-Control', 'public, max-age=259200');
  }
  next();
});

app.use('/public', Express['static'](__dirname + '/public'));

app.get('*', handleRender);

app.listen(port, function () {
  console.log('listing on port ' + port);
});

function handleRender(req, res) {
  const store = createStore(rootReducer);
  const context = {};

  const html = renderToString(
    <StaticRouter
      location={req.url}
      context={context}
    >
      <Provider store={store}>
        <App/>
      </Provider>
    </StaticRouter>
  );

  const preloadedState = store.getState();

  res.send(renderApp(html, preloadedState));
}

function renderApp(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"> 
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"> 
        <meta name="theme-color" content="#000000"> 
        <title>Sam Stanton-Reid</title> 
        <meta name="description" content="Sam Stanton-Reid's Website"/> 
        <meta property="og:description" content="Sam Stanton-Reid's Website"/> 
        <meta property="og:title" content="Sam Stanton-Reid"/> 
        <meta property="og:site_name" content="Sam Stanton-Reid"/> 
        <meta property="og:type" content="website"/> 
        <meta name="author" content="Sam Stanton-Reid"/>
        <style>
        html {
    font-size: 14px;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
}
        .loader{border-radius:100%;height:5rem;width:5rem;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.loader:before{content:'';position:absolute;left:0;right:0;top:0;bottom:0;border:2px solid rgba(255,255,255,0.3);border-right-color:white;border-radius:100%;animation:spin 0.66s linear infinite;-webkit-animation:spin 0.66s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@-webkit-keyframes spin{to{-webkit-transform:rotate(360deg)}}
        </style>
        <noscript id="deferred-styles">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
        <link rel="stylesheet" href="https://cdn.rawgit.com/konpa/devicon/df6431e323547add1b4cf45992913f15286456d3/devicon.min.css">
        <link rel="stylesheet" type="text/css" href="/public/styles.css">
        </noscript>
         <script>
      var loadDeferredStyles = function() {
        var addStylesNode = document.getElementById("deferred-styles");
        var replacement = document.createElement("div");
        replacement.innerHTML = addStylesNode.textContent;
        document.body.appendChild(replacement);
        addStylesNode.parentElement.removeChild(addStylesNode);
      };
      var raf = requestAnimationFrame || mozRequestAnimationFrame ||
          webkitRequestAnimationFrame || msRequestAnimationFrame;
      if (raf) raf(function() { window.setTimeout(loadDeferredStyles, 0); });
      else window.addEventListener('load', loadDeferredStyles);
    </script>
    <script>
      if (typeof Object.assign != 'function') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
          value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
              throw new TypeError('Cannot convert undefined or null to object');
            }
      
            var to = Object(target);
      
            for (var index = 1; index < arguments.length; index++) {
              var nextSource = arguments[index];
      
              if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                  // Avoid bugs when hasOwnProperty is shadowed
                  if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                  }
                }
              }
            }
            return to;
          },
          writable: true,
          configurable: true
        });
      }
    </script>
      </head>
      <body>
        <div id="app">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
        </script>
        <script src="/public/bundle.js" async defer></script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCpVI0dT4zjgVZLsbVB-FR7ENQdtZVf52I" async defer></script>
      </body>
    </html>
    `;
}