import React from 'react';

class NavIcon extends React.Component {
  render() {
    const {selected, icon, onClick} = this.props;

    return (
      <div
        className={"burger " + (selected ? 'selected' : '')}
        onClick={onClick}>
        <i className={"fa fa-2x " + icon}/>
      </div>
    );
  }
}

NavIcon.defaultProps = {
  icon: 'fa-globe',
  onClick: null
};

export default NavIcon;