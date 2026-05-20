import urllib.request
import json
req = urllib.request.Request('http://127.0.0.1:8000/inventory/products/bulk?update_existing=true', method='POST', data=json.dumps([{'sku': 'test1', 'name': 'test prod'}]).encode(), headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode())
