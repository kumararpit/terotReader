import os
import resend
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email_test")

RESEND_API = os.getenv("RESEND_API")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
SENDER_EMAIL = "noreply@tejashvinibdivinedecode.com"

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def test_resend():
    print("\n--- Testing Resend ---")
    if not RESEND_API:
        print("FAIL: RESEND_API not set")
        return
    
    resend.api_key = RESEND_API
    try:
        params = {
            "from": f"Test <{SENDER_EMAIL}>",
            "to": ADMIN_EMAIL,
            "subject": "Resend Test",
            "html": "<strong>Testing Resend API</strong>"
        }
        print(f"Attempting to send from {SENDER_EMAIL} to {ADMIN_EMAIL}...")
        r = resend.Emails.send(params)
        print(f"SUCCESS: Resend ID: {r.get('id')}")
    except Exception as e:
        print(f"FAIL: Resend error: {e}")
        print("HINT: If domain is not verified, use 'onboarding@resend.dev' or verify the domain.")

def test_smtp():
    print("\n--- Testing SMTP ---")
    if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
        print("FAIL: SMTP settings missing in .env")
        return
    
    port = int(SMTP_PORT)
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = "SMTP Test"
        msg.attach(MIMEText("Testing SMTP via Gmail", 'plain'))
        
        print(f"Attempting SMTP login to {SMTP_HOST}:{port} as {SMTP_USER}...")
        server = smtplib.SMTP(SMTP_HOST, port)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, [ADMIN_EMAIL], msg.as_string())
        server.quit()
        print("SUCCESS: SMTP email sent!")
    except Exception as e:
        print(f"FAIL: SMTP error: {e}")

if __name__ == "__main__":
    if not ADMIN_EMAIL:
        print("ERROR: ADMIN_EMAIL not set in .env. Cannot run tests.")
    else:
        test_resend()
        test_smtp()
