var STOPS_PATH = '/json/paradas-bus.min.json';
var map = null;

function main() {
  // Protocol
  if (location.protocol == 'http:') {
    alert('Reddireccionando a HTTPS para acceder al mapa...');
    location.replace('https://' + location.host + location.pathname);
    return;
  }

  // Map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 43.462068, lng: -3.810204},
    zoom: 17
  });

  // Location & data
  setLocation();
  downloadStops();
}

function setLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log('Latitude', position.coords.latitude);
      console.log('Longitude', position.coords.longitude);

      var coordinates = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );

      map.setCenter(coordinates);
    }, function() {
      alert('Error de geolocalización. Verifique que su localización esté activada para usar esta función.');
    });
  } else {
    alert('Error de geolocalización. Verifique que su localización esté activada para usar esta función.');
  }
}

function downloadStops() {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status != 200) {
        alert('Error descargando los datos de paradas.');
        return;
      }

      var stops = null;

      try {
        stops = JSON.parse(this.responseText);
      }
      catch (e) {
        alert('Error descargando los datos de paradas.');
        return;
      }

      if (!Array.isArray(stops)) {
        alert('Error descargando los datos de paradas.');
        return;
      }

      for (var i = 0; i < stops.length; i++) {
        var stop = stops[i];

        if (stop.length !== 4) {
          console.error('Invalid data length.');
          continue;
        }

        var marker = new google.maps.Marker({
          position: {
            lat: stop[1], 
            lng: stop[2],
          },
          map: map,
          title: stop[3],
          icon: '/images/marker-min.png',
          stopId: stop[0],
          stopName: stop[3]
        });

        var infowindow = new google.maps.InfoWindow();

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
         return function() {
            infowindow.setContent(
              '<div class="marker-link"><a href="http://' + location.host + '/?parada=' + marker.stopId + '&estimaciones=true">' +
               marker.stopName + '</a></div>');
            infowindow.open(map, marker);
          };
        })(marker, i));
      }
    }
  };

  xhttp.open('GET', 'https://' + location.host + STOPS_PATH, true);
  xhttp.send();
}

google.maps.event.addDomListener(window, 'load', main);