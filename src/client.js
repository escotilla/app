import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import rootReducer from './reducers/index';
import {BrowserRouter} from 'react-router-dom';
import routes from './configs/routes';
import thunkMiddleware from 'redux-thunk';
import App from './components/App';

// Grab state from server-generated html
const preloadedState = window.__PRELOADED_STATE__;

// Get rid of it!
delete window.__PRELOADED_STATE__;

const store = createStore(rootReducer, preloadedState, applyMiddleware(thunkMiddleware));

ReactDOM.render((
  <BrowserRouter>
    <Provider store={store}>
      <App routes={routes}/>
    </Provider>
  </BrowserRouter>),
  document.getElementById('app')
);