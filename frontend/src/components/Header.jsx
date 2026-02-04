import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

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
            ? 'block py-3 text-lg border-b border-primary/5'
            : 'hover:text-primary transition-colors duration-200'
            } text-primary font-medium`}
        >
          {link.label}
        </a>
      ))}
    </>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${isScrolled
        ? 'bg-background/80 backdrop-blur-md shadow-sm border-primary/5'
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
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden ml-auto">
              <Button variant="ghost" size="icon" className="text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background text-foreground border-l border-primary/5 w-[280px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <NavLinks mobile onLinkClick={() => setIsOpen(false)} />
                <a href="/#services" className="mt-4" onClick={() => setIsOpen(false)}>
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