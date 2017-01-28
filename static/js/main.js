var URL_ESTIMATIONS = 'http://datos.santander.es/rest/datasets/control_flotas_estimaciones.json';
var URL_STOPS = 'http://datos.santander.es/rest/datasets/paradas_bus.json';
var FIELDS_ESTIMATIONS = '&data=ayto:tiempo1,ayto:tiempo2,ayto:etiqLinea,dc:modified';
var FIELDS_STOPS = '&data=ayto:parada';
var PATH_STOPS_ROUTE = '/json/lineas-bus-secuencia';

var favorites = null;

function main() {
  // Favorites
  favorites = [];

  var storageFavorites = localStorage.getItem('favorites');

  if (storageFavorites !== null) {
    try {
      favorites = JSON.parse(storageFavorites);
    }
    catch (e) {
      console.error('Error parsing favorites data.');
    }
  }

  // Protocol
  if (location.protocol == 'https:') {
    alert('Reddireccionando a HTTP para acceder a las estimaciones...');
    location.replace('http://' + location.host + location.pathname);
    return;
  }

  // Page
  checkPage(true);

  // Back button
  var headerLeft = document.getElementById('header-left');

  headerLeft.onclick = function() {
    ga('send', 'event', 'Header', 'Back_Button');
    history.back();
  };

  // Favorite button
  var favoriteButton = document.getElementById('favorite-button');

  favoriteButton.onclick = function() {
    ga('send', 'event', 'Header', 'Toggle_Favorite_Button');
    toggleFavorite();
  };
}

var QueryString = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    }
    else if (typeof query_string[pair[0]] === 'string') {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
    }
    else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 

  return query_string;
}();

function checkPage(history) {
  if (QueryString.parada && QueryString.linea && QueryString.estimaciones) {
    getEstimations(QueryString.parada, QueryString.linea, false, false);
  }
  else if (QueryString.parada && QueryString.estimaciones) {
    getAllEstimations(QueryString.parada, false);
  }
  else if (QueryString.linea && QueryString.parada && QueryString.ruta) {
    getStopsRoute(QueryString.linea, QueryString.parada, false);
  }
  else {
    createHome(false);
  }
}

window.onpopstate = function(event) {
  if (event.state) {
    console.log('History', event.state);

    if (event.state.stop_id && event.state.line && event.state.estimations) {
      getEstimations(event.state.stop_id, event.state.line, false, false);
    }
    else if (event.state.stop_id && event.state.estimations) {
      getAllEstimations(event.state.stop_id, false);
    }
    else if (event.state.line && event.state.stop_id && event.state.route) {
      getStopsRoute(event.state.line, event.state.stop_id, false);
    }
  }
  else {
    checkPage(false);
  }
};

function updateTitle(title, headerTitle) {
  var backButton = document.getElementById('back-button');
  var headerCenter = document.getElementById('header-center');
  var favoriteButton = document.getElementById('favorite-button');

  document.title = title;

  if (headerTitle === undefined) {
    headerCenter.children[0].innerHTML = title;
  }
  else {
    headerCenter.children[0].innerHTML = headerTitle;
  }
}

