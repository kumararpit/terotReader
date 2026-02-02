import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { HeroLight } from '../components/HeroLight';
import { About } from '../components/About';
import { ServicesLight } from '../components/ServicesLight';

import { Testimonials } from '../components/Testimonials';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';

const Home = () => {
  useEffect(() => {
    // Scroll reveal animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroLight />
        <div className="scroll-reveal">
          <About />
        </div>
        <div className="scroll-reveal">
          <ServicesLight />
        </div>

        <div className="scroll-reveal">
          <Testimonials />
        </div>
        <div className="scroll-reveal">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;