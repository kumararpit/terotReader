import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { testimonials as mockTestimonials } from '../mock';
import { Button } from './ui/button';
import { Sparkles, User } from 'lucide-react';

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
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading text-slate-800 drop-shadow-sm flex items-center justify-center gap-4 mb-4">
            <Sparkles className="text-primary w-8 h-8" fill="currentColor" />
            <span className="font-medium">Client Love</span>
            <Sparkles className="text-primary w-8 h-8" fill="currentColor" />
          </h2>
          <p className="text-lg text-slate-600">Stories of clarity and connection</p>
        </div>

        {/* 3-Card Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {data.slice(0, 3).map((testimonial, index) => (
            <div
              key={testimonial.id || index}
              className="group relative p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 flex flex-col"
            >
              {/* Quote Icon Background */}
              <div className="absolute top-6 right-6 text-secondary/50 group-hover:text-primary/10 transition-colors duration-500">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.01697 21L5.01697 18C5.01697 16.8954 5.9124 16 7.01697 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H6.01697C5.46468 8 5.01697 8.44772 5.01697 9V11C5.01697 11.5523 4.56925 12 4.01697 12H3.01697V5H13.017V15C13.017 18.3137 10.3307 21 7.01697 21H5.01697Z" />
                </svg>
              </div>

              <div className="relative z-10 flex-grow">
                {/* Stars */}
                <div className="flex space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-slate-600 text-lg leading-relaxed mb-6 font-medium italic">
                  "{testimonial.text}"
                </p>
              </div>
            </div>

          ))}
        </div>

      </div>
    </section >
  );
};