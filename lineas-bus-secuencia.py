import os
import json
import logging
import webapp2

class MainPage(webapp2.RequestHandler):
  def bad_request(self):
    error = {
      "error": "Bad Request"
    }

    json_data = json.dumps(error)
    self.response.headers['Content-Type'] = 'application/json'
    self.response.write(json_data)

  def get(self):
    line = self.request.get('line')
    stop_id = int(self.request.get('stop_id'))

    if line is None or stop_id is None:
      self.bad_request();
      return

    path = os.path.join(os.path.split(__file__)[0], 'static/json/lineas-bus-secuencia.min.json')
    content = open(path).readlines()[0]

    data = json.loads(content)
    search_id = None

    for item in data:
      if item[0] == stop_id and item[1] == line:
        full_search_id = item[3]

        logging.debug('Parada: ' + item[2])

        full_search_id = full_search_id.split('-')

        search_id = full_search_id[0] + '-' + full_search_id[1] + '-'
        search_id += full_search_id[2] + '-' + full_search_id[3] + '-'
        search_id += full_search_id[4]

    stops = []

    for item in data:
      try:
        item[3].index(search_id)
        stops.append(item[2])
      except:
        pass

    json_data = json.dumps(stops, separators=(',', ':'))

    self.response.headers['Content-Type'] = 'application/json'
    self.response.write(json_data)

app = webapp2.WSGIApplication([
    ('/json/lineas-bus-secuencia', MainPage),
], debug=True)