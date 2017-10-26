import React from 'react';
import {NavLink} from 'react-router-dom';

class NotFound extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="text-center">
        <h2>I messed up</h2>
        <h3>{this.props.location.pathname} no longer exists!</h3>
        <NavLink to="/">
          <h4>Go home</h4>
        </NavLink>
      </div>
    );
  }
}

export default NotFound;