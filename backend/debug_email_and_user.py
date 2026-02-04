import asyncio
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load env
load_dotenv()

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_email")

async def check_user(email_to_check):
    mongo_url = os.getenv('MONGO_URL')
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return

    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv('DB_NAME', 'tarot_db')
    db = client[db_name]
    
    print(f"Checking for user with email: {email_to_check}")
    user = await db.users.find_one({"email": email_to_check})
    
    if user:
        print(f"SUCCESS: User found! Username: {user.get('username')}")
    else:
        print("FAILURE: User NOT found in database. Forgot Password safely ignores non-existent users.")
        print("Please ensure you have created the admin account via /auth/setup first.")

def test_smtp(to_email):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    print(f"SMTP Configuration:")
    print(f"Host: {smtp_host}")
    print(f"Port: {smtp_port}")
    print(f"User: {smtp_user if smtp_user else 'NOT SET'}")
    print(f"Pass: {'SET' if smtp_password else 'NOT SET'}")

    if not smtp_user or not smtp_password:
        print("ERROR: SMTP Credentials missing.")
        return

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = "Debug Test Email"
    msg.attach(MIMEText("This is a test email to verify SMTP settings.", 'plain'))

    try:
        print("Attempting to connect to SMTP server...")
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        print("Logging in...")
        server.login(smtp_user, smtp_password)
        print("Sending email...")
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        print("SUCCESS: Test email sent successfully!")
    except Exception as e:
        print(f"ERROR: Failed to send email. Reason: {e}")

if __name__ == "__main__":
    target_email = input("Enter the email address you are trying to reset: ").strip()
    
    if not target_email:
        print("No email provided.")
        exit(1)
        
    print("\n--- STEP 1: Checking Database ---")
    asyncio.run(check_user(target_email))
    
    print("\n--- STEP 2: Testing SMTP Connection ---")
    test_smtp(target_email)
