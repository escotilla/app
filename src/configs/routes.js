import Home from '../components/Home';
import Settings from '../components/Settings';
import About from '../components/About';
import Register from '../components/Register';
import Login from '../components/Login';
import Account from '../components/Account';
import AboutLoanProgram from '../components/AboutLoanProgram';
import Faq from '../components/Faq';

export default [
  {
    path: '/',
    title: 'Home',
    component: Home,
    exact: true,
    includeInNav: true
  },
  {
    path: '/about',
    title: 'About the Loan Program',
    component: AboutLoanProgram,
    includeInNav: true
  },
  {
    path: '/faq',
    title: 'FAQ',
    component: Faq,
    includeInNav: true
  },
  {
    path: '/about-us',
    title: 'About',
    component: About,
    includeInNav: true
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
    title: 'Account Escotilla',
    component: Account,
    private: true,
    includeInPrivateNav: true
  },
  {
    path: '/settings',
    title: 'Settings',
    component: Settings,
    private: true,
    includeInPrivateNav: true
  }
];