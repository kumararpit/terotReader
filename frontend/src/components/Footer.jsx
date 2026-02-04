import React from 'react';
import { siteInfo } from '../mock';
import { Mail, Youtube, Heart, Sparkles } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full relative py-16 mt-0 bg-black text-foreground">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">

          {/* Column 1: Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-semibold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={20} className="text-primary" />
              {siteInfo.brandName}
            </h3>
            <p className="text-primary-foreground text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Guiding you toward clarity and purpose through the ancient wisdom of Tarot.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <nav className="flex flex-col space-y-2 text-primary-foreground">
              <a href="#home" className="hover:text-white transition-colors">Home</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Legal</h4>
            <nav className="flex flex-col space-y-2 text-primary-foreground">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a>
            </nav>
          </div>

          {/* Column 4: Get in Touch */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Get in Touch</h4>
            <div className="flex flex-col space-y-3 text-primary-foreground items-center md:items-start">
              <a href={`mailto:${siteInfo.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={16} />
                {siteInfo.email}
              </a>
              <div className="flex items-center gap-4 mt-2">
                <a href={siteInfo.social.youtube} className="bg-white/10 p-2 rounded-full hover:bg-white hover:text-black transition-colors text-primary-foreground">
                  <Youtube size={18} />
                </a>
                <a href={siteInfo.social.tiktok} className="bg-white/10 p-2 rounded-full hover:bg-white hover:text-black transition-colors text-primary-foreground">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <title>TikTok</title>
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Ultra-slim Copyright Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-primary-foreground uppercase tracking-wider">
          <p>© {currentYear} {siteInfo.brandName}. All rights reserved.</p>
          <div className="flex items-center space-x-1 mt-4 md:mt-0">
            <span>Made with</span>
            <Heart size={10} className="text-red-500 fill-current" />
            <span>for the Soul</span>
          </div>
        </div>
      </div>
    </footer>
  );
};