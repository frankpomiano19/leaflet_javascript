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

   

var temp;

document.getElementById('ubicacion').addEventListener('change', function (e)
{
    let coords = e.target.value.split(",");
    map.flyTo(coords, 18);
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

//Agregar el raster dentro de una función

function mostrarRaster(url_to_geotiff_file) {
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
            console.log("layer:", layer);
            console.log(layer.getBounds());
            //layer.getBounds() devuelve los lìmites de la imagen TIFF
            insertarUbicacion(layer.getBounds());
            layer.addTo(map);
            map.fitBounds(layer.getBounds());
        });
    });
}

mostrarRaster("universidad.tif");
mostrarRaster("corte.tif");
mostrarRaster("odm_orthophoto.tif");
//mostrarRaster("LOTE BUEY - NIR - 21 SEP.tif");
//mostrarRaster("rios_1700_zonaB1.zip");

var i = 1;
var url ="poly1.json";

var stateLayer = L.geoJson(null, {onEachFeature: forEachFeature,style:style});

$.getJSON(url, function(data) {
    stateLayer.addData(data);
});


function insertarUbicacion(limites) {
    var selector = document.getElementById('ubicacion');
    var option = document.createElement('option');
    var latitudprom = (Object.entries(limites)[0][1]['lat'] + Object.entries(limites)[1][1]['lat'])/2;
    var longitudprom = (Object.entries(limites)[0][1]['lng'] + Object.entries(limites)[1][1]['lng'])/2;
    option.value = latitudprom+ ","+longitudprom;
    option.innerHTML = "ubic_"+i;
    i++;
    selector.appendChild(option);
}



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
            if (layer instanceof L.Marker)
            {
                return strLatLng(layer.getLatLng());
                // Circle - lat/long, radius
            } else if (layer instanceof L.Circle || layer instanceof L.CircleMarker)
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
                    return "Distancia: N/A";
                } else
                {
                    for (var i = 0; i < latlngs.length - 1; i++)
                    {
                        distance += latlngs[i].distanceTo(latlngs[i + 1]);
                    }
                    return "Distancia: " + _round(distance, 2) + " m";
                }
            }
            return null;
        };

        // Object created - bind popup to layer, add to feature group
        map.on(L.Draw.Event.CREATED, function (event)
        {
            //var type = event.layerType;
            var layer = event.layer;
            var content = getPopupContent(layer);
            if (content !== null)
            {
                layer.bindPopup(content);
            }
            drawnItems.addLayer(layer);
            var geojson = drawnItems.toGeoJSON();
            console.log(JSON.stringify(geojson));
            console.log(geojson);
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




        function forEachFeature(feature, layer) {
            var content = getPopupContent(layer);

            if (content !== null)
            {
                layer.bindPopup(content);
            }

            drawnItems.addLayer(layer); 
     }


     function style(feature) {
        return {
            fillColor: 'green', 
            fillOpacity: 0.5,  
            weight: 2,
            opacity: 1,
            color: '#ffffff',
            dashArray: '3'
        };
    }
        var highlight = {
            'fillColor': 'yellow',
            'weight': 2,
            'opacity': 1
        };