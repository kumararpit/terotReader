import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { testimonials as mockTestimonials } from '../mock';
import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/api';

export const Testimonials = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/testimonials`);
        if (res.data && res.data.length > 0) {
          setData(res.data);
        } else {
          setData(mockTestimonials);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials', error);
        setData(mockTestimonials);
      }
    };
    fetchData();
  }, []);

  return (
    <section id="testimonials" className="section relative py-20 pb-32">
      <div className="container mx-auto px-4 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-heading text-[var(--color-text-heading)] drop-shadow-sm flex items-center justify-center gap-4">
            <Sparkles className="text-[#FFD700] w-8 h-8" fill="#FFD700" />
            <span className="font-medium">What Clients Say</span>
            <Sparkles className="text-[#FFD700] w-8 h-8" fill="#FFD700" />
          </h2>
        </div>

        {/* Main Content - Glass Border Card */}
        <div className="glass-panel max-w-6xl mx-auto p-1 rounded-[40px] border border-white/60 bg-white/30 backdrop-blur-sm">
          <div className="grid md:grid-cols-12 gap-6 p-6 md:p-8">

            {/* Left Side - Image */}
            <div className="md:col-span-4 relative h-[400px] md:h-auto min-h-[500px]">
              <div className="absolute inset-0 rounded-[32px] overflow-hidden shadow-lg border border-white/40">
                <img
                  src={process.env.PUBLIC_URL + '/assets/uploads/img4.png'}
                  alt="Client Moments"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-purple-900/10 mix-blend-overlay" />
              </div>
            </div>

            {/* Right Side - Reviews Stack */}
            <div className="md:col-span-8 flex flex-col space-y-5">
              {data.slice(0, 3).map((testimonial, index) => (
                <div
                  key={testimonial.id || index}
                  className="glass-card p-6 md:p-8 rounded-[24px] bg-white/60 border border-white/60 shadow-sm relative"
                >
                  <span className="text-6xl absolute top-4 left-6 text-[#9D72FF]/40 font-serif leading-none">“</span>
                  <div className="relative z-10 pl-4">
                    <p className="text-[#4A4563] text-lg leading-relaxed mb-3">
                      {testimonial.text}
                    </p>
                    <div className="font-heading text-[#9D72FF] text-right font-medium">
                      — {testimonial.author || 'Happy Client'}
                    </div>
                  </div>
                </div>
              ))}


            </div>

          </div>
        </div>

      </div>
    </section>
  );
};