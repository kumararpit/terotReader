# import stripe
# import razorpay
import paypalrestsdk
import os
import logging
import time
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', 'env', '.env')
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# PayPal Configuration
app_env = os.getenv('APP_ENV', 'development').lower()

if app_env == 'production':
    paypal_mode = 'live'
elif app_env == 'development':
    paypal_mode = 'sandbox'
else:
    logger.error(f"Action=paypal_config Status=failed Error='Invalid APP_ENV: {app_env}'")
    raise ValueError(f"CRITICAL: Invalid APP_ENV '{app_env}'. Must be 'development' or 'production'.")

paypalrestsdk.configure({
    "mode": paypal_mode,
    "client_id": os.getenv('PAYPAL_CLIENT_ID', ''),
    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET', '')
})

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

class PaymentService:
    
    @staticmethod
    def create_paypal_payment(amount: float, currency: str, booking_data: Dict[str, Any]):
        """Create PayPal payment."""
        booking_id = booking_data.get('booking_id', 'unknown')
        logger.info(f"Action=create_paypal_payment Status=started BookingID={booking_id} Amount={amount} Currency={currency}")
        
        start_time = time.time()
        try:
            pp_client = os.getenv('PAYPAL_CLIENT_ID', '')
            if not pp_client:
                logger.error(f"Action=create_paypal_payment Status=failed BookingID={booking_id} Reason=missing_client_id")
                return {'success': False, 'error': "PayPal configuration missing"}
            
            # PayPal Tax Breakdown
            tax_amount = booking_data.get('tax_amount', 0.0)
            subtotal = amount - tax_amount

            # PayPal implementation
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": f"{FRONTEND_URL}/payment-success?booking_id={booking_id}",
                    "cancel_url": f"{FRONTEND_URL}/payment-cancel?booking_id={booking_id}"
                },
                "transactions": [{
                    "amount": {
                        "total": f"{amount:.2f}",
                        "currency": currency,
                        "details": {
                            "subtotal": f"{subtotal:.2f}",
                            "tax": f"{tax_amount:.2f}"
                        }
                    },
                    "description": f"Tarot Reading - {booking_data.get('service_type')}",
                    "item_list": {
                        "items": [{
                            "name": f"Tarot Reading ({booking_data.get('service_type')})",
                            "sku": booking_id,
                            "price": f"{subtotal:.2f}",
                            "currency": currency,
                            "quantity": 1
                        }]
                    }
                }]
            })
            
            if payment.create():
                approval_url = next(link.href for link in payment.links if link.rel == 'approval_url')
                duration = (time.time() - start_time) * 1000
                logger.info(f"Action=create_paypal_payment Status=finished BookingID={booking_id} PaymentID={payment.id} Duration={duration:.2f}ms")
                return {
                    'success': True,
                    'payment_id': payment.id,
                    'approval_url': approval_url,
                    'payment_method': 'paypal'
                }
            else:
                duration = (time.time() - start_time) * 1000
                logger.error(f"Action=create_paypal_payment Status=failed BookingID={booking_id} Error={str(payment.error)} Duration={duration:.2f}ms")
                return {'success': False, 'error': payment.error}
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(f"Action=create_paypal_payment Status=failed BookingID={booking_id} Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
            return {'success': False, 'error': "Technical Error: Unable to initiate payment."}
    
    @staticmethod
    def verify_paypal_payment(payment_id: str, payer_id: str = None):
        """Verify PayPal payment."""
        logger.info(f"Action=verify_paypal_payment Status=started PaymentID={payment_id} PayerID={payer_id}")
        
        start_time = time.time()
        try:
            if 'demo' in payment_id:
                 logger.info("Action=verify_paypal_payment Status=finished_demo")
                 return {
                    'success': True,
                    'payment_status': 'approved',
                    'transaction_id': payment_id,
                    'amount': 0.0,
                    'currency': 'EUR'
                }

            payment = paypalrestsdk.Payment.find(payment_id)
            
            exec_payer_id = payer_id
            if not exec_payer_id:
                try:
                    exec_payer_id = payment.payer.payer_info.payer_id
                except AttributeError:
                    pass
            
            if not exec_payer_id:
                logger.error(f"Action=verify_paypal_payment Status=failed PaymentID={payment_id} Reason=missing_payer_id")
                return {'success': False, 'error': "Missing payer_id"}

            if payment.execute({"payer_id": exec_payer_id}):
                duration = (time.time() - start_time) * 1000
                if payment.state != 'approved':
                    logger.error(f"Action=verify_paypal_payment Status=failed PaymentID={payment_id} State={payment.state} Duration={duration:.2f}ms")
                    return {'success': False, 'error': f"Payment state is {payment.state}"}
                    
                logger.info(f"Action=verify_paypal_payment Status=finished PaymentID={payment_id} Duration={duration:.2f}ms")
                return {
                    'success': True,
                    'payment_status': payment.state,
                    'transaction_id': payment.id,
                    'amount': float(payment.transactions[0].amount.total),
                    'currency': payment.transactions[0].amount.currency
                }
            else:
                duration = (time.time() - start_time) * 1000
                logger.error(f"Action=verify_paypal_payment Status=failed PaymentID={payment_id} Error={str(payment.error)} Duration={duration:.2f}ms")
                return {'success': False, 'error': payment.error}
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(f"Action=verify_paypal_payment Status=failed PaymentID={payment_id} Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
            return {'success': False, 'error': str(e)}

payment_service = PaymentService()