function toggleFavorite() {
  var favoriteButton = document.getElementById('favorite-button');
  var stopId = favoriteButton.dataset.stopId;
  var stopName = favoriteButton.dataset.stopName;
  var line = favoriteButton.dataset.line;

  var favorite = checkFavorite(stopId, line);

  if (favorite === null) {
    addFavorite(stopId, stopName, line);
    favoriteButton.style.opacity = 1;
    favoriteButton.setAttribute('title', 'Quitar de favoritos');
  }
  else {
    removeFavorite(stopId, line);
    favoriteButton.style.opacity = 0.6;
    favoriteButton.setAttribute('title', 'Añadir a favoritos');
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function checkFavorite(stopId, line) {
  var favorite = null;

  for (var i = favorites.length - 1; i >= 0; i--) {
    if (favorites[i].stop_id != stopId) {
      continue;
    }

    if (line === undefined && favorites[i].line === undefined) {
      favorite = favorites[i];
    }
    else if (line !== undefined && favorites[i].line !== undefined) {
      if (favorites[i].line == line) {
        favorite = favorites[i];
      }
    }
  }

  return favorite;
}

function addFavorite(stopId, stopName, line) {
  var favorite = {};

  if (line === undefined) {
    favorite.stop_id = stopId;
    favorite.stop_name = stopName;
  }
  else {
    favorite.stop_id = stopId;
    favorite.stop_name = stopName;
    favorite.line = line;
  }

  favorites.push(favorite);
  console.log('Favorite added.');
}

function removeFavorite(stopId, line) {
  var favorite = checkFavorite(stopId, line);
  var index = favorites.indexOf(favorite);

  if (index > -1) {
    favorites.splice(index, 1);
    console.log('Favorite deleted.');
  }
}

function showFavoriteButton(stopId, stopName1, line) {
  var favoriteButton = document.getElementById('favorite-button');
  var stopName = stopName1 || favoriteButton.dataset.stopName;

  var favorite = checkFavorite(stopId, line);

  if (favorite === null) {
    favoriteButton.style.opacity = 0.6;
    favoriteButton.setAttribute('title', 'Añadir a favoritos');
  }
  else {
    favoriteButton.style.opacity = 1;
    favoriteButton.setAttribute('title', 'Quitar de favoritos');
  }

  favoriteButton.setAttribute('data-stop-id', stopId);

  if (stopName === undefined) {
    favoriteButton.removeAttribute('data-stop-name');
  }
  else {
    favoriteButton.setAttribute('data-stop-name', stopName);
  }

  if (line === undefined) {
    favoriteButton.removeAttribute('data-line');
  }
  else {
    favoriteButton.setAttribute('data-line', line);
  }

  favoriteButton.style.display = 'block';
  console.log('Favorite button updated.');
}

function createHome(pageHistory) {
  document.title = 'Estimaciones de TUS';
  document.body.className = 'home';

  if (pageHistory) {
    history.pushState(
      null,
      'Estimaciones de TUS',
      location.pathname
    );

    console.log('History state pushed.');
  }

  ga('set', 'page', location.pathname);
  ga('send', 'pageview');

  var backButton = document.getElementById('back-button');
  backButton.style.display = 'none';

  var headerCenter = document.getElementById('header-center');
  headerCenter.children[0].innerHTML = 'Estimaciones';

  var favoriteButton = document.getElementById('favorite-button');
  favoriteButton.style.display = 'none';

  var content = document.getElementById('content');
  content.className = 'home';
  content.innerHTML = '';

  var mapLink = document.createElement('a');
  mapLink.id = 'map-link';
  mapLink.href = 'https://tus-estimaciones.appspot.com/mapa';
  content.appendChild(mapLink);

  var mapImg = document.createElement('img');
  mapImg.id = 'map-img';
  mapImg.src = '/images/map-min.png';
  mapLink.appendChild(mapImg);

  var mapButton = document.createElement('div');
  mapButton.id = 'map-button';
  mapButton.className = 'long-button';
  mapLink.appendChild(mapButton);

  var mapButtonText = document.createElement('span');
  mapButtonText.innerHTML = 'Mapa de paradas';
  mapButton.appendChild(mapButtonText);

  var askStopButton = document.createElement('div');
  askStopButton.id = 'ask-stop-button';
  askStopButton.className = 'long-button';
  content.appendChild(askStopButton);

  var askStopInput = document.createElement('input');
  askStopInput.setAttribute('type', 'number');
  askStopInput.setAttribute('pattern', "\\d*");
  askStopInput.placeholder = 'Número de parada';
  askStopButton.appendChild(askStopInput);

  askStopInput.onkeypress = function(e) {
    if (e.keyCode == 13) {
      askStopInput.blur();
    }
  };

  askStopInput.onblur = function(e) {
    ga('send', 'event', 'Home', 'Ask_Stop_Button');

    if (askStopInput.value !== '') {
      getAllEstimations(askStopInput.value, true);
    }
  };

  var favoritesDiv = document.createElement('div');
  favoritesDiv.id = 'favorites';
  content.appendChild(favoritesDiv);

  if (favorites.length === 0) {
    var favoriteInformation = document.createElement('div');
    favoriteInformation.id = 'favorite-information';
    favoritesDiv.appendChild(favoriteInformation);

    var favoriteInformationText = document.createElement('div');
    favoriteInformationText.className = 'text';
    favoriteInformationText.innerHTML = 'Usa el corazón en la parte ' +
                                        'superior de la derecha para añadir paradas ' +
                                        'o lineas favoritas.';
    favoriteInformation.appendChild(favoriteInformationText);
  }
  else {
    for (var i = 0; i < favorites.length; i++) {
      var favoriteStopButton = document.createElement('div');
      favoriteStopButton.className = 'long-button';
      favoritesDiv.appendChild(favoriteStopButton);

      var favoriteStopButtonText = document.createElement('span');

      if (favorites[i].line === undefined) {
        favoriteStopButtonText.innerHTML = favorites[i].stop_name;
      }
      else {
        favoriteStopButtonText.innerHTML = favorites[i].stop_name + ': Linea ' + favorites[i].line;
      }

      favoriteStopButton.onclick = (function(j) {
        return function() {
          ga('send', 'event', 'Home', 'Favorite_Button');
          var stopId = favorites[j].stop_id;
          var line = favorites[j].line;

          if (line === undefined) {
            getAllEstimations(stopId, true);
          }
          else {
            getEstimations(stopId, line, true, false);
          }
        };
      })(i);

      favoriteStopButton.appendChild(favoriteStopButtonText);
    }
  }
}

function createLoading(div, text) {
  var loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  div.appendChild(loadingDiv);

  var loadingText = document.createElement('p');
  loadingText.innerHTML = text;
  loadingDiv.appendChild(loadingText);
}

function createError(div, text) {
  var errorDiv = document.createElement('div');
  errorDiv.id = 'error';
  div.appendChild(errorDiv);

  var errorText = document.createElement('p');
  errorText.innerHTML = text;
  errorDiv.appendChild(errorText);
}

function checkTime(array, key) {
  var newArray = array;

  for (var i = 0; i < newArray.length; i++) {
    var item = newArray[i];

    if (item[key] === "" || item[key] == "0") {
      item[key] = "999999999";
    }
  }

  return newArray;
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = parseInt(a[key]); var y = parseInt(b[key]);
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

function createTime(busDiv, seconds, className) {
  var userTime = 'No hay estimación disponible.';

  if (seconds > -1 && seconds < 999999) {
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;

    var userMinutes = null;
    var userSeconds = null;

    if (minutes == 1) {
      userMinutes = minutes + ' minuto';
    }
    else if (minutes > 1) {
      userMinutes = minutes + ' minutos';
    }

    if (seconds == 1) {
      userSeconds = seconds + ' segundo';
    }
    else if (seconds > 1) {
      userSeconds = seconds + ' segundos';
    }

    var time = [userMinutes, userSeconds];

    if (minutes > 0 && seconds > 0) {
      userTime = time.join(' y ');
    }
    else if (minutes > 0) {
      userTime = userMinutes;
    }
    else if (seconds > 0) {
      userTime = userSeconds;
    }
  }

  if (seconds < 1) {
    userTime = 'En parada (aprox.)';
  }

  var timeText = document.createElement('p');
  timeText.className = className;
  timeText.innerHTML = userTime;
  busDiv.appendChild(timeText);
}

function getAllEstimations(stopId, historyPage, error) {
  document.title = 'Parada ' + stopId;
  document.body.className = 'stop-estimations';

  var backButton = document.getElementById('back-button');
  backButton.style.display = 'block';

  var favoriteButton = document.getElementById('favorite-button');
  favoriteButton.style.display = 'none';

  var content = document.getElementById('content');
  content.innerHTML = '';

  if (historyPage) {
    var stateObj = {
      'stop_id': stopId,
      'estimations': true
    };

    history.pushState(
      stateObj, 
      'Parada ' + stopId, 
      location.pathname + '?parada=' + stopId + '&estimaciones=true'
    );

    console.log('History state pushed.');
  }

  ga('set', 'page', location.pathname + '?parada=' + stopId + '&estimaciones=true');
  ga('send', 'pageview');

  if (error) {
    showFavoriteButton(stopId);
  }
  else {
    getStopName(stopId);
  }

  createLoading(content, 'Descargando estimaciones...');

  var query = '?query=ayto%5C:paradaId:' + stopId;
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      content.innerHTML = '';

      var linesDiv = document.createElement('div');
      linesDiv.id = 'lines';
      content.appendChild(linesDiv);

      if (this.status != 200) {
        createError(linesDiv, 'Error al descargar estimaciones.');
        createUserOptions('stop_estimations', stopId, null, true);
        return;
      }

      var data = null;

      try {
        data = JSON.parse(this.responseText);
      }
      catch (e) {
        console.error('Error parsing stops data.');
        createError(linesDiv, 'Error al descargar estimaciones.');
        createUserOptions('stop_estimations', stopId, null, true);
        return;
      }

      if (data === null || !('resources' in data) || data.resources.length === 0) {
        createError(linesDiv, 'Error en la datos de las estimaciones.');
        createUserOptions('stop_estimations', stopId, null, true);
        return;
      }

      var resources = data.resources;

      resources = checkTime(resources, 'ayto:tiempo1');
      resources = sortByKey(resources, 'ayto:tiempo1');

      for (var i = 0; i < resources.length; i++) {
        var item = data.resources[i];

        if (!('ayto:etiqLinea' in item) || 
            !('ayto:tiempo1' in item) ||
            !('ayto:tiempo2' in item) ||
            !('dc:modified' in item)) {
          createError(linesDiv, 'Error en la datos de las estimaciones.');
          createUserOptions('stop_estimations', stopId, null, true);
          continue;
        }

        var line = item['ayto:etiqLinea'];
        var modifiedMilliseconds = Date.now() - Date.parse(item['dc:modified']);
        var modifiedSeconds = parseInt( (modifiedMilliseconds /1000) % 60 );

        var seconds1 = parseInt(item['ayto:tiempo1']) - modifiedSeconds;
        var seconds2 = parseInt(item['ayto:tiempo2']) - modifiedSeconds;

        var lineDiv = document.createElement('div');
        lineDiv.className = 'line';
        linesDiv.appendChild(lineDiv);

        lineDiv.onclick = (function(j) {
          return function(){
            ga('send', 'event', 'Bus_Stop', 'Line_Estimations');

            var line = resources[j]['ayto:etiqLinea'];
            getEstimations(stopId, line, true, false);
          };
        })(i);

        var lineText = document.createElement('p');
        lineText.innerHTML = 'Linea ' + line;
        lineDiv.appendChild(lineText);

        createTime(lineDiv, seconds1, 'time1');
        createTime(lineDiv, seconds2, 'time2');
      }

      createSource();
    }
  };

  xhttp.open('GET', URL_ESTIMATIONS + query + FIELDS_ESTIMATIONS, true);
  xhttp.send();
}

function getEstimations(stopId, line, historyPage, refresh) {
  document.title = 'Linea ' + line;
  document.body.className = 'line-estimations';

  var backButton = document.getElementById('back-button');
  backButton.style.display = 'block';

  var favoriteButton = document.getElementById('favorite-button');
  favoriteButton.style.display = 'none';

  var content = document.getElementById('content');
  content.innerHTML = '';

  if (historyPage) {
    var stateObj = {
      'line': line, 
      'stop_id': stopId,
      'estimations': true
    };

    history.pushState(
      stateObj,
      'Linea ' + line,
      location.pathname + '?parada=' + stopId + '&linea=' + line + '&estimaciones=true'
    );

    console.log('History state pushed.');
  }

  ga('set', 'page', location.pathname + '?parada=' + stopId + '&linea=' + line + '&estimaciones=true');
  ga('send', 'pageview');

  if (refresh) {
    showFavoriteButton(stopId, undefined, line);
  }
  else {
    getStopName(stopId, line);
  }

  createLoading(content, 'Descargando estimaciones...');

  var query = '?query=ayto%5C:paradaId:' + stopId + ' AND ayto%5C:etiqLinea:' + line;
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      content.innerHTML = '';

      var linesDiv = document.createElement('div');
      linesDiv.id = 'lines';
      content.appendChild(linesDiv);

      if (this.status != 200) {
        createError(linesDiv, 'Error al descargar estimaciones.');
        createUserOptions('line_estimations', stopId, line, true);
        return;
      }

      var data = null;

      try {
        data = JSON.parse(this.responseText);
      }
      catch (e) {
        console.error('Error parsing stops data.');
        createError(linesDiv, 'Error en la datos de las estimaciones.');
        createUserOptions('line_estimations', stopId, line, true);
        return;
      }

      if (data === null || !('resources' in data) || data.resources.length === 0) {
        createError(linesDiv, 'Error en la datos de las estimaciones.');
        createUserOptions('line_estimations', stopId, line, true);
        return;
      }

      var resources = data.resources;
      var item = resources[0];

      if (!('ayto:etiqLinea' in item) || 
          !('ayto:tiempo1' in item) ||
          !('ayto:tiempo2' in item) ||
          !('dc:modified' in item)) {
        createError(linesDiv, 'Error en la datos de las estimaciones.');
        createUserOptions('line_estimations', stopId, line, true);
        return;
      }

      var lineLabel = item['ayto:etiqLinea'];
      var modifiedMilliseconds = Date.now() - Date.parse(item['dc:modified']);
      var modifiedSeconds = parseInt( (modifiedMilliseconds /1000) % 60 );

      var seconds1 = parseInt(item['ayto:tiempo1']) - modifiedSeconds;
      var seconds2 = parseInt(item['ayto:tiempo2']) - modifiedSeconds;

      var lineDiv = document.createElement('div');
      lineDiv.className = 'line';
      linesDiv.appendChild(lineDiv);

      var lineText = document.createElement('p');
      lineText.innerHTML = 'Linea ' + line;
      lineDiv.appendChild(lineText);

      createTime(lineDiv, seconds1, 'time1');
      createTime(lineDiv, seconds2, 'time2');
      createUserOptions('line_estimations', stopId, line, false);

      createSource();
    }
  };

  xhttp.open('GET', URL_ESTIMATIONS + query + FIELDS_ESTIMATIONS, true);
  xhttp.send();
}

