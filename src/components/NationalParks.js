import React from 'react';
import GoogleMap from './GoogleMap';
import * as d3 from 'd3';
import {fetchFeaturesIfNeeded} from '../actions/features';
import {connect} from 'react-redux'
import {withRouter} from 'react-router-dom'
import {bindActionCreators} from 'redux'

class NationalParks extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.mouseOver = this.mouseOver.bind(this);
    this.renderTableRow = this.renderTableRow.bind(this);

    this.types = [];

    this.state = {
      bounds: [[], []],
      name: ''
    }
  }

  componentWillMount() {
    this.props.fetchFeaturesIfNeeded('park');
  }

  componentWillReceiveProps(newProps) {
    const features = newProps.featureCollection.features;
    if (features && features.length > 0) {
      this.types = this.removeDuplicates(features);
    }
  }

  removeDuplicates(arr) {
    let visited = {};

    for (let i = 0; i < arr.length; i++) {
      let type = arr[i].properties.UNIT_TYPE === '' ? 'null' : arr[i].properties.UNIT_TYPE;

      if (!visited.hasOwnProperty(type)) {
        visited[type] = 1;
      } else {
        visited[type]++;
      }
    }

    return visited;
  }

  setInfoBox(name, type) {
    document.getElementById('box').textContent = name + (type === '' ? '' : ', ' + type);
  }

  mouseOver(e) {
    var type = e.feature.getProperty('UNIT_TYPE');
    this.setInfoBox(e.feature.getProperty('UNIT_NAME'), type);
  }

  handleClick(e) {
    var bounds = d3.geoBounds(e);
    var type = e.properties.UNIT_TYPE;

    this.setInfoBox(e.properties.UNIT_NAME, type);
    this.setState({bounds: bounds});
  }

  getRowText(feature) {
    return feature.properties.UNIT_NAME + ' (' + feature.properties.UNIT_TYPE + ') ';
  }

  renderTableRow(feature, i) {
    return (
      <button
        key={i}
        onClick={this.handleClick.bind(this, feature)}
        type="button"
        className="list-group-item">
        {this.getRowText(feature)}
        <i className="fa fa-map-marker"/>
      </button>
    )
  }

  render() {
    if (this.props.loading) {
      return (
        <div className="jumbotron text-center">
          <i className="fa fa-cog fa-spin fa-4x"/>
        </div>
      )
    }

    var color = d3.scaleOrdinal(d3.schemeCategory20).domain(Object.keys(this.types));

    return (
      <div className="national-parks">
        <div className="park-grid">
          <div className="text-center justify">
            <h2 style={{margin: 0}}>US National Parks</h2>
          </div>
          <div className="park-map">
            <h2 className="text-center justify" id="box">Explore the map or table beneath</h2>
            <GoogleMap
              height="100%"
              width="100%"
              bounds={this.state.bounds}
              style={(feature, i) => {
              return {fillColor: color(feature.f.UNIT_TYPE), strokeOpacity: '0.5'}
            }}
              data={this.props.featureCollection}
              mouseOver={this.mouseOver}
            />
          </div>
          <div className="park-table">
            <div
              className="list-group">
              {this.props.featureCollection.features.map((feature, i) => this.renderTableRow(feature, i))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

NationalParks.defaultProps = {
  featureCollection: {type: 'FeatureCollection', features: []}
};


const mapStateToProps = state => {
  const {featuresByCollection} = state;
  const {
    loading,
    featureCollection
  } = featuresByCollection['park'] || {
    loading: true,
    featureCollection: {"type": "FeatureCollection", "features": []}
  };

  return {loading, featureCollection};
};

const mapDispatchToProps = dispatch => {
  return {fetchFeaturesIfNeeded: bindActionCreators(fetchFeaturesIfNeeded, dispatch)}
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NationalParks));