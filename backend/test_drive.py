import re
import requests
import sys

def test_drive(url):
    file_id_match = re.search(r'/d/([^/]+)', url) or re.search(r'id=([^&]+)', url)
    if not file_id_match:
        print("No ID found")
        return
    file_id = file_id_match.group(1)
    
    # Try as normal file
    url1 = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
    print(f"Trying general file: {url1}")
    r1 = requests.get(url1, allow_redirects=True)
    print(r1.status_code, r1.headers.get('Content-Type'))
    
    # Try as google sheet
    url2 = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
    print(f"Trying sheet: {url2}")
    r2 = requests.get(url2, allow_redirects=True)
    print(r2.status_code, r2.headers.get('Content-Type'))

if __name__ == '__main__':
    test_drive(sys.argv[1])
