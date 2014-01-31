var map_center = [ 47.578, 18.885 ];
var clusterByDefault = true;

function load_pois(map) {
	var path = window.location.pathname;
	var lastSlash = path.lastIndexOf('/');
	var page = '';
	if (lastSlash > 0) {
		page = path.substr(lastSlash+1);
	}

	var pois = new L.featureGroup();

	var overlays = {};
	var icons = {}

	for (var l = 0; l < layerDefs.length; l++) {
		var layerDef = layerDefs[l];
		var cluster = layerDef.cluster === true || (layerDef.cluster === undefined && clusterByDefault);
		var layer = cluster ? new L.MarkerClusterGroup({showCoverageOnHover: false, disableClusteringAtZoom: 15}) : new L.FeatureGroup();
		pois.addLayer(layer);
		overlays[layerDef['name']] = layer;

		for (var i = 0; i < layerDef.items.length; i++) {
			var itemDef = layerDef.items[i];
			var iconName = itemDef.icon || "marker";
			var icon = icons[iconName];
			var selected = itemDef.id !== undefined && itemDef.id === page;
			if (icon === undefined) {
				var size = selected ? "l" : "s";
				icon = L.MakiMarkers.icon({ icon: iconName, color: layerDef.color, size: size });
				if (!selected) {
					icons[iconName] = icon;
				}
			}
			var marker = L.marker(L.latLng(itemDef.lat, itemDef.lng), { icon: icon });
			marker.bindPopup(itemDef.name);
			layer.addLayer(marker);
		}
	}

	L.control.layers({}, overlays).addTo(map);

	map.addLayer(pois);
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
