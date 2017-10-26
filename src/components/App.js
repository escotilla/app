import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import rootReducer from '../reducers/index';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import Nav from './Nav';
import Footer from './Footer';
import routes from '../configs/routes';
import NotFound from './NotFound';
import thunkMiddleware from 'redux-thunk';

const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

const App = ({routes}) => (
  <div>
    <Nav routes={routes}/>
      <Switch>
        {routes.map(route => (
          <Route
            path={route.path}
            key={route.path}
            exact={route.exact}
            component={route.component}/>
        ))}
        <Route component={NotFound}/>
      </Switch>
      <Footer />
  </div>
);

ReactDOM.render(
  <BrowserRouter>
    <Provider store={store}>
      <App routes={routes} />
    </Provider>
  </BrowserRouter>,
  document.getElementById('app')
);