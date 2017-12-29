import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {boot} from '../actions/load-user';

class AppContainer extends React.Component {
  componentDidMount() {
    this.props.boot();
  }

  render() {
    if (this.props.booting) {
      return (
        <div>
          <h1>BOOTING</h1>
        </div>
      )
    }

    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    boot,
  } = state;

  return { booting: boot.booting };
};

const mapDispatchToProps = dispatch => {
  return {
    boot: bindActionCreators(boot, dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);