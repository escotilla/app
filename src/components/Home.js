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
      <div className="container">
        <div className="col-12 text-center">
          <h3>HOW IT WORKS</h3>
          <h4>Apply quickly online directly from your Computer or Mobile Phone</h4>
        </div>
        <div className="row">
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h5>Step 1</h5>
            <h4>TELL US ABOUT YOUR BUSINESS</h4>
            <p>Create an Escotilla profile and complete our simple online application</p>
          </div>
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h5>Step 1</h5>
            <h4>TELL US ABOUT YOUR BUSINESS</h4>
            <p>Create an Escotilla profile and complete our simple online application</p>
          </div>
          <div className="col-12 col-sm-4 text-center">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"/>
            <h5>Step 1</h5>
            <h4>TELL US ABOUT YOUR BUSINESS</h4>
            <p>Create an Escotilla profile and complete our simple online application</p>
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