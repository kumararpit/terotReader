import os
import logging
import base64
import time
from dotenv import load_dotenv
import resend
from .pdf_service import generate_invoice_pdf_v2, generate_booking_details_pdf_v2
from .template_selector import get_template_for_service
from .logger import mask_pii

# Load env vars
env_path = os.path.join(os.path.dirname(__file__), '..', 'env', '.env')
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# Resend Configuration
RESEND_API = os.getenv("RESEND_API")
if RESEND_API:
    resend.api_key = RESEND_API
else:
    logger.warning("Action=email_config Status=missing_api_key Message='RESEND_API not set in .env'")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
SENDER_EMAIL = "noreply@tejashvinibdivinedecode.com"

def send_email(to_email: str, subject: str, body_html: str, attachments: list = None):
    """Sends an email using Resend API with multiple attachments."""
    masked_to = mask_pii(to_email)
    logger.info(f"Action=send_email Status=started To={masked_to} Subject='{subject}' Attachments={len(attachments) if attachments else 0}")
    
    if not RESEND_API:
        logger.warning(f"Action=send_email Status=failed To={masked_to} Reason=missing_api_key")
        return

    start_time = time.time()
    try:
        resend_attachments = []
        if attachments:
            for attachment in attachments:
                name = attachment.get('name', 'attachment')
                data = attachment.get('data')
                
                if not data:
                    continue
                
                encoded_content = base64.b64encode(data).decode('utf-8')
                resend_attachments.append({
                    "filename": name,
                    "content": encoded_content
                })

        params = {
            "from": f"Tarot with Tejashvini <{SENDER_EMAIL}>",
            "to": to_email,
            "subject": subject,
            "html": body_html,
        }

        if resend_attachments:
            params["attachments"] = resend_attachments

        r = resend.Emails.send(params)
        duration = (time.time() - start_time) * 1000
        logger.info(f"Action=send_email Status=finished To={masked_to} ID={r.get('id')} Duration={duration:.2f}ms")
        return r
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Action=send_email Status=failed To={masked_to} Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
        return None

