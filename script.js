var map = L.map('map', {
    center: [42.378, -71.103],
    zoom: 14
  });
  
  var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  }).addTo(map);
  
  var myGeoJson;
  
  var leafletLayers;
  
  var geojsonMarkerOptions = {
    color: 'green'
  }
  
  var url = "https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/master/Landmark/Public_Art/LANDMARK_PublicArt.geojson";
  
  $.ajax(url).done(function(data){
    myGeoJson = JSON.parse(data);
    leafletLayers = L.geoJson(myGeoJson, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      }
    });
    leafletLayers.addTo(map);
  });
  
  var styleMarkers = function(closestPoints) {
    var artIds = _.map(closestPoints, function(point) {
      return point.properties.ArtID;
    })
    _.each(leafletLayers._layers, function(layer, index) {
      if (_.contains(artIds, layer.feature.properties.ArtID)) {
        layer.setStyle({color: 'orange', radius: 25});
      }
      else {
        layer.setStyle({color: 'green', radius: 10});
      }
    })
  }
  
  var getClosestPoints = function(e) {
    var allJson = _.clone(myGeoJson);
    var point = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [e.latlng.lng, e.latlng.lat]
      }
    };
    var closest = [];
    for (var i=1; i < 10; i++) {
      near = turf.nearest(point, allJson);
      closest.push(near);
      allJson = {type: "FeatureCollections", features: _.without(allJson.features, near)};
    }
    return closest;
  }
  
  map.on('mousemove', function(e) {
    var closestPoints = getClosestPoints(e);
    styleMarkers(closestPoints);
  });