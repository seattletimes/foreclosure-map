// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");

var $ = require("./lib/qsa");
var xhr = require("./lib/xhr");
var { components, rgb, palette } = require("./lib/colors");

var mapElement = $.one("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;

var lerp = function(a, b, d) {
  var out = [];
  for (var i = 0; i < a.length; i++) {
    out[i] = (b[i] - a[i]) * d + a[i];
  }
  return out;
};

var low = components.stDarkBlue;
var high = lerp(components.stDarkBlue, [0, 0, 0], .9);

var colorize = function(scaling) {
  return rgb.apply(null, lerp(low, high, scaling));
};

var gradient = function(scale) {
  return `hsl(${280 + scale * 80}, ${scale * 30 + 20}%, ${scale * 30 + 20}%)`;
};

var commafy = function(n) {
  return n.toLocaleString().replace(/\.0+$/, "");
};

xhr("./assets/shapefile.geojson", function(err, data) {
  var maxRate = 0;
  data.features.forEach(function(feature) {
    var fc = feature.properties.fc_2014;
    var units = feature.properties.units_2014;
    var total = 0;
    for (var i = 2008; i <= 2014; i++) {
      total += (feature.properties["fc_" + i] || 0);
    }
    feature.properties.total = total;
    if (fc && units) {
      feature.properties.rate = fc / units;
      if (feature.properties.rate > maxRate) maxRate = feature.properties.rate;
    }
  })
  var geojson = L.geoJSON(data, {
    style: function(feature) {
      var { properties } = feature;
      var { rate } = properties;
      var scaled = rate ? rate / maxRate : 0;
      var color = properties.fc_2014 ? colorize(scaled) : "transparent";
      return {
        weight: 1,
        color: palette.dfDarkGray,
        fillColor: color,
        fillOpacity: .6
      };
    },
    onEachFeature: function(feature, layer) {
      var { properties } = feature;

      var getYear = y => properties["fc_" + y] ? `
      <tr>
        <td class="year">${y}</td>
        <td>${commafy(properties["fc_" + y])}</td>
      </tr>` : "";
      
      if (properties.fc_2014) layer.bindPopup(`
<h1>${properties.zip} - ${properties.city}</h1>
<div class="row">
  <div class="latest cell">
    <h2>2014</h2>
    <div class="rate">${(properties.fc_2014 / properties.units_2014 * 100).toFixed(2)}%</div>
    <div class="fc"><b>${commafy(properties.fc_2014)}</b> properties foreclosed</div>
    <div class="total"><b>${commafy(properties.units_2014)}</b> housing units</div>
  </div>
  <div class="table cell">
    <h2>Previous years</h2>
    <table>
      <thead>
        <tr>
          <th class="year">Year
          <th>Foreclosures
      <tbody>
        ${getYear(2013)}
        ${getYear(2012)}
        ${getYear(2011)}
        ${getYear(2010)}
        ${getYear(2009)}
        ${getYear(2008)}
        <tr class="total">
          <td>2008-2014
          <td>${commafy(properties.total)}
    </table>
  </div>
</div>
      `);
    }
  });

  geojson.addTo(map);
  map.fitBounds(geojson.getBounds());
});