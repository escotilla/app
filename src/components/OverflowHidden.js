import React from 'react';

class OverflowHidden extends React.Component {
  componentDidMount() {
    document.body.classList.add("overflow-hidden");
  }

  componentWillUnmount() {
    console.log('banana');
    document.body.classList.remove("overflow-hidden");
  }

  render() {
    return <div/>;
  }
}

export default OverflowHidden;