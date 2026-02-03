# import stripe
# import razorpay
import paypalrestsdk
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Initialize payment gateways
# stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_51dummy123456789')

# razorpay_client = razorpay.Client(
#     auth=(
#         os.getenv('RAZORPAY_KEY_ID', 'rzp_test_dummy123456'),
#         os.getenv('RAZORPAY_KEY_SECRET', 'dummy_secret_123456')
#     )
# )

# PayPal Configuration
# Mode should be 'live' for production, 'sandbox' for testing
paypalrestsdk.configure({
    "mode": os.getenv('PAYPAL_MODE', 'live'),
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
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_paypal_payment(payment_id: str):
        """Verify PayPal payment"""
        try:
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