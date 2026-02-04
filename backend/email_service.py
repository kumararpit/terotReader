import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import logging
from dotenv import load_dotenv
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import base64
from pdf_service import generate_invoice_pdf, generate_booking_details_pdf

# Load env vars
load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

def send_email(to_email: str, subject: str, body_html: str, attachments: list = None):
    """
    Sends an email using SMTP with multiple attachments.
    attachments: list of dicts {'name': str, 'data': bytes, 'mime': str (optional)}
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not set. Email not sent.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        if attachments and len(attachments) > 0:
            for attachment in attachments:
                name = attachment.get('name', 'attachment')
                data = attachment.get('data')
                
                if not data:
                    continue
                    
                # Basic MIME type detection or default
                part = MIMEApplication(data, Name=name)
                part['Content-Disposition'] = f'attachment; filename="{name}"'
                msg.attach(part)

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT) # Establish connection
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_email, text)
        server.quit()
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def send_booking_confirmation_to_client(booking: dict, payment_info: dict = None, meeting_link: str = None):
    """
    Sends confirmation email to the user with multiple attachments.
    """
    subject = "Booking Confirmation - Tarot with Tejashvini"
    
    amount = booking.get('amount')
    currency = booking.get('currency')
    
    if payment_info:
        amount = payment_info.get('amount', amount)
        currency = payment_info.get('currency', currency)

    # Format Service Name
    raw_service = booking.get('service_type', '')
    service_display = raw_service.replace('-', ' ').title()
    
    if raw_service == 'delivered-3':
        service_display = "Delivered Reading (3 Questions)"
    elif raw_service == 'delivered-5':
        service_display = "Delivered Reading (5 Questions)"
    elif raw_service == 'live-20':
        service_display = "Live Reading (20 Mins)"
    elif raw_service == 'live-40':
        service_display = "Live Reading (40 Mins)"
    elif raw_service == 'aura':
        service_display = "Aura Scanning"

    # Handle Link
    link_html = f'<a href="{meeting_link}">{meeting_link}</a>' if meeting_link else "<em>(Will be sent shortly)</em>"

    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Booking Confirmed!</h2>
                <p>Dear {booking.get('full_name')},</p>
                <p>Your appointment has been scheduled successfully.</p>
                
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Service:</strong> {service_display}</li>
                    <li><strong>Date:</strong> {booking.get('preferred_date')}</li>
                    <li><strong>Time:</strong> {booking.get('preferred_time')}</li>
                    <li><strong>Zoom Meeting Link:</strong> {link_html}</li>
                </ul>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Please find attached:</p>
                <ul>
                    <li><strong>Invoice</strong></li>
                    <li><strong>Booking Details</strong></li>
                    {'<li><strong>Aura Image</strong></li>' if 'aura' in raw_service else ''}
                </ul>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    Tarot with Tejashvini
                </p>
            </div>
        </body>
    </html>
    """
    # Recipients
    recipient_email = booking.get('email')
    
    # Prepare Attachments
    attachments = []
    
    # 1. Invoice PDF
    try:
        invoice_bytes = generate_invoice_pdf(booking, payment_info)
        attachments.append({'name': 'invoice.pdf', 'data': invoice_bytes})
    except Exception as e:
        logger.error(f"Failed to generate invoice: {e}")

    # 2. Booking Details PDF
    try:
        details_bytes = generate_booking_details_pdf(booking)
        attachments.append({'name': 'booking_details.pdf', 'data': details_bytes})
    except Exception as e:
        logger.error(f"Failed to generate booking details: {e}")

    # 3. Aura Image (Separate Attachment)
    aura_data = booking.get('aura_image')
    if aura_data and 'aura' in raw_service.lower():
        try:
            # Check if base64
            if aura_data.startswith('data:image'):
                header, encoded = aura_data.split(",", 1)
                image_bytes = base64.b64decode(encoded)
                # Determine extension
                ext = 'png'
                if 'jpeg' in header or 'jpg' in header:
                    ext = 'jpg'
                
                # Filename: username_aura_image.png
                safe_name = booking.get('full_name', 'user').replace(' ', '_').lower()
                filename = f"{safe_name}_aura_image.{ext}"
                
                attachments.append({'name': filename, 'data': image_bytes})
            else:
                pass # Handle URL or unsupported format if needed
        except Exception as e:
            logger.error(f"Failed to process aura image attachment: {e}")

    if recipient_email:
        send_email(recipient_email, subject, body, attachments=attachments)
    else:
        logger.error("No recipient email found in booking details.")

