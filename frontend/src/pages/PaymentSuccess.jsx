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
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (!isVerifying) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVerifying]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRan = React.useRef(false);

  useEffect(() => {
    console.log("PaymentSuccess Mounted. URL:", window.location.href);
    if (isRan.current) return;
    isRan.current = true;
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      // PayPal parses as paymentId and PayerID usually
      const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
      const payerId = searchParams.get('PayerID') || searchParams.get('payer_id');
      const bookingId = searchParams.get('booking_id') || localStorage.getItem('booking_id');
      const paymentMethod = localStorage.getItem('payment_method') || 'stripe';

      if (!bookingId) {
        // Only error if we actually expected a booking ID (i.e., not just visiting the page manually)
        // But for verify, we need it. 
        // Silent redirect? Or just error.
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
        payer_id: payerId, // Send PayerID too if backend needs it (Backend verify_paypal_payment uses it internally from object usually, but good to have)
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
      // Only show error if it's NOT a "already verified" case? 
      // Backend should handle idempotency, but let's show a friendlier message or ignore if actually success logic allows.
      // For now, standard error but maybe cleaner text.
      toast.error('Payment Status Check Failed', {
        description: 'If you paid, please contact support. Your booking might still be confirmed.'
      });
    } finally {
      setIsVerifying(false);
      // Clear localStorage
      localStorage.removeItem('booking_id');
      localStorage.removeItem('payment_method');
    }
  };

  if (isVerifying) {
    // 60 segments for the circle, each represents 2 seconds
    const segments = Array.from({ length: 60 });
    const activeSegments = Math.ceil(timeLeft / 2);

    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center z-10 animate-in fade-in zoom-in duration-500">
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* Countdown Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-700 font-mono tracking-wider">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Remaining</span>
            </div>

            {/* SVG Segments */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-xl">
              {segments.map((_, i) => {
                const isGreen = i < activeSegments;
                return (
                  <line
                    key={i}
                    x1="50" y1="6"
                    x2="50" y2="18"
                    stroke={isGreen ? "#22c55e" : "#e2e8f0"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${i * 6} 50 50)`}
                    className="transition-colors duration-300"
                  />
                );
              })}
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Verifying Payment</h2>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Please wait while we securely confirm your transaction details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements matching Payment.jsx */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle className="text-green-600" size={48} />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-heading">
            Payment Successful! ✨
          </h1>
          <p className="text-xl text-[#B8860B] mb-8 font-medium">
            Your Tarot Reading is Confirmed
          </p>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 mb-8 text-left shadow-sm">
              <h3 className="text-slate-800 font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span> Booking Details
              </h3>
              <div className="space-y-3 text-slate-600">
                <p className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Booking Reference:</span>
                  <span className="font-mono text-slate-800">{bookingDetails.booking_id.slice(0, 8)}...</span>
                </p>
                <p className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Service:</span>
                  <span className="font-medium text-slate-800 capitalize">{bookingDetails.service_type.replace(/-/g, ' ')}</span>
                </p>
                <p className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Amount Paid:</span>
                  <span className="font-medium text-slate-800">€{bookingDetails.amount?.toFixed(2)}</span>
                </p>
                <p className="flex justify-between pt-1">
                  <span>Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-slate-800 font-semibold text-lg mb-4">🔮 What's Next?</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start">
                <span className="text-[#B8860B] mr-3 mt-1">•</span>
                <span>Confirmation email sent to your inbox</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#B8860B] mr-3 mt-1">•</span>
                <span>Tejashvini will contact you within 24 hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#B8860B] mr-3 mt-1">•</span>
                <span>Delivered readings: Receive within 48 hours</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#B8860B] mr-3 mt-1">•</span>
                <span>Live consultations: We will confirm your exact time</span>
              </li>
            </ul>
          </div>

          {/* Contact Info - Phone Removed */}
          <div className="mb-8">
            <p className="text-slate-500 mb-4">Questions? Feel free to reach out:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
              <a href="mailto:bathejatejashvini@gmail.com" className="flex items-center justify-center text-[#B8860B] hover:text-[#8B6508] transition-colors font-medium">
                <Mail size={16} className="mr-2" />
                bathejatejashvini@gmail.com
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-[#B8860B] hover:bg-[#8B6508] text-white rounded-xl px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Home size={18} className="mr-2" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;