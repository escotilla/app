import Home from '../components/Home';
import Examples from '../components/Examples';

export default [
    {
        path: '/',
        title: 'Home',
        component: Home,
        exact: true
    }, {
        path: '/examples',
        title: 'Examples',
        component: Examples,
        exact: false
    }
];