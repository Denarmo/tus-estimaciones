import json
from pprint import pprint

with open('lineas_bus_secuencia.json') as data_file:    
  data = json.load(data_file)

resources = data['resources']
new_data = []

for item in resources:
  new_item = []
  new_item.append(int(item['ayto:NParada']))
  new_item.append(item['dc:EtiquetaLinea'])
  new_item.append(item['ayto:NombreParada'])
  new_item.append(item['dc:identifier'])

  new_data.append(new_item)

new_data = json.dumps(new_data)

file = open('lineas-bus-secuencia.json', 'w')
file.write(new_data)
file.close()
