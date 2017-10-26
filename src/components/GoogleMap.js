import React from 'react';
import { hasWindow } from '../utilities/environment';

class GoogleMap extends React.Component {
  constructor(props) {
    super(props);

    this.createMap = this.createMap.bind(this);
    this.loadData = this.loadData.bind(this);
    this.checkLoaded = this.checkLoaded.bind(this);

    this.state = {
      zoom: 3
    };
  }

  createMap() {
    const map = google.maps;

    var options = {
      center: new map.LatLng(
        this.props.lat,
        this.props.lng
      ),
      zoom: this.state.zoom
    };

    this.map = new map.Map(this.mapDiv, options);
  }

  isLoaded() {
    return hasWindow() && window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
  }

  loadData(data) {
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

  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    if (this.isLoaded()) {
      this.createMap();

      if (this.props.data) {
        this.loadData(this.props.data);
      }
    } else {
      this.interval = setTimeout(this.checkLoaded, 1000);
    }
  }

  checkLoaded() {
    if (this.isLoaded()) {
      clearInterval(this.interval);
      this.createMap();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentWillReceiveProps(newProps) {
    if (this.isLoaded()) {
      const {center, data, bounds, marker} = newProps;

      if (data && data.features.length !== this.props.data.features.length) {
        this.loadData(data);
      }

      if (JSON.stringify(center) !== JSON.stringify(this.props.center)) {
        var latLng = new google.maps.LatLng(center.lat, center.lng);
        this.map.setCenter(latLng);
        this.map.setZoom(center.zoom);
      }

      if (JSON.stringify(bounds) !== JSON.stringify(this.props.bounds)) {
        var googleBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(bounds[0][1], bounds[0][0]),
          new google.maps.LatLng(bounds[1][1], bounds[1][0])
        );

        this.map.fitBounds(googleBounds);
      }

      if (JSON.stringify(marker) !== JSON.stringify(this.props.marker)) {
        let latLng = new google.maps.LatLng(marker.lat, marker.lng);
        var googleMarker = new google.maps.Marker({
          position: latLng,
          map: this.map
        });

        var infowindow = new google.maps.InfoWindow({
          content: marker.marker
        });

        googleMarker.addListener('click', function () {
          infowindow.open(this.map, googleMarker);
        });

        this.map.setCenter(latLng);
        this.map.setZoom(marker.zoom);
      }
    } else {
      clearTimeout(this.interval);
      this.interval = setTimeout(this.checkLoaded, 1000);
    }
  }

  render() {
    const { height, width, className, style } = this.props;
    let dimensions = {};

    if (height && width) {
      dimensions = {height: height, width: width};
    }

    return (
      <div
        style={Object.assign({}, style, dimensions)}
        className={"google-map-container " + className}>
        <div className="google-map" ref={map => this.mapDiv = map}>
        </div>
      </div>
    );
  }
}

GoogleMap.defaultProps = {
  lng: -98,
  lat: 35,
  center: [],
  bounds: [[0, 0], [5, 5]],
  style: {}
};

export default GoogleMap;