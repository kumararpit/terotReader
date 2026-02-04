import React from 'react';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
          {/* Cancel Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center animate-in zoom-in duration-300">
              <XCircle className="text-red-500" size={48} />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-heading">
            Payment Cancelled
          </h1>
          <p className="text-xl text-slate-500 mb-8 font-medium">
            Your booking process was not completed
          </p>

          {/* Information */}
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-slate-800 font-semibold text-lg mb-4">Summary</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>You cancelled the payment process</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>No charges have been made to your account</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Your booking slot has been released</span>
              </li>
            </ul>
          </div>

          {/* Reassurance */}
          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 mb-8">
            <p className="text-slate-600 leading-relaxed">
              Don't worry! You can try booking again whenever you're ready.
              If you experienced technical issues, please feel free to try again or contact us via email.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/#booking')}
              className="bg-[#B8860B] hover:bg-[#8B6508] text-white rounded-xl px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <ArrowLeft size={18} className="mr-2" />
              Try Booking Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-white border-2 border-slate-200 text-slate-700 hover:border-[#B8860B] hover:text-[#B8860B] rounded-xl px-8 py-4 font-semibold transition-all duration-300"
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