def send_booking_notification_to_tejashvini(booking: dict, payment_info: dict = None):
    """
    Sends alert to admin with same attachments.
    """
    if not ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not set. Notification not sent.")
        return

    subject = f"NEW BOOKING: {booking.get('full_name')} - {booking.get('service_type')}"
    body = f"""
    <html>
        <body>
            <h2>New Booking Received</h2>
            <p>See attachments for Invoice, Booking Details, and any Uploads.</p>
        </body>
    </html>
    """
    
    # Re-generate attachments (or pass them if we wanted to optimize, but regeneration is safer/stateless here)
    attachments = []
    
    # 1. Invoice
    try:
        attachments.append({'name': 'invoice.pdf', 'data': generate_invoice_pdf(booking, payment_info)})
    except Exception: pass
    
    # 2. Details
    try:
         attachments.append({'name': 'booking_details.pdf', 'data': generate_booking_details_pdf(booking)})
    except Exception: pass
    
    # 3. Aura
    aura_data = booking.get('aura_image')
    raw_service = booking.get('service_type', '')
    if aura_data and 'aura' in raw_service.lower():
         try:
            if aura_data.startswith('data:image'):
                header, encoded = aura_data.split(",", 1)
                image_bytes = base64.b64decode(encoded)
                ext = 'jpg' if 'jpeg' in header or 'jpg' in header else 'png'
                safe_name = booking.get('full_name', 'user').replace(' ', '_').lower()
                filename = f"{safe_name}_aura_image.{ext}"
                attachments.append({'name': filename, 'data': image_bytes})
         except: pass

    send_email(ADMIN_EMAIL, subject, body, attachments=attachments)

def send_password_reset_otp(email: str, otp: str):
    """
    Sends password reset OTP.
    """
    subject = "Password Reset - Tarot Admin"
    body = f"""
    <html>
        <body>
             <h2>Password Reset Request</h2>
            <p>Your One-Time Password (OTP) to reset your admin password is:</p>
            <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
            <p>This code is valid for 10 minutes.</p>
        </body>
    </html>
    """
    # No attachments for OTP
    send_email(email, subject, body)

def send_booking_cancellation_email(booking: dict):
    """
    Sends a cancellation email to the client with refund information.
    """
    subject = "Important: Update regarding your booking with Tarot with Tejashvini"
    
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Booking Cancellation</h2>
                <p>Dear {booking.get('full_name')},</p>
                
                <p>We regret to inform you that your scheduled appointment for <strong>{booking.get('service_type').replace('-', ' ').title()}</strong> 
                on <strong>{booking.get('preferred_date')} at {booking.get('preferred_time')}</strong> has been canceled.</p>
                
                <p>We sincerely apologize for any inconvenience this may cause.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Refund Status:</p>
                    <p style="margin: 5px 0 0 0;">A full refund has been initiated and will be processed within <strong style="color: #4f46e5;">3 to 5 business days</strong>.</p>
                </div>
                
                <p>If you would like to reschedule or have any questions, please reply to this email.</p>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    Tarot with Tejashvini
                </p>
            </div>
        </body>
    </html>
    """
    
    recipient_email = booking.get('email')
    if recipient_email:
        send_email(recipient_email, subject, body)
    else:
        logger.warning(f"No email found for booking {booking.get('booking_id')}, cancellation email not sent.")