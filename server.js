require('es6-promise').polyfill();
import React from 'react'
import compression from 'compression'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import csurf from 'csurf'
import Express from 'express'
import {renderToString} from 'react-dom/server'
import {createStore} from 'redux'
import {StaticRouter} from 'react-router-dom'
import {Provider} from 'react-redux'
import rootReducer from './src/reducers/index'
import App from './src/components/App'

const app = Express();
const port = process.env.PORT || 3002;

app.use(compression());
app.use(cookieParser());
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
  console.log('listing on port ' + port)
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

  res.send(renderApp(html, preloadedState))
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
        <noscript id="deferred-styles"}>
           <link
        rel="stylesheet"
        href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
       <link rel="stylesheet" type="text/css" href="/public/styles.css">
        </noscript>
         <script>
      var loadDeferredStyles = function() {
        var addStylesNode = document.getElementById("deferred-styles");
        var replacement = document.createElement("div");
        replacement.innerHTML = addStylesNode.textContent;
        document.body.appendChild(replacement)
        addStylesNode.parentElement.removeChild(addStylesNode);
      };
      var raf = requestAnimationFrame || mozRequestAnimationFrame ||
          webkitRequestAnimationFrame || msRequestAnimationFrame;
      if (raf) raf(function() { window.setTimeout(loadDeferredStyles, 0); });
      else window.addEventListener('load', loadDeferredStyles);
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
    `
}