import Home from '../components/Home';
import Examples from '../components/Examples';
import NationalParks from '../components/NationalParks';
import Register from '../components/Register';
import Login from '../components/Login';
import Account from '../components/Account';

export default [
  {
    path: '/',
    title: 'Home',
    component: Home,
    exact: true
  },
  {
    path: '/register',
    title: 'Register',
    component: Register
  },
  {
    path: '/login',
    title: 'Login',
    component: Login
  },
  {
    path: '/account',
    title: 'Account',
    component: Account,
    private: true
  }
];