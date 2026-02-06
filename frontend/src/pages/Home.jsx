import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { HeroLight } from '../components/HeroLight';
import { About } from '../components/About';
import { ServicesLight } from '../components/ServicesLight';
import { Testimonials } from '../components/Testimonials';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import LaunchCountdown from '../components/LaunchCountdown';
import dayjs from '../lib/dateUtils';

// LAUNCH CONFIGURATION
// Ensure this matches the LaunchCountdown default or is passed as prop
import { LAUNCH_DATE_UTC } from '../config/launchConfig';

// LAUNCH CONFIGURATION
// Ensure this matches the LaunchCountdown default or is passed as prop
// const LAUNCH_DATE_UTC = "2026-02-06T11:05:00Z";

const Home = () => {
  const [isLaunched, setIsLaunched] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLaunchStatus = () => {
      const now = dayjs().utc();
      const launch = dayjs(LAUNCH_DATE_UTC).utc();
      const isAfter = now.isAfter(launch);
      console.log("Check Launch:", { now: now.format(), launch: launch.format(), isAfter });
      setIsLaunched(isAfter);
      setIsChecking(false);
    };

    checkLaunchStatus();

    // Polling to ensure accurate switch around the boundary
    const interval = setInterval(checkLaunchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLaunched) {
      // Scroll reveal animation only if launched (normal home page)
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
    }
  }, [isLaunched]);

  if (isChecking) {
    return null; // Or a loading spinner
  }

  if (!isLaunched) {
    // PRE-LAUNCH: Show Countdown centered on the page
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LaunchCountdown
          targetDate={LAUNCH_DATE_UTC}
          redirectUrl="/"
          title="We Are Coming"
        />
      </div>
    );
  }

  // POST-LAUNCH: Show Main Home Page
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