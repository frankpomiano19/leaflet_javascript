var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }),
            map = new L.Map('map', { center: new L.LatLng(-12.04318, -77.02824), zoom: 13 }),
            drawnItems = L.featureGroup().addTo(map);
    L.control.layers({
        'osm': osm.addTo(map),
    }, { 'drawlayer': drawnItems }, { position: 'topleft', collapsed: false }).addTo(map);
    map.addControl(new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            poly: {
                allowIntersection: false
            }
        },
        draw: {
            polygon: {
                allowIntersection: false,
                showArea: true
            }
        }
    }));

    map.on(L.Draw.Event.CREATED, function (event) {
        var layer = event.layer;

        drawnItems.addLayer(layer);
    });



document.getElementById('select-location').addEventListener('change', function (e)
{
    let coords = e.target.value.split(",");
    map.flyTo(coords, 13);
})

//Agregar mapa base
var carto_light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '©OpenStreetMap, ©CartoDB', subdomains: 'abcd', maxZoom: 24 });

//Agregar el plugin MiniMap
var minimap = new L.Control.MiniMap(carto_light,
    {
        toggleDisplay: true,
        minimized: false,
        position: "bottomleft"
    }).addTo(map);

//Agregar escala
new L.control.scale({ imperial: false }).addTo(map);

//Agregar el raster - en este caso la universidad
var url_to_geotiff_file = "universidad.tif";

fetch(url_to_geotiff_file)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer =>
    {
        parseGeoraster(arrayBuffer).then(georaster =>
        {
            console.log("georaster:", georaster);

            /*
                GeoRasterLayer is an extension of GridLayer,
                which means can use GridLayer options like opacity.
                Just make sure to include the georaster option!
                http://leafletjs.com/reference-1.2.0.html#gridlayer
            */
            var layer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.8,
                resolution: 256
            });
            layer.addTo(map);
            map.fitBounds(layer.getBounds());

        });
    });

// Truncate value based on number of decimals
var _round = function (num, len)
{
    return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};
// Helper method to format LatLng object (x.xxxxxx, y.yyyyyy)
var strLatLng = function (latlng)
{
    return "(" + _round(latlng.lat, 6) + ", " + _round(latlng.lng, 6) + ")";
};




// Generate popup content based on layer type
        // - Returns HTML string, or null if unknown object
        var getPopupContent = function (layer)
        {
            // Marker - add lat/long
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker)
            {
                return strLatLng(layer.getLatLng());
                // Circle - lat/long, radius
            } else if (layer instanceof L.Circle)
            {
                var center = layer.getLatLng(),
                    radius = layer.getRadius();
                return "Center: " + strLatLng(center) + "<br />"
                    + "Radius: " + _round(radius, 2) + " m";
                // Rectangle/Polygon - area
            } else if (layer instanceof L.Polygon)
            {
                var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                    perimeter = 0,
                    area = L.GeometryUtil.geodesicArea(latlngs);
                    for (var i = 0; i < latlngs.length - 1; i++)
                    {
                        perimeter += latlngs[i].distanceTo(latlngs[i + 1]);
                    }
                    perimeter += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
                return "Area: " + L.GeometryUtil.readableArea(area, true)+ "<br />"
                    +"Perimetro:" + _round(perimeter, 2)+" m";
                // Polyline - distance
            } else if (layer instanceof L.Polyline)
            {
                var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
                    distance = 0;
                if (latlngs.length < 2)
                {
                    return "Distance: N/A";
                } else
                {
                    for (var i = 0; i < latlngs.length - 1; i++)
                    {
                        distance += latlngs[i].distanceTo(latlngs[i + 1]);
                    }
                    return "Distance: " + _round(distance, 2) + " m";
                }
            }
            return null;
        };

        // Object created - bind popup to layer, add to feature group
        map.on(L.Draw.Event.CREATED, function (event)
        {
            var layer = event.layer;
            var content = getPopupContent(layer);
            if (content !== null)
            {
                layer.bindPopup(content);
            }
            drawnItems.addLayer(layer);
        });

        // Object(s) edited - update popups
        map.on(L.Draw.Event.EDITED, function (event)
        {
            var layers = event.layers,
                content = null;
            layers.eachLayer(function (layer)
            {
                content = getPopupContent(layer);
                if (content !== null)
                {
                    layer.setPopupContent(content);
                }
            });
        });