def send_booking_confirmation_to_client(booking: dict, payment_info: dict = None, meeting_link: str = None):
    """Sends confirmation email to the user with multiple attachments."""
    booking_id = booking.get('booking_id', 'unknown')
    masked_email = mask_pii(booking.get('email'))
    logger.info(f"Action=send_booking_confirmation_to_client Status=started BookingID={booking_id} User={masked_email}")
    
    try:
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
        final_link = meeting_link or booking.get('meeting_link')
        link_html = f'<a href="{final_link}">{final_link}</a>' if final_link else "<em>(Will be sent shortly)</em>"

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
                        {f'<li><strong>Zoom Meeting Link:</strong> {link_html}</li>' if 'live' in raw_service.lower() else ''}
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
        
        # 1. Invoice PDF (New System)
        try:
            logger.debug(f"Action=generate_invoice Status=started BookingID={booking_id}")
            invoice_path = generate_invoice_pdf_v2(booking, payment_info)
            if invoice_path and os.path.exists(invoice_path):
                with open(invoice_path, "rb") as f:
                    attachments.append({'name': 'invoice.pdf', 'data': f.read()})
                os.remove(invoice_path)
                logger.debug(f"Action=generate_invoice Status=finished BookingID={booking_id}")
        except Exception as e:
            logger.error(f"Action=generate_invoice Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

        # 2. Booking Details PDF (New System)
        try:
            logger.debug(f"Action=generate_booking_details Status=started BookingID={booking_id}")
            template = get_template_for_service(booking.get('service_type'))
            details_path = generate_booking_details_pdf_v2(template, booking)
            if details_path and os.path.exists(details_path):
                with open(details_path, "rb") as f:
                    attachments.append({'name': 'booking_details.pdf', 'data': f.read()})
                os.remove(details_path)
                logger.debug(f"Action=generate_booking_details Status=finished BookingID={booking_id}")
        except Exception as e:
            logger.error(f"Action=generate_booking_details Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

        # 3. Aura Image (Separate Attachment)
        aura_data = booking.get('aura_image')
        if aura_data and 'aura' in raw_service.lower():
            try:
                logger.debug(f"Action=process_aura_image Status=started BookingID={booking_id}")
                if aura_data.startswith('data:image'):
                    header, encoded = aura_data.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                    ext = 'png'
                    if 'jpeg' in header or 'jpg' in header:
                        ext = 'jpg'
                    
                    safe_name = booking.get('full_name', 'user').replace(' ', '_').lower()
                    filename = f"{safe_name}_aura_image.{ext}"
                    attachments.append({'name': filename, 'data': image_bytes})
                    logger.debug(f"Action=process_aura_image Status=finished BookingID={booking_id}")
            except Exception as e:
                logger.error(f"Action=process_aura_image Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

        if recipient_email:
            send_email(recipient_email, subject, body, attachments=attachments)
            logger.info(f"Action=send_booking_confirmation_to_client Status=finished BookingID={booking_id}")
        else:
            logger.error(f"Action=send_booking_confirmation_to_client Status=failed BookingID={booking_id} Reason=missing_email")
            
    except Exception as e:
        logger.error(f"Action=send_booking_confirmation_to_client Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

def send_booking_notification_to_tejashvini(booking: dict, payment_info: dict = None):
    """Sends alert to admin with same attachments."""
    booking_id = booking.get('booking_id', 'unknown')
    logger.info(f"Action=send_booking_notification_to_tejashvini Status=started BookingID={booking_id}")
    
    if not ADMIN_EMAIL:
        logger.warning(f"Action=send_booking_notification_to_tejashvini Status=failed BookingID={booking_id} Reason=missing_admin_email")
        return

    try:
        subject = f"NEW BOOKING: {booking.get('full_name')} - {booking.get('service_type')}"
        body = f"""
        <html>
            <body>
                <h2>New Booking Received</h2>
                <p>See attachments for Invoice, Booking Details, and any Uploads.</p>
            </body>
        </html>
        """
        
        attachments = []
        
        # 1. Invoice
        try:
            invoice_path = generate_invoice_pdf_v2(booking, payment_info)
            if invoice_path and os.path.exists(invoice_path):
                with open(invoice_path, "rb") as f:
                    attachments.append({'name': 'invoice.pdf', 'data': f.read()})
                os.remove(invoice_path)
        except Exception: pass
        
        # 2. Details
        try:
             template = get_template_for_service(booking.get('service_type'))
             details_path = generate_booking_details_pdf_v2(template, booking)
             if details_path and os.path.exists(details_path):
                 with open(details_path, "rb") as f:
                     attachments.append({'name': 'booking_details.pdf', 'data': f.read()})
                 os.remove(details_path)
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
        logger.info(f"Action=send_booking_notification_to_tejashvini Status=finished BookingID={booking_id}")
    except Exception as e:
        logger.error(f"Action=send_booking_notification_to_tejashvini Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

def send_password_reset_otp(email: str, otp: str):
    """Sends password reset OTP."""
    masked_email = mask_pii(email)
    logger.info(f"Action=send_password_reset_otp Status=started To={masked_email}")
    
    try:
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
        send_email(email, subject, body)
        logger.info(f"Action=send_password_reset_otp Status=finished To={masked_email}")
    except Exception as e:
        logger.error(f"Action=send_password_reset_otp Status=failed To={masked_email} Error={str(e)}", exc_info=True)

def send_booking_cancellation_email(booking: dict):
    """Sends a cancellation email to the client with refund information."""
    booking_id = booking.get('booking_id', 'unknown')
    masked_email = mask_pii(booking.get('email'))
    logger.info(f"Action=send_booking_cancellation_email Status=started BookingID={booking_id} To={masked_email}")
    
    try:
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
            logger.info(f"Action=send_booking_cancellation_email Status=finished BookingID={booking_id}")
        else:
            logger.warning(f"Action=send_booking_cancellation_email Status=failed BookingID={booking_id} Reason=missing_email")
    except Exception as e:
        logger.error(f"Action=send_booking_cancellation_email Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)

def send_reminder_email(booking: dict):
    """Sends a booking completion reminder email to a user who started but didn't pay."""
    booking_id = booking.get('booking_id', 'unknown')
    masked_email = mask_pii(booking.get('email'))
    logger.info(f"Action=send_reminder_email Status=started BookingID={booking_id} To={masked_email}")
    
    start_time = time.time()
    try:
        import jinja2
        
        templates_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        env = jinja2.Environment(loader=jinja2.FileSystemLoader(templates_dir))

        try:
            template = env.get_template('reminder_email.html')
        except jinja2.TemplateNotFound:
            logger.error(f"Action=send_reminder_email Status=failed BookingID={booking_id} Reason=template_not_found")
            return None

        service_type = booking.get('service_type', 'Tarot Reading')
        service_map = {
            'live-standard': 'Live Standard Reading',
            'live-emergency': 'Live Emergency Reading',
            'delivered-standard': 'Delivered Standard Reading',
            'delivered-emergency': 'Delivered Emergency Reading',
            'aura': 'Aura Reading',
            'tiktok-live': 'TikTok Live Session',
        }
        service_name = service_map.get(service_type, service_type.replace('-', ' ').title())

        _raw_url = os.getenv('FRONTEND_URL', 'https://tejashvinibdivinedecode.com')
        _urls = [u.strip() for u in _raw_url.split(',') if u.strip()]
        frontend_url = next((u for u in reversed(_urls) if u.startswith('https://')), _urls[-1] if _urls else 'https://tejashvinibdivinedecode.com')
        booking_url = f"{frontend_url}/services"

        body = template.render(
            name=booking.get('full_name', 'Valued Customer'),
            service_name=service_name,
            booking_id=booking.get('booking_id', ''),
            amount=booking.get('amount', ''),
            currency=booking.get('currency', 'EUR'),
            booking_url=booking_url,
        )

        recipient_email = booking.get('email')
        if not recipient_email:
            logger.warning(f"Action=send_reminder_email Status=failed BookingID={booking_id} Reason=missing_email")
            return None

        subject = "✨ Complete Your Tarot Booking - Your Reading Awaits"
        result = send_email(recipient_email, subject, body)
        duration = (time.time() - start_time) * 1000
        if result:
            logger.info(f"Action=send_reminder_email Status=finished BookingID={booking_id} Duration={duration:.2f}ms")
        return result
    except Exception as e:
        logger.error(f"Action=send_reminder_email Status=failed BookingID={booking_id} Error={str(e)}", exc_info=True)
        return None