function createUserOptions(context, stopId, line, error) {
  var content = document.getElementById('content');

  var busButtonsDiv = document.createElement('div');
  busButtonsDiv.id = 'bus-buttons';
  content.appendChild(busButtonsDiv);

  if (context == 'line_estimations' || context == 'stops_route') {
    var stopsRouteButton = document.createElement('div');
    stopsRouteButton.className = 'long-button';
    busButtonsDiv.appendChild(stopsRouteButton);

    stopsRouteButton.onclick = function() {
      ga('send', 'event', 'Bus_Line', 'Stops_Route_Button');
      getStopsRoute(line, stopId, true);
    };

    var stopsRouteButtonText = document.createElement('span');

    if (context == 'stops_route' && error) {
      stopsRouteButtonText.innerHTML = 'Refrescar';
    }
    else {
      stopsRouteButtonText.innerHTML = 'Ruta de paradas';
    }

    stopsRouteButton.appendChild(stopsRouteButtonText);
  }
  
  if (context == 'stop_estimations' || context == 'line_estimations') {
    var refreshButton = document.createElement('div');
    refreshButton.className = 'long-button';
    busButtonsDiv.appendChild(refreshButton);

    refreshButton.onclick = function() {
      if (line === null) {
        ga('send', 'event', 'Bus_Line', 'Refresh_Stop_Estimations_Button');
        getAllEstimations(stopId, false, !error);
      }
      else {
        ga('send', 'event', 'Bus_Line', 'Refresh_Line_Estimations_Button');
        getEstimations(stopId, line, false, !error);
      }
    };

    var refreshButtonText = document.createElement('span');
    refreshButtonText.innerHTML = 'Refrescar';
    refreshButton.appendChild(refreshButtonText);
  }
}

