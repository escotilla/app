'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _GoogleMap = require('./GoogleMap');

var _GoogleMap2 = _interopRequireDefault(_GoogleMap);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

var _features = require('../actions/features');

var _reactRedux = require('react-redux');

var _reactRouterDom = require('react-router-dom');

var _redux = require('redux');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NationalParks = function (_React$Component) {
  _inherits(NationalParks, _React$Component);

  function NationalParks(props) {
    _classCallCheck(this, NationalParks);

    var _this = _possibleConstructorReturn(this, (NationalParks.__proto__ || Object.getPrototypeOf(NationalParks)).call(this, props));

    _this.handleClick = _this.handleClick.bind(_this);
    _this.mouseOver = _this.mouseOver.bind(_this);
    _this.renderTableRow = _this.renderTableRow.bind(_this);

    _this.types = [];

    _this.state = {
      bounds: [[], []],
      name: ''
    };
    return _this;
  }

  _createClass(NationalParks, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.props.fetchFeaturesIfNeeded('park');
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(newProps) {
      var features = newProps.featureCollection.features;
      if (features && features.length > 0) {
        this.types = this.removeDuplicates(features);
      }
    }
  }, {
    key: 'removeDuplicates',
    value: function removeDuplicates(arr) {
      var visited = {};

      for (var i = 0; i < arr.length; i++) {
        var type = arr[i].properties.UNIT_TYPE === '' ? 'null' : arr[i].properties.UNIT_TYPE;

        if (!visited.hasOwnProperty(type)) {
          visited[type] = 1;
        } else {
          visited[type]++;
        }
      }

      return visited;
    }
  }, {
    key: 'setInfoBox',
    value: function setInfoBox(name, type) {
      document.getElementById('box').textContent = name + (type === '' ? '' : ', ' + type);
    }
  }, {
    key: 'mouseOver',
    value: function mouseOver(e) {
      var type = e.feature.getProperty('UNIT_TYPE');
      this.setInfoBox(e.feature.getProperty('UNIT_NAME'), type);
    }
  }, {
    key: 'handleClick',
    value: function handleClick(e) {
      var bounds = d3.geoBounds(e);
      var type = e.properties.UNIT_TYPE;

      this.setInfoBox(e.properties.UNIT_NAME, type);
      this.setState({ bounds: bounds });
    }
  }, {
    key: 'getRowText',
    value: function getRowText(feature) {
      return feature.properties.UNIT_NAME + ' (' + feature.properties.UNIT_TYPE + ') ';
    }
  }, {
    key: 'renderTableRow',
    value: function renderTableRow(feature, i) {
      return _react2.default.createElement(
        'button',
        {
          key: i,
          onClick: this.handleClick.bind(this, feature),
          type: 'button',
          className: 'list-group-item' },
        this.getRowText(feature),
        _react2.default.createElement('i', { className: 'fa fa-map-marker' })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      if (this.props.loading) {
        return _react2.default.createElement(
          'div',
          { className: 'jumbotron text-center' },
          _react2.default.createElement('i', { className: 'fa fa-cog fa-spin fa-4x' })
        );
      }

      var color = d3.scaleOrdinal(d3.schemeCategory20).domain(Object.keys(this.types));

      return _react2.default.createElement(
        'div',
        { className: 'national-parks' },
        _react2.default.createElement(
          'div',
          { className: 'park-grid' },
          _react2.default.createElement(
            'div',
            { className: 'text-center justify' },
            _react2.default.createElement(
              'h2',
              { style: { margin: 0 } },
              'US National Parks'
            )
          ),
          _react2.default.createElement(
            'div',
            { className: 'park-map' },
            _react2.default.createElement(
              'h2',
              { className: 'text-center justify', id: 'box' },
              'Explore the map or table beneath'
            ),
            _react2.default.createElement(_GoogleMap2.default, {
              height: '100%',
              width: '100%',
              bounds: this.state.bounds,
              style: function style(feature, i) {
                return { fillColor: color(feature.f.UNIT_TYPE), strokeOpacity: '0.5' };
              },
              data: this.props.featureCollection,
              mouseOver: this.mouseOver
            })
          ),
          _react2.default.createElement(
            'div',
            { className: 'park-table' },
            _react2.default.createElement(
              'div',
              {
                className: 'list-group' },
              this.props.featureCollection.features.map(function (feature, i) {
                return _this2.renderTableRow(feature, i);
              })
            )
          )
        )
      );
    }
  }]);

  return NationalParks;
}(_react2.default.Component);

NationalParks.defaultProps = {
  featureCollection: { type: 'FeatureCollection', features: [] }
};

var mapStateToProps = function mapStateToProps(state) {
  var featuresByCollection = state.featuresByCollection;

  var _ref = featuresByCollection['park'] || {
    loading: true,
    featureCollection: { "type": "FeatureCollection", "features": [] }
  },
      loading = _ref.loading,
      featureCollection = _ref.featureCollection;

  return { loading: loading, featureCollection: featureCollection };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return { fetchFeaturesIfNeeded: (0, _redux.bindActionCreators)(_features.fetchFeaturesIfNeeded, dispatch) };
};

exports.default = (0, _reactRouterDom.withRouter)((0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(NationalParks));