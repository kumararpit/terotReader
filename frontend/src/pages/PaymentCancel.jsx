import React from 'react';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#151515] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-[#1a1a3e]/60 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-8 md:p-12 text-center">
          {/* Cancel Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="text-red-500" size={48} />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-400 mb-6">
            Your booking was not completed
          </p>

          {/* Information */}
          <div className="bg-[#2D2463]/30 border border-[#D4AF37]/20 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-white font-semibold text-lg mb-4">What happened?</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>You cancelled the payment process</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>No charges have been made to your account</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#D4AF37] mr-2">•</span>
                <span>Your booking has not been confirmed</span>
              </li>
            </ul>
          </div>

          {/* Reassurance */}
          <div className="bg-[#2D2463]/30 border border-[#D4AF37]/20 rounded-lg p-6 mb-8">
            <p className="text-gray-300 leading-relaxed">
              Don't worry! You can try booking again whenever you're ready. 
              If you experienced any issues, please contact us and we'll be happy to assist you.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/#booking')}
              className="bg-[#D4AF37] hover:bg-[#FFD700] text-black rounded-full px-8 py-3 font-semibold uppercase text-sm tracking-wider transition-all duration-300"
            >
              <ArrowLeft size={18} className="mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="btn-secondary border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-full px-8 py-3 font-semibold uppercase text-sm tracking-wider transition-all duration-300"
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

export default PaymentCancel;