'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _environment = require('../utilities/environment');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GoogleMap = function (_React$Component) {
  _inherits(GoogleMap, _React$Component);

  function GoogleMap(props) {
    _classCallCheck(this, GoogleMap);

    var _this = _possibleConstructorReturn(this, (GoogleMap.__proto__ || Object.getPrototypeOf(GoogleMap)).call(this, props));

    _this.createMap = _this.createMap.bind(_this);
    _this.loadData = _this.loadData.bind(_this);
    _this.checkLoaded = _this.checkLoaded.bind(_this);

    _this.state = {
      zoom: 3
    };
    return _this;
  }

  _createClass(GoogleMap, [{
    key: 'createMap',
    value: function createMap() {
      var map = google.maps;

      var options = {
        center: new map.LatLng(this.props.lat, this.props.lng),
        zoom: this.state.zoom
      };

      this.map = new map.Map(this.mapDiv, options);
    }
  }, {
    key: 'isLoaded',
    value: function isLoaded() {
      return (0, _environment.hasWindow)() && window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
    }
  }, {
    key: 'loadData',
    value: function loadData(data) {
      var map = this.map;

      map.data.addGeoJson(data);
      map.data.setStyle(this.props.style);

      if (this.props.mouseOver) {
        map.data.addListener('mouseover', this.props.mouseOver.bind(this));
      }

      if (this.props.onClick) {
        map.data.addListener('click', this.props.onClick.bind(this));
      }
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      return false;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (this.isLoaded()) {
        this.createMap();

        if (this.props.data) {
          this.loadData(this.props.data);
        }
      } else {
        this.interval = setTimeout(this.checkLoaded, 1000);
      }
    }
  }, {
    key: 'checkLoaded',
    value: function checkLoaded() {
      if (this.isLoaded()) {
        clearInterval(this.interval);
        this.createMap();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      clearInterval(this.interval);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      if (this.isLoaded()) {
        var center = newProps.center,
            data = newProps.data,
            bounds = newProps.bounds,
            marker = newProps.marker;


        if (data && data.features.length !== this.props.data.features.length) {
          this.loadData(data);
        }

        if (JSON.stringify(center) !== JSON.stringify(this.props.center)) {
          var latLng = new google.maps.LatLng(center.lat, center.lng);
          this.map.setCenter(latLng);
          this.map.setZoom(center.zoom);
        }

        if (JSON.stringify(bounds) !== JSON.stringify(this.props.bounds)) {
          var googleBounds = new google.maps.LatLngBounds(new google.maps.LatLng(bounds[0][1], bounds[0][0]), new google.maps.LatLng(bounds[1][1], bounds[1][0]));

          this.map.fitBounds(googleBounds);
        }

        if (JSON.stringify(marker) !== JSON.stringify(this.props.marker)) {
          var _latLng = new google.maps.LatLng(marker.lat, marker.lng);
          var googleMarker = new google.maps.Marker({
            position: _latLng,
            map: this.map
          });

          var infowindow = new google.maps.InfoWindow({
            content: marker.marker
          });

          googleMarker.addListener('click', function () {
            infowindow.open(this.map, googleMarker);
          });

          this.map.setCenter(_latLng);
          this.map.setZoom(marker.zoom);
        }
      } else {
        clearTimeout(this.interval);
        this.interval = setTimeout(this.checkLoaded, 1000);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          height = _props.height,
          width = _props.width,
          className = _props.className,
          style = _props.style;

      var dimensions = {};

      if (height && width) {
        dimensions = { height: height, width: width };
      }

      return _react2.default.createElement(
        'div',
        {
          style: Object.assign({}, style, dimensions),
          className: "google-map-container " + className },
        _react2.default.createElement('div', { className: 'google-map', ref: function ref(map) {
            return _this2.mapDiv = map;
          } })
      );
    }
  }]);

  return GoogleMap;
}(_react2.default.Component);

GoogleMap.defaultProps = {
  lng: -98,
  lat: 35,
  center: [],
  bounds: [[0, 0], [5, 5]],
  style: {}
};

exports.default = GoogleMap;