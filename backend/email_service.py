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

# Load env vars
load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

def generate_booking_pdf(booking: dict):
    """
    Generates a PDF summary of the booking details.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    elements.append(Paragraph(f"Booking Confirmation", styles['Title']))
    elements.append(Paragraph(f"Booking ID: {booking.get('booking_id', 'N/A')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Booking Details Table
    data = [
        ["Field", "Details"],
        ["Full Name", booking.get('full_name', 'N/A')],
        ["Email", booking.get('email', 'N/A')],
        ["Phone", booking.get('phone', 'N/A')],
        ["Service Type", booking.get('service_type', 'N/A')],
        ["Date", booking.get('preferred_date', 'N/A')],
        ["Time", booking.get('preferred_time', 'N/A')],
        ["Questions", booking.get('questions', 'N/A')],
        ["Situation", booking.get('situation_description', 'N/A')],
        ["Payment Status", booking.get('payment_status', 'N/A')],
        ["Amount", f"{booking.get('currency', '')} {booking.get('amount', '')}"]
    ]
    
    # Styling the table
    table = Table(data, colWidths=[150, 350])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.read()

def send_email(to_email: str, subject: str, body_html: str, attachment_data=None, attachment_name="booking_details.pdf"):
    """
    Sends an email using SMTP, optionally with a PDF attachment.
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

        if attachment_data:
            part = MIMEApplication(attachment_data, Name=attachment_name)
            part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
            msg.attach(part)

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
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
    Sends confirmation email to the user.
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
                
                <!-- INVOICE SECTION -->
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #333;">INVOICE</h3>
                    <p style="font-size: 14px; color: #666;">
                        <strong>Invoice #:</strong> {booking.get('booking_id')}<br/>
                        <strong>Date:</strong> {booking.get('created_at', '').split('T')[0]}<br/>
                        <strong>Status:</strong> <span style="color: green; font-weight: bold;">PAID</span>
                    </p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #ddd; text-align: left;">
                                <th style="padding: 8px 0;">Description</th>
                                <th style="padding: 8px 0; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px 0;">
                                    {service_display}<br/>
                                    <span style="font-size: 12px; color: #777;">Consultation Services</span>
                                </td>
                                <td style="padding: 10px 0; text-align: right;">
                                    {currency} {amount}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="padding: 15px 0; font-weight: bold;">TOTAL</td>
                                <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 16px;">
                                    {currency} {amount}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    This is a computer-generated invoice. No signature is required.<br/>
                    Tarot with Tejashvini
                </p>
                
                <p>We look forward to speaking with you.</p>
                <p>Warm regards,<br/>Tejashvini</p>
            </div>
        </body>
    </html>
    """
    # Use dynamic email from booking details
    recipient_email = booking.get('email')
    
    # Generate PDF
    try:
        pdf_bytes = generate_booking_pdf(booking)
    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        pdf_bytes = None

    if recipient_email:
        send_email(recipient_email, subject, body, attachment_data=pdf_bytes)
    else:
        logger.error("No recipient email found in booking details.")
    
    # Also notify Admin
    send_booking_notification_to_tejashvini(booking, payment_info)

def send_booking_notification_to_tejashvini(booking: dict, payment_info: dict = None):
    """
    Sends alert to admin.
    """
    if not ADMIN_EMAIL:
        logger.warning("ADMIN_EMAIL not set. Notification not sent.")
        return

    subject = f"NEW BOOKING: {booking.get('full_name')}"
    body = f"""
    <html>
        <body>
            <h2>New Booking Received</h2>
            <ul>
                <li><strong>Name:</strong> {booking.get('full_name')}</li>
                <li><strong>Service:</strong> {booking.get('service_type')}</li>
                <li><strong>Date:</strong> {booking.get('preferred_date')}</li>
                <li><strong>Time:</strong> {booking.get('preferred_time')}</li>
                <li><strong>Email:</strong> {booking.get('email')}</li>
                <li><strong>Phone:</strong> {booking.get('phone')}</li>
                <li><strong>Questions:</strong> {booking.get('questions')}</li>
                <li><strong>Payment Status:</strong> {booking.get('payment_status', 'Pending')}</li>
            </ul>
        </body>
    </html>
    """
    # Generate PDF
    try:
        pdf_bytes = generate_booking_pdf(booking)
    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        pdf_bytes = None

    send_email(ADMIN_EMAIL, subject, body, attachment_data=pdf_bytes)

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
            <p>If you did not request this, please ignore this email.</p>
            <p>This code is valid for 10 minutes.</p>
        </body>
    </html>
    """
    send_email(email, subject, body)