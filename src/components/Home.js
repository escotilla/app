import React from 'react';
import {connect} from 'react-redux';
import Language from '../utilities/language';
import {Redirect, NavLink} from 'react-router-dom';

const Home = ({language, loggedIn}) => {

  if (loggedIn) {
    return <Redirect to='/account'/>;
  }

  return (
    <div>
      <div
        style={{
          backgroundImage: 'url("/public/images/background-shop.jpg")',
          height: '25vw'
        }}
        className="jumbotron hero-image">
        <div className="hero-text">
          <h3 id="home-header-text">{Language.get(language, 'home.header.part_1')}</h3>
          <h3 id="home-header-text">
            <strong>{Language.get(language, 'home.header.part_2')}</strong>
          </h3>
          <h3 id="home-header-text">{Language.get(language, 'home.header.part_3')}</h3>
          <NavLink to="/register">
            <button className="btn btn-primary btn-lg">{Language.get(language, 'button.get_started')}</button>
          </NavLink>
        </div>
      </div>
      <div className="container mb-5 mt-5">
        <div className="col-12 text-center mb-5 mt-5">
          <h2>How it works</h2>
          <h6>Apply quickly online directly from your Computer or Mobile Phone</h6>
        </div>
        <div className="row mb-5 mt-2">
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h6>Step 1</h6>
            <h5>Tell us about your business</h5>
            <h6 className="mb-5">Create an Escotilla profile and complete our simple online application</h6>
          </div>
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h6>Step 1</h6>
            <h5>Tell us about your business</h5>
            <h6 className="mb-5">Create an Escotilla profile and complete our simple online application</h6>
          </div>
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h6>Step 1</h6>
            <h5>Tell us about your business</h5>
            <h6 className="mb-5">Create an Escotilla profile and complete our simple online application</h6>
          </div>
        </div>
      </div>
    </div>
  )
};

const mapStateToProps = state => {
  const {
    language,
    user
  } = state;

  const loggedIn = user && user.api_token;

  return {language, loggedIn};
};

export default connect(mapStateToProps)(Home);