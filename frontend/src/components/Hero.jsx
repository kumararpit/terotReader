import React from 'react';
import { Button } from './ui/button';
import { Sparkles, Star } from 'lucide-react';
import { siteInfo, images } from '../mock';

export const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={images.hero}
          alt="Tarot Card Reading"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#151515]/80 via-[#E3EEF9]/10 to-[#151515]/90" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <Star className="absolute top-20 left-10 text-[#4A90E2] opacity-20 animate-pulse" size={24} />
        <Sparkles className="absolute top-40 right-20 text-[#7AB6F4] opacity-30 animate-pulse" size={32} style={{ animationDelay: '1s' }} />
        <Star className="absolute bottom-32 left-1/4 text-[#4A90E2] opacity-25 animate-pulse" size={20} style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute bottom-20 right-1/3 text-[#7AB6F4] opacity-20 animate-pulse" size={28} style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-20 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#E3EEF9]/50 backdrop-blur-sm border border-[#4A90E2]/30 rounded-full px-6 py-2 mb-8 animate-fade-in">
            <Sparkles className="text-[#4A90E2]" size={16} />
            <span className="text-[#4A90E2] text-sm font-medium uppercase tracking-wider">
              {siteInfo.experience} of Experience
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="display-heading text-white mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {siteInfo.readerName}
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-[#7AB6F4] font-light mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {siteInfo.tagline}
          </p>

          {/* Description */}
          <p className="body-large text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {siteInfo.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <a href="#services">
              <Button className="btn-primary bg-[#4A90E2] hover:bg-[#7AB6F4] text-white rounded-full px-8 py-6 text-base font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#4A90E2]/50">
                Explore Services
              </Button>
            </a>
            <a href="#about">
              <Button className="btn-secondary border-[#4A90E2] text-[#7AB6F4] hover:bg-[#4A90E2] hover:text-white rounded-full px-8 py-6 text-base font-semibold uppercase tracking-wider transition-all duration-300">
                About Me
              </Button>
            </a>
          </div>

          {/* Languages */}
          <div className="mt-12 flex items-center justify-center space-x-4 text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '1s' }}>
            <span>Available in:</span>
            {siteInfo.languages.map((lang, index) => (
              <span key={lang} className="text-[#7AB6F4] font-medium">
                {lang}{index < siteInfo.languages.length - 1 && ' •'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-[#4A90E2] rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-[#4A90E2] rounded-full animate-pulse" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};