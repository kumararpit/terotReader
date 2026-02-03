import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/#home' },
    { label: 'About', href: '/#about' },
    { label: 'Services', href: '/#services' },
    { label: 'Testimonials', href: '/#testimonials' },
    { label: 'FAQ', href: '/#faq' }
  ];

  const NavLinks = ({ mobile = false, onLinkClick }) => (
    <>
      {navLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onClick={onLinkClick}
          className={`${mobile
            ? 'block py-3 text-lg border-b border-gray-200'
            : 'hover:text-blue-500 transition-colors duration-200'
            } text-slate-600 font-medium`}
        >
          {link.label}
        </a>
      ))}
    </>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${isScrolled
        ? 'bg-white/80 backdrop-blur-md shadow-sm border-white/20'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">

          {/* Desktop Navigation - Left Side */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLinks />
          </nav>

          {/* Contact Me Button - Right Side */}
          <div className="hidden md:block">
            <a href="/#services">
              <Button className="px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md hover:shadow-lg transition-all">
                Contact Me
              </Button>
            </a>
          </div>

          {/* Mobile Menu Trigger - Right Side */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden ml-auto">
              <Button variant="ghost" size="icon" className="text-blue-500">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white text-slate-800 border-l border-gray-200 w-[280px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <NavLinks mobile onLinkClick={() => document.querySelector('[data-state="open"]')?.click()} />
                <a href="/#services" className="mt-4">
                  <Button className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                    Contact Me
                  </Button>
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};