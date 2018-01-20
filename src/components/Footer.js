import React from 'react';

class Footer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row footer escotilla-footer">
        <img src="/public/images/logo.png"/>
        <p className="text-center">© 2017. Escotilla Financiera. All Rights Reserved.
          Torres de Las Americas, Punta Pacifica, 15th Floor Panama City, Panama</p>
      </div>
    );
  }
}

export default Footer;