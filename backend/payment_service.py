import stripe
import razorpay
import paypalrestsdk
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Initialize payment gateways
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_51dummy123456789')

razorpay_client = razorpay.Client(
    auth=(
        os.getenv('RAZORPAY_KEY_ID', 'rzp_test_dummy123456'),
        os.getenv('RAZORPAY_KEY_SECRET', 'dummy_secret_123456')
    )
)

paypalrestsdk.configure({
    "mode": os.getenv('PAYPAL_MODE', 'sandbox'),
    "client_id": os.getenv('PAYPAL_CLIENT_ID', 'dummy_client_id_123'),
    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET', 'dummy_client_secret_456')
})

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

class PaymentService:
    
    @staticmethod
    def create_stripe_payment(amount: float, currency: str, booking_data: Dict[str, Any]):
        """Create Stripe payment session"""
        try:
            # For demo purposes with dummy keys, return mock data
            if 'dummy' in stripe.api_key:
                logger.info(f"[DEMO] Stripe payment session created for {amount} {currency}")
                return {
                    'success': True,
                    'session_id': 'cs_test_demo123456789',
                    'url': f"{FRONTEND_URL}/payment-success?session_id=demo_stripe_123&booking_id={booking_data.get('booking_id')}",
                    'payment_method': 'stripe'
                }
            
            # Real Stripe implementation
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': currency.lower(),
                        'unit_amount': int(amount * 100),  # Convert to cents
                        'product_data': {
                            'name': booking_data.get('service_type', 'Tarot Reading'),
                            'description': f"Booking for {booking_data.get('full_name')}",
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_data.get('booking_id')}",
                cancel_url=f"{FRONTEND_URL}/payment-cancel?booking_id={booking_data.get('booking_id')}",
                metadata={'booking_id': booking_data.get('booking_id')}
            )
            
            return {
                'success': True,
                'session_id': session.id,
                'url': session.url,
                'payment_method': 'stripe'
            }
        except Exception as e:
            logger.error(f"Stripe payment error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def create_razorpay_order(amount: float, currency: str, booking_data: Dict[str, Any]):
        """Create Razorpay order"""
        try:
            # For demo purposes with dummy keys, return mock data
            if 'dummy' in os.getenv('RAZORPAY_KEY_ID', ''):
                logger.info(f"[DEMO] Razorpay order created for {amount} {currency}")
                return {
                    'success': True,
                    'order_id': 'order_demo123456789',
                    'amount': int(amount * 100),
                    'currency': currency,
                    'key_id': os.getenv('RAZORPAY_KEY_ID'),
                    'payment_method': 'razorpay'
                }
            
            # Real Razorpay implementation
            order = razorpay_client.order.create({
                'amount': int(amount * 100),  # Amount in paise
                'currency': currency,
                'payment_capture': 1,
                'notes': {
                    'booking_id': booking_data.get('booking_id'),
                    'customer_name': booking_data.get('full_name')
                }
            })
            
            return {
                'success': True,
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'key_id': os.getenv('RAZORPAY_KEY_ID'),
                'payment_method': 'razorpay'
            }
        except Exception as e:
            logger.error(f"Razorpay order error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def create_paypal_payment(amount: float, currency: str, booking_data: Dict[str, Any]):
        """Create PayPal payment"""
        try:
            # For demo purposes with dummy keys, return mock data
            if 'dummy' in os.getenv('PAYPAL_CLIENT_ID', ''):
                logger.info(f"[DEMO] PayPal payment created for {amount} {currency}")
                return {
                    'success': True,
                    'payment_id': 'PAYID-DEMO123456',
                    'approval_url': f"{FRONTEND_URL}/payment-success?payment_id=demo_paypal_123&booking_id={booking_data.get('booking_id')}",
                    'payment_method': 'paypal'
                }
            
            # Real PayPal implementation
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": f"{FRONTEND_URL}/payment-success?booking_id={booking_data.get('booking_id')}",
                    "cancel_url": f"{FRONTEND_URL}/payment-cancel?booking_id={booking_data.get('booking_id')}"
                },
                "transactions": [{
                    "amount": {
                        "total": str(amount),
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
                return {'success': False, 'error': payment.error}
        except Exception as e:
            logger.error(f"PayPal payment error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_stripe_payment(session_id: str):
        """Verify Stripe payment"""
        try:
            # For demo
            if 'demo' in session_id:
                return {
                    'success': True,
                    'payment_status': 'paid',
                    'transaction_id': session_id,
                    'amount': 33.00,
                    'currency': 'EUR'
                }
            
            session = stripe.checkout.Session.retrieve(session_id)
            return {
                'success': True,
                'payment_status': session.payment_status,
                'transaction_id': session.payment_intent,
                'amount': session.amount_total / 100,
                'currency': session.currency.upper()
            }
        except Exception as e:
            logger.error(f"Stripe verification error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_razorpay_payment(payment_id: str, order_id: str, signature: str):
        """Verify Razorpay payment"""
        try:
            # For demo
            if 'demo' in payment_id:
                return {
                    'success': True,
                    'payment_status': 'captured',
                    'transaction_id': payment_id
                }
            
            razorpay_client.utility.verify_payment_signature({
                'razorpay_payment_id': payment_id,
                'razorpay_order_id': order_id,
                'razorpay_signature': signature
            })
            
            payment = razorpay_client.payment.fetch(payment_id)
            return {
                'success': True,
                'payment_status': payment['status'],
                'transaction_id': payment_id,
                'amount': payment['amount'] / 100,
                'currency': payment['currency']
            }
        except Exception as e:
            logger.error(f"Razorpay verification error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_paypal_payment(payment_id: str):
        """Verify PayPal payment"""
        try:
            # For demo
            if 'demo' in payment_id:
                return {
                    'success': True,
                    'payment_status': 'approved',
                    'transaction_id': payment_id
                }
            
            payment = paypalrestsdk.Payment.find(payment_id)
            return {
                'success': True,
                'payment_status': payment.state,
                'transaction_id': payment_id,
                'amount': float(payment.transactions[0].amount.total),
                'currency': payment.transactions[0].amount.currency
            }
        except Exception as e:
            logger.error(f"PayPal verification error: {str(e)}")
            return {'success': False, 'error': str(e)}

payment_service = PaymentService()