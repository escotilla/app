import Home from '../components/Home';
import Examples from '../components/Examples';
import NationalParks from '../components/NationalParks';

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
        exact: false,
        routes: [
            {
                path: '/examples/national-parks',
                title: 'National Parks',
                component: NationalParks
            }
        ]
    }
];