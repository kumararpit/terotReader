import React from 'react';
import { siteInfo } from '../mock';
import { Mail, Youtube, Heart } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full relative py-8 mt-12">
      {/* Full-width glass effect strip */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-xl border-t border-white/30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Brand - Minimal */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-heading font-semibold text-[#2F2A4D] tracking-tight">
              {siteInfo.brandName}
            </h3>
            <p className="text-[#3F3A52] text-[12px] font-medium italic mt-1">
              Illuminating your path with clarity.
            </p>
          </div>

          {/* Minimal Links */}
          <nav className="flex items-center gap-6 text-[13px] font-semibold text-[#2F2A4D]">
            <a href="#about" className="hover:text-[#9D72FF] transition-colors">About</a>
            <a href="#services" className="hover:text-[#9D72FF] transition-colors">Services</a>
            <a href="#faq" className="hover:text-[#9D72FF] transition-colors">FAQ</a>
            <a href={`mailto:${siteInfo.email}`} className="hover:text-[#9D72FF] transition-colors">Contact</a>
          </nav>

          {/* Social Icons - Clean Row */}
          <div className="flex items-center space-x-5">
            <a href={siteInfo.social.youtube} target="_blank" rel="noopener noreferrer" className="text-[#9D72FF] hover:text-[#2F2A4D] transition-colors">
              <Youtube size={18} />
            </a>
            <a href={`mailto:${siteInfo.email}`} className="text-[#9D72FF] hover:text-[#2F2A4D] transition-colors">
              <Mail size={18} />
            </a>
            <a href={siteInfo.social.tiktok} target="_blank" rel="noopener noreferrer" className="text-[#9D72FF] hover:text-[#2F2A4D] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Ultra-slim Copyright Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] uppercase tracking-widest text-[#5A5670] font-bold">
          <p>© {currentYear} {siteInfo.brandName}</p>
          <div className="flex items-center space-x-1">
            <span>By Tejashvini</span>
            <Heart size={8} className="text-[#9D72FF] fill-current" />
            <span>Seekers of Truth</span>
          </div>
        </div>
      </div>
    </footer>
  );
};