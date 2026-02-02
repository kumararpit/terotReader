import React, { useEffect, useState } from 'react';
import { CheckCircle, Mail, Phone, ArrowRight, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      const paymentId = searchParams.get('payment_id');
      const bookingId = searchParams.get('booking_id') || localStorage.getItem('booking_id');
      const paymentMethod = localStorage.getItem('payment_method') || 'stripe';

      if (!bookingId) {
        toast.error('Booking ID not found');
        navigate('/');
        return;
      }

      // Verify payment
      const response = await axios.post(`${API}/bookings/verify-payment`, {
        booking_id: bookingId,
        payment_method: paymentMethod,
        session_id: sessionId,
        payment_id: paymentId,
        order_id: searchParams.get('order_id'),
        signature: searchParams.get('signature')
      });

      if (response.data.success) {
        // Get booking details
        const bookingResponse = await axios.get(`${API}/bookings/${bookingId}`);
        setBookingDetails(bookingResponse.data);

        toast.success('Payment Successful!', {
          description: 'Confirmation emails have been sent.'
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment Verification Failed', {
        description: 'Please contact support with your booking ID.'
      });
    } finally {
      setIsVerifying(false);
      // Clear localStorage
      localStorage.removeItem('booking_id');
      localStorage.removeItem('payment_method');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#151515] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#D4AF37] mb-4"></div>
          <p className="text-white text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151515] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-[#1a1a3e]/60 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Payment Successful! ✨
          </h1>
          <p className="text-xl text-[#FFD700] mb-6">
            Your Tarot Reading is Confirmed
          </p>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="bg-[#2D2463]/30 border border-[#D4AF37]/20 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-white font-semibold text-lg mb-4">📋 Booking Details</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="text-[#D4AF37]">Booking ID:</span> {bookingDetails.booking_id}</p>
                <p><span className="text-[#D4AF37]">Service:</span> {bookingDetails.service_type}</p>
                <p><span className="text-[#D4AF37]">Amount Paid:</span> €{bookingDetails.amount?.toFixed(2)}</p>
                <p><span className="text-[#D4AF37]">Status:</span> <span className="text-green-500">✅ Confirmed</span></p>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-[#2D2463]/30 border border-[#D4AF37]/20 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-white font-semibold text-lg mb-4">🔮 What's Next?</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>Confirmation email sent to your inbox</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>Tejashvini will contact you within 24 hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>Delivered readings: Receive within 48 hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>Live consultations: Schedule exact time together</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mb-8">
            <p className="text-gray-400 mb-4">Questions? Feel free to reach out:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
              <a href="mailto:bathejatejashvini@gmail.com" className="flex items-center justify-center text-[#D4AF37] hover:text-[#FFD700]">
                <Mail size={16} className="mr-2" />
                bathejatejashvini@gmail.com
              </a>
              <a href="https://wa.me/393286737879" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-[#D4AF37] hover:text-[#FFD700]">
                <Phone size={16} className="mr-2" />
                +393286737879
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-[#D4AF37] hover:bg-[#FFD700] text-black rounded-full px-8 py-3 font-semibold uppercase text-sm tracking-wider transition-all duration-300"
            >
              <Home size={18} className="mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;