import compression from 'compression'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import csurf from 'csurf'
import Express from 'express'

require('es6-promise').polyfill();

const app = Express();

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(csurf({cookie: true}));

app.use(Express.static(__dirname + '/public'));

app.get('/*', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.listen(3002, function () {
  console.log('Go to http://localhost:3002');
});