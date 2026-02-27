import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import confetti from 'canvas-confetti';
import { useLocation } from 'react-router-dom';

const OfferModal = () => {
    const [offer, setOffer] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAndFetchOffer = async () => {
            // 1. Skip ONLY if on an Admin page
            if (location.pathname.startsWith('/admin')) return;

            // 2. Check session storage next
            if (sessionStorage.getItem('offerSeen')) return;

            try {
                let baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
                baseURL = baseURL.replace(/\/api\/?$/, '').replace(/\/$/, '');

                const res = await axios.get(`${baseURL}/api/settings/offer`);
                if (res.data && res.data.is_active && res.data.discount_percent > 0) {
                    setOffer(res.data);
                    // Delay slightly for effect
                    setTimeout(() => {
                        setIsOpen(true);
                        // Trigger poppers from bottom corners
                        fireConfetti();
                    }, 1500);
                }
            } catch (error) {
                console.error("Failed to fetch offer for modal", error);
            }
        };

        checkAndFetchOffer();
    }, [location.pathname]);

    const fireConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ['#B8860B', '#FCFAF8', '#111111']; // Gold, Cream, Black

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 1 }, // Bottom Left
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 1 }, // Bottom Right
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('offerSeen', 'true');
    };

    if (!isOpen || !offer) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-700">
            <div className="relative bg-[#111111] rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-500 border border-[#D4AF37]/20 group">

                {/* Layered Glow Effects - Sophisticated Soft Light */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    {/* Primary soft glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[80px]" />
                    {/* Secondary accent glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[60px]" />
                </div>

                {/* Close Button - More Breathing Room */}
                <button
                    onClick={handleClose}
                    className="absolute top-7 right-7 z-20 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all duration-300 hover:rotate-90"
                >
                    <X size={18} />
                </button>

                <div className="pt-14 px-8 pb-10 text-center relative z-10 flex flex-col items-center">

                    {/* Discount Circle - Refined Typography & Color */}
                    <div className="relative mb-8 group-hover:scale-105 transition-transform duration-700">
                        {/* Layered Shadows for non-fuzzy glow */}
                        <div className="absolute inset-0 bg-[#D4AF37] rounded-full opacity-20 blur-xl animate-pulse-slow"></div>

                        <div className="relative w-28 h-28 bg-gradient-to-br from-[#D4AF37] to-[#C59D5F] rounded-full flex items-center justify-center shadow-[0_0_30px_-5px_rgba(212,175,55,0.3)] border border-[#FCFAF8]/10">
                            <div className="text-center flex flex-col items-center justify-center h-full">
                                <span className="block text-4xl font-heading font-medium text-[#111111] leading-none mt-1">
                                    {offer.discount_percent}%
                                </span>
                                <span className="block text-[10px] font-bold tracking-[0.3em] uppercase text-[#111111]/80 mt-1 pl-1">
                                    OFF
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content - Mystical & Personal */}
                    <h3 className="text-2xl font-heading font-medium text-[#FCFAF8] mb-4 tracking-wide">
                        Special Offer!
                    </h3>

                    {/* Brightened Description for Contrast */}
                    <p className="text-[#E5E5E5] mb-8 font-light leading-relaxed text-[15px] opacity-90 max-w-[90%]">
                        <span className="text-[#D4AF37] font-medium">{offer.offer_text}</span>: <span className="text-[#D4AF37] font-medium">{offer.discount_percent}% Off</span> on services
                    </p>

                    {/* Badge - Subtle & Classy */}
                    <div className="inline-flex items-center justify-center space-x-3 bg-[#D4AF37]/5 px-5 py-2 rounded-full mb-8 border border-[#D4AF37]/20">
                        <Sparkles size={12} className="text-[#D4AF37] animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]">Limited Time Only</span>
                        <Sparkles size={12} className="text-[#D4AF37] animate-pulse" />
                    </div>



                    {/* Action Button - Champagne Gold Gradient */}
                    <Button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C59D5F] hover:from-[#E6C288] hover:to-[#D4AF37] text-[#111111] font-extrabold py-6 text-[15px] tracking-wide rounded-xl shadow-[0_10px_20px_-10px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-0.5 relative overflow-hidden group/btn"
                    >
                        <span className="relative z-10">
                            Claim My Reading
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />
                    </Button>

                    <button
                        onClick={handleClose}
                        className="mt-6 text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors border-b border-transparent hover:border-white/20 pb-0.5"
                    >
                        No thanks, I'll pay full price
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferModal;
