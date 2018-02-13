import React from 'react';
import {Switch, Route} from 'react-router-dom';
import Nav from './Nav';
import RouteWithSubRoutes from './RouteWithSubRoutes';
import Footer from './Footer';
import routes from '../configs/routes';
import NotFound from './NotFound';
import AppContainer from './AppContainer';

const App = () => (
  <AppContainer>
    <Nav routes={routes}/>
    <div style={{position: 'relative', top: '47px'}}>
      <Switch>
        {routes.map((route, i) => (
          <RouteWithSubRoutes {...route} key={i}/>
        ))}
        <Route component={NotFound}/>
      </Switch>
      <Footer/>
    </div>
  </AppContainer>
);

export default App;