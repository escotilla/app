import React from 'react';
import {connect} from 'react-redux';
import Language from '../utilities/language';
import {Redirect} from 'react-router-dom';

const Home = ({match, language, loggedIn}) => {

  if (loggedIn) {
      return <Redirect to='/account' />;
  }

  return (
  <div className="table">
    <div
      style={{
        backgroundImage: 'url("/public/images/background-shop.jpg")',
        height: '25vw'
      }}
      className="hero-image">
      <div className="hero-text">
        <h1 id="home-header-text">{Language.get(language, 'home.header.part_1')}</h1>
        <h1 id="home-header-text">
          <strong>{Language.get(language, 'home.header.part_2')}</strong>
        </h1>
        <h1 id="home-header-text">{Language.get(language, 'home.header.part_3')}</h1>
        <button className="btn btn-primary btn-lg">{Language.get(language, 'button.get_started')}</button>
      </div>
    </div>
    <div className="container">
      <div className="col-xs-12 text-center">
        <h2>HOW IT WORKS</h2>
        <h3>Apply quickly online directly from your Computer or Mobile Phone</h3>
      </div>
      <div>
        <div className="col-xs-12 col-sm-4 text-center">
          <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
          <h5>Step 1</h5>
          <h4>TELL US ABOUT YOUR BUSINESS</h4>
          <p>Create an Escotilla profile and complete our simple online application</p>
        </div>
        <div className="col-xs-12 col-sm-4 text-center">
          <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
          <h5>Step 1</h5>
          <h4>TELL US ABOUT YOUR BUSINESS</h4>
          <p>Create an Escotilla profile and complete our simple online application</p>
        </div>
        <div className="col-xs-12 col-sm-4 text-center">
          <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
          <h5>Step 1</h5>
          <h4>TELL US ABOUT YOUR BUSINESS</h4>
          <p>Create an Escotilla profile and complete our simple online application</p>
        </div>
      </div>
    </div>
  </div>
)};

const mapStateToProps = state => {
  const {
    language,
    user
  } = state;

  const loggedIn = user && user.token;

  return {language, loggedIn};
};

export default connect(mapStateToProps)(Home);