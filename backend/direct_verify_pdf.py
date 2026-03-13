import os
import sys
from pathlib import Path

# Add services to path
sys.path.append(os.getcwd())

from services.pdf_service import generate_invoice_pdf_v2, generate_booking_details_pdf_v2
from services.template_selector import get_template_for_service

# Constants from server.py (mocked)
GENERATED_PDFS_DIR = os.path.join(os.getcwd(), "test_generated_pdfs")
os.makedirs(GENERATED_PDFS_DIR, exist_ok=True)

booking_data = {
    "booking_id": "DIRECT_TEST_123",
    "full_name": "Direct Test User",
    "email": "direct@example.com",
    "service_type": "delivered-3",
    "preferred_date": "2026-03-20",
    "preferred_time": "10:00",
    "amount": 22.0,
    "currency": "EUR"
}

def test_logic():
    print("Testing PDF generation logic...")
    
    # 1. Test generate_invoice_pdf_v2 with output_dir
    invoice_path = generate_invoice_pdf_v2(booking_data, output_dir=GENERATED_PDFS_DIR)
    print(f"Generated Invoice Path: {invoice_path}")
    
    if not invoice_path.startswith(GENERATED_PDFS_DIR):
        print(f"FAILED: Invoice path {invoice_path} is not in {GENERATED_PDFS_DIR}")
        return
    
    if not os.path.exists(invoice_path):
        print("FAILED: Invoice file does not exist")
        return
    
    print("Invoice generation success.")
    
    # 2. Test path security logic from server.py
    abs_path = os.path.abspath(invoice_path)
    base_gen_path = os.path.abspath(GENERATED_PDFS_DIR)
    
    if abs_path.startswith(base_gen_path):
        print("Path security check: PASSED (Path is within allowed directory)")
    else:
        print("Path security check: FAILED")
        return
        
    # 3. Test cleanup
    os.remove(invoice_path)
    if not os.path.exists(invoice_path):
        print("Cleanup check: PASSED (File deleted)")
    else:
        print("Cleanup check: FAILED")
        return

    print("\nALL DIRECT LOGIC TESTS PASSED")

if __name__ == "__main__":
    test_logic()
