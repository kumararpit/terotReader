import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.port = int(os.getenv('EMAIL_PORT', 587))
        self.username = os.getenv('EMAIL_USER', 'demo@example.com')
        self.password = os.getenv('EMAIL_PASSWORD', 'demo_password')
        self.from_email = os.getenv('EMAIL_FROM', 'Tarot Reader Tejashvini <demo@example.com>')
        self.tejashvini_email = 'bathejatejashvini@gmail.com'
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send email using SMTP"""
        try:
            # For demo purposes, just log the email
            logger.info(f"\n{'='*60}")
            logger.info(f"EMAIL SENT (DEMO MODE)")
            logger.info(f"To: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Content: {text_content or 'HTML email'}")
            logger.info(f"{'='*60}\n")
            
            # In production, uncomment this:
            """
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            """
            
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    def send_booking_confirmation_to_client(self, booking_data, payment_data):
        """Send booking confirmation to client"""
        subject = "🔮 Your Tarot Reading is Confirmed!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4A0E4E 0%, #2D2463 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37; }}
                .detail-row {{ margin: 10px 0; }}
                .label {{ font-weight: bold; color: #4A0E4E; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 14px; }}
                .btn {{ display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✨ Booking Confirmed!</h1>
                    <p>Your spiritual journey begins</p>
                </div>
                <div class="content">
                    <p>Dear {booking_data.get('full_name', 'Seeker')},</p>
                    
                    <p>Thank you for booking a tarot reading with me! Your payment has been received, and your session is confirmed.</p>
                    
                    <div class="booking-details">
                        <h3>📋 Booking Details</h3>
                        <div class="detail-row">
                            <span class="label">Booking ID:</span> {booking_data.get('booking_id', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Service:</span> {booking_data.get('service_type', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Preferred Date:</span> {booking_data.get('preferred_date', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Preferred Time:</span> {booking_data.get('preferred_time', 'To be confirmed')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Amount Paid:</span> {payment_data.get('amount', 'N/A')} {payment_data.get('currency', 'EUR')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Payment Method:</span> {payment_data.get('payment_method', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Transaction ID:</span> {payment_data.get('transaction_id', 'N/A')}
                        </div>
                    </div>
                    
                    <h3>📝 Your Questions:</h3>
                    <p style="background: white; padding: 15px; border-radius: 8px;">{booking_data.get('questions', 'N/A')}</p>
                    
                    <h3>🔮 What's Next?</h3>
                    <ul>
                        <li>I will reach out to you within 24 hours to confirm the final session details</li>
                        <li>For delivered readings: You'll receive your reading within 48 hours</li>
                        <li>For live consultations: We'll schedule the exact time together</li>
                        <li>All information shared remains strictly confidential</li>
                    </ul>
                    
                    <p>If you have any questions, feel free to reach out:</p>
                    <p>📧 Email: bathejatejashvini@gmail.com<br>
                    📱 WhatsApp: +393286737879</p>
                    
                    <p style="margin-top: 30px;">Looking forward to guiding you on your spiritual journey!</p>
                    
                    <p>With light and blessings,<br>
                    <strong>Tejashvini Batheja</strong></p>
                </div>
                <div class="footer">
                    <p>© 2026 Tarot Reader Tejashvini. All rights reserved.</p>
                    <p>This email was sent because you booked a tarot reading session.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Booking Confirmed!
        
        Dear {booking_data.get('full_name', 'Seeker')},
        
        Your tarot reading booking has been confirmed!
        
        Booking Details:
        - Booking ID: {booking_data.get('booking_id', 'N/A')}
        - Service: {booking_data.get('service_type', 'N/A')}
        - Date: {booking_data.get('preferred_date', 'N/A')}
        - Amount Paid: {payment_data.get('amount', 'N/A')} {payment_data.get('currency', 'EUR')}
        - Transaction ID: {payment_data.get('transaction_id', 'N/A')}
        
        I'll reach out within 24 hours to confirm final details.
        
        Best regards,
        Tejashvini Batheja
        """
        
        return self.send_email(booking_data.get('email'), subject, html_content, text_content)
    
    def send_booking_notification_to_tejashvini(self, booking_data, payment_data):
        """Send booking notification to Tejashvini"""
        subject = f"🎯 New Booking: {booking_data.get('full_name')} - {booking_data.get('service_type')}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2D2463; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ margin: 8px 0; padding: 8px; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #4A0E4E; display: inline-block; width: 180px; }}
                .urgent {{ background: #FFD700; color: #000; padding: 10px; border-radius: 5px; margin: 10px 0; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🎯 New Booking Received!</h2>
                    <p>Payment Confirmed</p>
                </div>
                <div class="content">
                    <div class="urgent">⚡ Action Required: Please contact the client within 24 hours</div>
                    
                    <div class="booking-details">
                        <h3>Client Information</h3>
                        <div class="detail-row">
                            <span class="label">Name:</span> {booking_data.get('full_name', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Email:</span> {booking_data.get('email', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Phone:</span> {booking_data.get('phone', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Gender:</span> {booking_data.get('gender', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Date of Birth:</span> {booking_data.get('date_of_birth', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Partner Info:</span> {booking_data.get('partner_info', 'None')}
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>Booking Details</h3>
                        <div class="detail-row">
                            <span class="label">Booking ID:</span> {booking_data.get('booking_id', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Service Type:</span> {booking_data.get('service_type', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Preferred Date:</span> {booking_data.get('preferred_date', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Preferred Time:</span> {booking_data.get('preferred_time', 'Not specified')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Alternative Time:</span> {booking_data.get('alternative_time', 'Not specified')}
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>Payment Information</h3>
                        <div class="detail-row">
                            <span class="label">Amount:</span> {payment_data.get('amount', 'N/A')} {payment_data.get('currency', 'EUR')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Payment Method:</span> {payment_data.get('payment_method', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Transaction ID:</span> {payment_data.get('transaction_id', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Payment Status:</span> ✅ PAID
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>Client's Questions</h3>
                        <p style="white-space: pre-wrap;">{booking_data.get('questions', 'N/A')}</p>
                    </div>
                    
                    <div class="booking-details">
                        <h3>Situation Description</h3>
                        <p style="white-space: pre-wrap;">{booking_data.get('situation_description', 'N/A')}</p>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        Booked on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(self.tejashvini_email, subject, html_content)

email_service = EmailService()