function getStopsRoute(line, stopId, historyPage) {
  document.title = 'Linea ' + line;
  document.body.className = 'stops-route';

  var backButton = document.getElementById('back-button');
  backButton.style.display = 'block';

  var favoriteButton = document.getElementById('favorite-button');
  favoriteButton.style.display = 'none';

  updateTitle('Ruta de la Linea ' + line, 'Linea ' + line);

  var content = document.getElementById('content');
  content.innerHTML = '';

  if (historyPage) {
    var stateObj = {
      'line': line,
      'stop_id': stopId,
      'route': true
    };

    history.pushState(
      stateObj, 
      'Linea ' + line,
      location.pathname + '?linea=' + line + '&parada=' + stopId + '&ruta=true'
    );

    console.log('History state pushed.');
  }

  ga('set', 'page', location.pathname + '?linea=' + line + '&parada=' + stopId + '&ruta=true');
  ga('send', 'pageview');

  createLoading(content, 'Descargando secuencia de rutas...');

  var query = '?line=' + line + '&stop_id=' + stopId;
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      content.innerHTML = '';

      var stopsDiv = document.createElement('div');
      stopsDiv.id = 'stops';
      content.appendChild(stopsDiv);

      if (this.status != 200) {
        createError(stopsDiv, 'Error al descargar la secuencia de paradas.');
        createUserOptions('stops_route', stopId, line, true);
        return;
      }

      var stops = null;

      try {
        stops = JSON.parse(this.responseText);
      }
      catch (e) {
        createError(stopsDiv, 'Error al descargar la secuencia de paradas.');
        createUserOptions('stops_route', stopId, line, true);
        return;
      }

      if (!Array.isArray(stops)) {
        createError(stopsDiv, 'Error al descargar la secuencia de paradas.');
        createUserOptions('stops_route', stopId, line, true);
        return;
      }

      for (var i = 0; i < stops.length; i++) {
        var stop = stops[i];

        var stopDiv = document.createElement('div');
        stopDiv.className = 'stop';
        stopsDiv.appendChild(stopDiv);

        var stopText = document.createElement('p');
        stopText.innerHTML = stop;
        stopDiv.appendChild(stopText);
      }

      createSource();
    }
  };

  xhttp.open('GET', PATH_STOPS_ROUTE + query, true);
  xhttp.send();
}

