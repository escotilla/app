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

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(csurf({cookie: true}));

app.use('/public', Express['static'](__dirname + '/dist/public'));

app.get('*', handleRender);

app.listen(3002, function () {
  console.log('listing on port 3002')
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
        <title>React Router Redux Boilerplate</title>
                <link rel="stylesheet" type="text/css" href="/public/styles.css">
        <link
        rel="stylesheet"
        href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
        crossorigin="anonymous">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
      </head>
      <body>
        <div id="app">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
        </script>
        <script src="/public/bundle.js"></script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCpVI0dT4zjgVZLsbVB-FR7ENQdtZVf52I" async defer></script>
      </body>
    </html>
    `
}