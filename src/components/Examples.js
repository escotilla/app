import React from 'react';
import {NavLink} from 'react-router-dom';
import {withRouter} from 'react-router-dom'
import RouteWithSubRoutes from './RouteWithSubRoutes';

class Examples extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {match, routes} = this.props;

    return (
      <div className="col-xs-12">
        <h3>
          <NavLink to={match.url}>Example Gallery</NavLink>
        </h3>
        {match.isExact ? <Thumbnails match={match} routes={routes}/> : null}
        {routes.map((route, i) => (
          <RouteWithSubRoutes
            component={route.component}
            path={route.path}
            key={i}/>
        ))}
      </div>
    )
  }
}

const Thumbnails = ({routes}) => (
  <div className="panel panel-default">
    <div className="panel-body">
      <p id="select-example-text">Select an example</p>
      {routes.map((route, i) => (
        <Thumbnail
          to={route.path}
          title={route.title}
          key={i}/>
      ))}
    </div>
  </div>
);

const Thumbnail = ({to, title}) => (
  <div className="col-xs-6 col-sm-3">
    <NavLink
      className="thumbnail"
      to={to}>{title}</NavLink>
  </div>
);

export default withRouter(Examples);