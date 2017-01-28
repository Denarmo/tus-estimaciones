import json
from pprint import pprint

with open('paradas_bus.json') as data_file:    
  data = json.load(data_file)

resources = data
new_data = []

for item in resources:
  new_item = []
  new_item.append(int(item['ayto:numero']))
  new_item.append(float(item['wgs84_pos:lat']))
  new_item.append(float(item['wgs84_pos:long']))
  new_item.append(item['ayto:parada'])

  new_data.append(new_item)

new_data = json.dumps(new_data)

file = open('paradas-bus.json', 'w')
file.write(new_data)
file.close()
