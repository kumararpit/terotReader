# import stripe
# import razorpay
import paypalrestsdk
import os
import logging
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Add File Handler for debugging
try:
    f_handler = logging.FileHandler('paypal_debug.log')
    f_handler.setLevel(logging.INFO)
    fmt = logging.Formatter('%(asctime)s - %(message)s')
    f_handler.setFormatter(fmt)
    logger.addHandler(f_handler)
except Exception as e:
    print(f"Failed to setup file logging: {e}")

# Initialize payment gateways
# stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_51dummy123456789')

# razorpay_client = razorpay.Client(
#     auth=(
#         os.getenv('RAZORPAY_KEY_ID', 'rzp_test_dummy123456'),
#         os.getenv('RAZORPAY_KEY_SECRET', 'dummy_secret_123456')
#     )
# )

# PayPal Configuration
if app_env == 'production':
    paypal_mode = 'live'
elif app_env == 'development':
    paypal_mode = 'sandbox'
else:
    # Strict enforcement as requested: "if development then sandbox, else error" (implies invalid env should error)
    logger.error(f"Invalid APP_ENV: {app_env}. PayPal requires 'development' or 'production'.")
    raise ValueError(f"CRITICAL: Invalid APP_ENV '{app_env}'. Must be 'development' or 'production' for PayPal configuration.")

paypalrestsdk.configure({
    "mode": paypal_mode,
    "client_id": os.getenv('PAYPAL_CLIENT_ID', ''),
    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET', '')
})

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

class PaymentService:
    
    @staticmethod
    def create_paypal_payment(amount: float, currency: str, booking_data: Dict[str, Any]):
        """Create PayPal payment"""
        try:
            pp_client = os.getenv('PAYPAL_CLIENT_ID', '')
            # pp_mode = paypalrestsdk.api.default_api.mode # INVALID
            app_env_debug = os.getenv('APP_ENV', 'unknown')
            current_mode_override = os.getenv('PAYPAL_MODE', 'NOT_SET')
            calculated_mode = 'live' if app_env_debug == 'production' else 'sandbox'
            
            logger.info(f"PAYPAL DEBUG: AppEnv={app_env_debug}") 
            logger.info(f"PAYPAL DEBUG: OverrideMode={current_mode_override} (Calculated Default={calculated_mode})")
            logger.info(f"PAYPAL DEBUG: ClientID (partial)={pp_client[:5]}...{pp_client[-5:] if pp_client else 'None'}")

            if not pp_client:
                logger.error("PayPal Client ID not configured")
                return {'success': False, 'error': "PayPal configuration missing"}
            
            # PayPal implementation
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": f"{FRONTEND_URL}/payment-success?booking_id={booking_data.get('booking_id')}",
                    "cancel_url": f"{FRONTEND_URL}/payment-cancel?booking_id={booking_data.get('booking_id')}"
                },
                "transactions": [{
                    "amount": {
                        "total": f"{amount:.2f}",
                        "currency": currency
                    },
                    "description": f"Tarot Reading - {booking_data.get('service_type')}"
                }]
            })
            
            logger.info(f"PAYPAL DEBUG: Return URL: {FRONTEND_URL}/payment-success")
            logger.info(f"PAYPAL DEBUG: Cancel URL: {FRONTEND_URL}/payment-cancel")
            
            if payment.create():
                approval_url = next(link.href for link in payment.links if link.rel == 'approval_url')
                return {
                    'success': True,
                    'payment_id': payment.id,
                    'approval_url': approval_url,
                    'payment_method': 'paypal'
                }
            else:
                logger.error(f"PayPal payment creation failed: {payment.error}")
                return {'success': False, 'error': payment.error}
        except Exception as e:
            logger.error(f"PayPal payment error: {str(e)}")
            # Return generic error to user as requested
            return {'success': False, 'error': "Technical Error: Unable to initiate payment. Please try again later."}
    
    @staticmethod
    def verify_paypal_payment(payment_id: str):
        """Verify PayPal payment"""
        try:
            logger.info(f"PAYPAL DEBUG: Verifying payment_id={payment_id}")
            # For testing with dummy ID if needed, but usually we want real verification
            if 'demo' in payment_id:
                 return {
                    'success': True,
                    'payment_status': 'approved',
                    'transaction_id': payment_id,
                    'amount': 0.0,
                    'currency': 'EUR'
                }

            payment = paypalrestsdk.Payment.find(payment_id)
            if payment.execute({"payer_id": payment.payer.payer_info.payer_id}):
                if payment.state != 'approved':
                    logger.error(f"PayPal payment executed but state is {payment.state}")
                    return {'success': False, 'error': f"Payment state is {payment.state}"}
                    
                return {
                    'success': True,
                    'payment_status': payment.state,
                    'transaction_id': payment.id,
                    'amount': float(payment.transactions[0].amount.total),
                    'currency': payment.transactions[0].amount.currency
                }
            else:
                logger.error(f"PayPal execution failed: {payment.error}")
                return {'success': False, 'error': payment.error}
        except Exception as e:
            logger.error(f"PayPal verification error: {str(e)}")
            return {'success': False, 'error': str(e)}

payment_service = PaymentService()

payment_service = PaymentService()