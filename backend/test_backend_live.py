import urllib.request
import urllib.error

print("Testing backend at http://127.0.0.1:8000/ ...")
try:
    req = urllib.request.Request("http://127.0.0.1:8000/")
    req.add_header('User-Agent', 'PythonTest/1.0')
    import socket
    socket.setdefaulttimeout(5)
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"STATUS: {response.status}")
        print(f"BODY: {response.read(300)}")
except urllib.error.URLError as e:
    print(f"URLError: {e.reason}")
    print("Backend NOT responding to port 8000")
except TimeoutError:
    print("TIMEOUT - backend hung / event loop blocked")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
