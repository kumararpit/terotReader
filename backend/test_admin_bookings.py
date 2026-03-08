import axios
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = "http://localhost:8000"
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

async def test_admin_bookings_endpoint():
    print("\n--- Testing GET /api/bookings Endpoint ---\n")
    
    # 1. Login to get token
    print("1. Logging in as admin...")
    try:
        login_res = axios.post(f"{BACKEND_URL}/api/login", {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json().get("access_token")
        print("   - Login successful.")
    except Exception as e:
        print(f"   - Login failed: {e}")
        return

    # 2. Fetch Bookings
    print("2. Fetching all bookings...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        bookings_res = axios.get(f"{BACKEND_URL}/api/bookings", headers=headers)
        bookings = bookings_res.json()
        print(f"   - Success! Found {len(bookings)} bookings.")
        if len(bookings) > 0:
            print(f"   - Sample Booking ID: {bookings[0].get('booking_id')}")
            print(f"   - Sample Client Name: {bookings[0].get('full_name')}")
    except Exception as e:
        print(f"   - Fetch failed: {e}")

if __name__ == "__main__":
    # Using a simple synchronous test with requests would be easier since uvicorn is likely running
    import requests
    
    def test_sync():
        print("\n--- Testing GET /api/bookings Endpoint (Sync) ---\n")
        
        # 1. Login
        print("1. Logging in as admin...")
        try:
            login_res = requests.post(f"{BACKEND_URL}/api/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            login_res.raise_for_status()
            token = login_res.json().get("access_token")
            print("   - Login successful.")
        except Exception as e:
            print(f"   - Login failed: {e}")
            return

        # 2. Fetch Bookings (Default)
        print("2. Fetching default bookings...")
        try:
            headers = {"Authorization": f"Bearer {token}"}
            bookings_res = requests.get(f"{BACKEND_URL}/api/bookings", headers=headers)
            bookings_res.raise_for_status()
            data = bookings_res.json()
            print(f"   - Success! Total matching: {data.get('total')}")
            print(f"   - Returned on this page: {len(data.get('bookings'))}")
        except Exception as e:
            print(f"   - Fetch failed: {e}")

        # 3. Test Pagination
        print("3. Testing pagination (limit=1)...")
        try:
            res = requests.get(f"{BACKEND_URL}/api/bookings?skip=0&limit=1", headers=headers)
            res.raise_for_status()
            data = res.json()
            print(f"   - Limit 1 returned {len(data['bookings'])} booking.")
        except Exception as e:
            print(f"   - Pagination test failed: {e}")

        # 4. Test Filtering
        print("4. Testing service_type filter (live)...")
        try:
            res = requests.get(f"{BACKEND_URL}/api/bookings?service_type=live", headers=headers)
            res.raise_for_status()
            data = res.json()
            print(f"   - Live readings count: {data['total']}")
        except Exception as e:
            print(f"   - Filter test failed: {e}")

    test_sync()
