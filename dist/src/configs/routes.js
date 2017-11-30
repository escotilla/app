'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Home = require('../components/Home');

var _Home2 = _interopRequireDefault(_Home);

var _Examples = require('../components/Examples');

var _Examples2 = _interopRequireDefault(_Examples);

var _NationalParks = require('../components/NationalParks');

var _NationalParks2 = _interopRequireDefault(_NationalParks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
    path: '/',
    title: 'Home',
    component: _Home2.default,
    exact: true
}, {
    path: '/examples',
    title: 'Examples',
    component: _Examples2.default,
    exact: false,
    routes: [{
        path: '/examples/national-parks',
        title: 'National Parks',
        component: _NationalParks2.default
    }]
}];