function getStopName(stopId, line) {
  var backButton = document.getElementById('back-button');
  var headerCenter = document.getElementById('header-center');

  var stopName = 'Descargando...';
  updateTitle(stopName);

  var query = '?query=ayto%5C:numero:' + stopId;
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status != 200) {
        stopName = 'Parada desconocida';
        updateTitle(stopName);
        return;
      }

      var stopNameParsed = false;
      var data = null;

      try {
        data = JSON.parse(this.responseText);
      }
      catch (e) {
        console.error('Error parsing stop name data.');
      }

      if (data === null || !('resources' in data) || data.resources.length === 0) {
        stopName = 'Parada desconocida';
        updateTitle(stopName);
      }
      else {
        var item = data.resources[0];

        if (('ayto:parada' in item)) {
          stopName = item['ayto:parada'];
          stopNameParsed = true;

          updateTitle(stopName);
        }
        else {
          stopName = 'Parada desconocida';
          updateTitle(stopName);
        }
      }

      console.log('Stop name updated.');

      if (stopNameParsed === false) {
        return;
      }

      showFavoriteButton(stopId, stopName, line);
    }
  };

  xhttp.open('GET', URL_STOPS + query + FIELDS_STOPS, true);
  xhttp.send();
}

function createSource() {
  var content = document.getElementById('content');

  var divSource = document.createElement('div');
  divSource.id = 'source';
  content.appendChild(divSource);

  var pSource = document.createElement('p');
  pSource.innerHTML = 'Fuente de los datos: <a href="http://datos.santander.es">Ayuntamiento de Santander</a>.';
  divSource.appendChild(pSource);
}

// Go!
main();