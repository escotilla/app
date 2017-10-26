import React from 'react';
import {NavLink, Route} from 'react-router-dom';
import {withRouter} from 'react-router-dom'
import examples from '../configs/examples';

class Examples extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {match} = this.props;

    return (
      <div className="col-xs-12">
        <h3>
          <NavLink to={match.url}>Example Gallery!!</NavLink>
        </h3>
        {match.isExact ? <Thumbnails match={match} examples={examples}/> : null}
        {examples.map(example => (
          <Route
            component={example.component}
            path={match.url + example.path}
            key={match.url + example.path}/>
        ))}
      </div>
    )
  }
}

const Thumbnails = ({match, examples}) => (
  <div className="panel panel-default">
    <div className="panel-body">
      <p>Select an example</p>
      {examples.map(example => (
        <Thumbnail
          key={example.path}
          example={example}
          match={match}/>
      ))}
    </div>
  </div>
);

const Thumbnail = ({match, example}) => (
  <div className="col-xs-6 col-sm-3">
    <NavLink
      className="thumbnail"
      to={match.url + example.path}>{example.title}</NavLink>
  </div>
);

export default withRouter(Examples);