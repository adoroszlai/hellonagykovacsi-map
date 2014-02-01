var map_center = [ 47.578, 18.885 ];
var clusterByDefault = true;
var on_route_threshold = 30; // meters
var icons = {}
var page = page_name();

function page_name() {
	var path = window.location.pathname;
	var lastSlash = path.lastIndexOf('/');
	var page = '';
	if (lastSlash > 0) {
		page = path.substr(lastSlash+1);
	}
	return page;
}

function create_marker(itemDef, color) {
	var iconName = itemDef.icon || "marker";
	var icon = icons[iconName];
	var selected = itemDef.id !== undefined && itemDef.id === page;
	if (icon === undefined) {
		var size = selected ? "l" : "s";
		icon = L.MakiMarkers.icon({ icon: iconName, color: color, size: size });
		if (!selected) {
			icons[iconName] = icon;
		}
	}
	var marker = L.marker(L.latLng(itemDef.lat, itemDef.lng), { icon: icon, title: itemDef.name });
	marker.bindPopup(itemDef.name);
	return marker;
}

function load_pois(map) {
	var pois = new L.featureGroup();
	var overlays = {};
	var page = page_name();

	for (var l = 0; l < layerDefs.length; l++) {
		var layerDef = layerDefs[l];
		var cluster = layerDef.cluster === true || (layerDef.cluster === undefined && clusterByDefault);
		var layer = cluster ? new L.MarkerClusterGroup({showCoverageOnHover: false, disableClusteringAtZoom: 15}) : new L.FeatureGroup();
		pois.addLayer(layer);
		overlays[layerDef['name']] = layer;

		for (var i = 0; i < layerDef.items.length; i++) {
			var marker = create_marker(layerDef.items[i], layerDef.color);
			layer.addLayer(marker);
		}
	}

	L.control.layers({}, overlays).addTo(map);

	map.addLayer(pois);
}

function get_pois(map) {
	var markers = new Array();

	for (var l = 0; l < layerDefs.length; l++) {
		var layerDef = layerDefs[l];
		for (var i = 0; i < layerDef.items.length; i++) {
			var marker = create_marker(layerDef.items[i], layerDef.color);
			markers.push(marker);
		}
	}

	return markers;
}

function init_street_map() {
	var map = L.map('map', { center: map_center, zoom: 13 });
	var tileLayer = new L.OSM.Mapnik();
	tileLayer.addTo(map);

	load_pois(map);
}

function init_hiking_map() {
	var map = L.map('map', { center: map_center, zoom: 12 });
	var tileLayer = new L.OSM.CycleMap();
	tileLayer.addTo(map);

	var hiking = L.tileLayer('http://www.openstreetmap.hu/tt/{z}/{x}/{y}.png', { maxZoom: 16 });
	hiking.addTo(map);

	load_pois(map);
}

function init_route_map() {
	var page = page_name();
	if (page === 'utvonal.html') {
		page = '123';
	}
	_init_route_map(page + ".gpx");
}

function _init_route_map(route_name) {
	var map_center = [ 47.5838, 18.8737 ];
	var map = L.map('map', { center: map_center, zoom: 14 });
	var tileLayer = new L.OSM.CycleMap();
	tileLayer.addTo(map);

	var elevation = L.control.elevation({width:500});

	$.get("routes/" + route_name, function(data) {
		var route = new L.GPX(data, {
			async: true,
			marker_options: {
				startIconUrl: 'lib/leaflet-gpx/pin-icon-start.png',
				endIconUrl: 'lib/leaflet-gpx/pin-icon-end.png',
				shadowUrl: 'lib/leaflet-gpx/pin-shadow.png'
			}
		});
		route.on('addline', function(e) {
			elevation.addData(e.line);

			var markers = get_pois(map);
			for (var i = 0; i < markers.length; ++i) {
				var marker = markers[i];
				var closest = L.GeometryUtil.closest(map, e.line, marker.getLatLng());
				var dist = marker.getLatLng().distanceTo(new L.LatLng(closest.lat, closest.lng));
				if (dist < on_route_threshold) {
					map.addLayer(marker);
				}
			}
		});
		map.addLayer(route);
		elevation.addTo(map);
	});
}
