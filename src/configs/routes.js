import Home from '../components/Home';
import Settings from '../components/Settings';
import About from '../components/About';
import Register from '../components/Register';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import AboutLoanProgram from '../components/AboutLoanProgram';
import Faq from '../components/Faq';
import UploadDocuments from '../components/UploadDocuments';
import LoanContract from '../components/LoanContract';

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
    title: 'Dashboard Escotilla',
    component: Dashboard,
    private: true,
    includeInPrivateNav: true,
    routes: [
      {
        path: '/account/settings',
        title: 'Settings',
        component: Settings,
        private: true,
      },
      {
        path: '/account/upload-documents',
        title: 'Upload Documents',
        component: UploadDocuments,
        private: true
      },
      {
        path: '/account/loan-contract',
        title: 'Loan Contract',
        component: LoanContract,
        private: true
      }
    ]
  }
];