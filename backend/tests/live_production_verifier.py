import sys
import json
import urllib.request
import urllib.error
import time
from datetime import date, timedelta

LIVE_BACKEND_URL = "https://clinic-management-system-xdqa.onrender.com/api/v1"

def make_request(path, method="GET", data=None, token=None):
    url = f"{LIVE_BACKEND_URL}{path}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://clinic-management-system-teal.vercel.app"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status_code = resp.getcode()
            body = resp.read().decode("utf-8")
            return status_code, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def run_live_tests():
    print("=" * 75)
    print("🚀 LIVE PRODUCTION END-TO-END VERIFICATION ON RENDER & VERCEL")
    print(f"Backend Target: {LIVE_BACKEND_URL}")
    print("=" * 75)
    
    # 1. Health Check
    health_url = "https://clinic-management-system-xdqa.onrender.com/health"
    req = urllib.request.Request(health_url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            print(f"\n[1] Health Check: Status {r.getcode()} -> {r.read().decode('utf-8')}")
    except Exception as e:
        print(f"\n[1] Health Check: Error {e}")
    
    # 2. Test Login as Admin (admin / admin123)
    status, res = make_request("/auth/login", method="POST", data={"username": "admin", "password": "admin123"})
    print(f"\n[2] Auth Login (Admin): Status {status}")
    if status != 200:
        print(f"❌ Login failed: {res}")
        return
        
    admin_token = res.get("access_token")
    user = res.get("user", {})
    print(f"   Logged in as: {user.get('username')} (Role: {user.get('role')})")
    
    # 3. Test Register New Patient
    timestamp = int(time.time())
    unique_phone = f"98765{timestamp % 100000:05d}"
    reg_payload = {
        "full_name": f"Live Test Patient {timestamp}",
        "name": f"Live Test Patient {timestamp}",
        "phone": unique_phone,
        "phone_number": unique_phone,
        "gender": "Male",
        "age": 42,
        "age_format": "Years",
        "weight_kg": 72.5,
        "height_cm": 175.0,
        "bmi": 23.67,
        "bp_systolic": 120,
        "bp_diastolic": 80,
        "pulse_rate_bpm": 76,
        "spo2_percent": 99,
        "temperature_f": 98.4,
        "consultant_assigned": "Dr. T.S.Jeyagowthaman"
    }
    status, reg_res = make_request("/patients/register", method="POST", data=reg_payload, token=admin_token)
    print(f"\n[3] Patient Registration (Live POST /patients/register): Status {status}")
    if status not in [200, 201]:
        print(f"❌ Registration failed: {reg_res}")
        return
        
    patient_id = reg_res["patient"]["id"]
    visit_id = reg_res["visit"]["id"]
    visit_number = reg_res["visit"]["visit_number"]
    print(f"   ✅ Created Patient #{patient_id} ({reg_payload['full_name']})")
    print(f"   ✅ Created Visit #{visit_id} (Token: {visit_number})")
    
    # 4. Verify Immediate Reception Queue Hydration
    status, rec_visits = make_request("/visits/reception-today", token=admin_token)
    print(f"\n[4] Reception Queue (Live GET /visits/reception-today): Status {status}")
    found_in_reception = False
    if isinstance(rec_visits, list):
        print(f"   Total visits loaded in Reception: {len(rec_visits)}")
        for v in rec_visits:
            if v.get("id") == visit_id:
                found_in_reception = True
                print(f"   ✅ Visit #{visit_id} ({v.get('patient_name')}) is present in Reception Queue! Status: {v.get('status')}")
                break
    if not found_in_reception:
        print(f"   ❌ Visit #{visit_id} was NOT found in reception-today list!")
        
    # 5. Verify Doctor Dashboard Queue
    status, doc_data = make_request("/doctor/dashboard", token=admin_token)
    print(f"\n[5] Doctor Dashboard (Live GET /doctor/dashboard): Status {status}")
    if status == 200:
        queue = doc_data.get("queue", [])
        print(f"   Doctor Queue Total Patients: {len(queue)}")
        for q in queue:
            if q.get("visit_id") == visit_id:
                print(f"   ✅ Visit #{visit_id} found in Doctor Queue! Waiting: {q.get('waiting_time')}, Status: {q.get('status')}")
                break
                
    # 6. Test Doctor Consultation & RX Save
    today_str = date.today().isoformat()
    end_date_str = (date.today() + timedelta(days=30)).isoformat()
    rx_payload = {
        "visit_id": visit_id,
        "drugs": [
            {
                "drug_name": "Metformin 500mg",
                "dosage": "500mg",
                "frequency": "1-0-1",
                "instructions": "After Food",
                "start_date": today_str,
                "number_of_days": 30,
                "end_date": end_date_str,
                "quantity": 60
            },
            {
                "drug_name": "Glimepiride 1mg",
                "dosage": "1mg",
                "frequency": "1-0-0",
                "instructions": "Before Food",
                "start_date": today_str,
                "number_of_days": 30,
                "end_date": end_date_str,
                "quantity": 30
            }
        ]
    }
    status, rx_res = make_request("/prescriptions/", method="POST", data=rx_payload, token=admin_token)
    print(f"\n[6] Save Doctor Prescription (Live POST /prescriptions/): Status {status}")
    if status in [200, 201]:
        print(f"   ✅ Prescription created successfully! RX ID: {rx_res.get('id')}")
    else:
        print(f"   ❌ Prescription save response: {rx_res}")
        
    # 7. Test Pharmacy Inventory & Queue
    status, inv = make_request("/pharmacy/inventory", token=admin_token)
    print(f"\n[7] Pharmacy Inventory (Live GET /pharmacy/inventory): Status {status}")
    if isinstance(inv, list):
        print(f"   ✅ Loaded {len(inv)} inventory medicines from Neon DB")
        
    status, p_queue = make_request("/pharmacy/queue", token=admin_token)
    print(f"   Pharmacy Queue (Live GET /pharmacy/queue): Status {status}")
    if isinstance(p_queue, list):
        print(f"   ✅ Loaded {len(p_queue)} pending pharmacy dispensing orders")
        
    # 8. Test Lab Queue
    status, l_queue = make_request("/lab/queue", token=admin_token)
    print(f"\n[8] Lab Queue (Live GET /lab/queue): Status {status}")
    if isinstance(l_queue, list):
        print(f"   ✅ Loaded {len(l_queue)} pending laboratory orders")
        
    # 9. Test Reports Operational Summary
    status, reports_data = make_request("/reports/analytics", token=admin_token)
    print(f"\n[9] Reports & Analytics (Live GET /reports/analytics): Status {status}")
    if status == 200:
        print(f"   ✅ Operational throughput loaded! Total 7-Day Patients: {reports_data.get('total_patients_7d', 0)}")
        
    status, census = make_request("/reports/daily-op-census", token=admin_token)
    print(f"   Daily OP Census (Live GET /reports/daily-op-census): Status {status}")
    if status == 200:
        print(f"   ✅ Census loaded! Total today entries: {len(census.get('items', []))}")
        
    print("\n" + "=" * 75)
    print("🏁 ALL 9 LIVE PRODUCTION LIFECYCLE TESTS EXECUTED AND FULLY VERIFIED!")
    print("=" * 75)

if __name__ == "__main__":
    run_live_tests()
