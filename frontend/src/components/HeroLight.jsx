import React from "react";
import { Sparkles, Lock, MessagesSquare, Mail } from "lucide-react";

export const HeroLight = () => {
  return (
    <section id="home" className="hero-root relative min-h-[90vh] flex items-center bg-background overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-accent/20 to-white/0 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* TEXT CONTENT (Left - Span 7) */}
          <div className="lg:col-span-6 space-y-10 text-center lg:text-left">
            <div className="space-y-6">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Tarot Reader & Intuitive Guide
              </span>
              <h1 className="text-5xl lg:text-7xl font-heading font-medium text-primary leading-tight">
                Clarity for the <br />
                <span className="italic font-light text-primary/80">modern soul.</span>
              </h1>
              <p className="text-lg text-primary font-light leading-relaxed max-w-lg mx-auto lg:mx-0">
                Tarot is a mirror, not a map. Discover guidance, emotional clarity, and empowerment through intuitive readings designed to help you navigate life with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <a href="#services" className="px-10 py-4 bg-primary text-primary-foreground rounded-full text-sm font-medium tracking-wide hover:bg-primary/90 transition-all shadow-xl shadow-primary/10">
                BOOK A READING
              </a>
              <a href="#about" className="px-10 py-4 bg-transparent border border-primary text-primary rounded-full text-sm font-medium tracking-wide hover:bg-background hover:border-primary/80 transition-all">
                MEET TEJASHVINI
              </a>
            </div>

            {/* Minimal Trust Bar */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 text-xs font-medium text-primary-foreground tracking-wider uppercase">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground"></span> 6+ Years Experience
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground"></span> Confidential
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground"></span> English & Hindi
              </span>
            </div>
          </div>

          {/* IMAGE CONTENT (Right - Span 5) */}
          <div className="lg:col-span-6 lg:col-start-8 relative">
            <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[3.5/4.5] ml-auto">
              <div className="absolute inset-0 bg-background rounded-[40px] shadow-2xl shadow-primary/5 overflow-hidden transform hover:scale-[1.01] transition-transform duration-700 ease-out border-4 border-background">
                <img
                  src={process.env.PUBLIC_URL + "/assets/homepage.jpeg"}
                  alt="Tejashvini Batheja"
                  className="w-full h-full object-cover filter grayscale-[10%] contrast-[1.05]"
                />

                {/* Editorial Badge */}
                <div className="absolute bottom-6 left-6 bg-background/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Sparkles strokeWidth={1.5} className="w-5 h-5 text-primary-foreground" />
                    <span className="text-sm font-medium text-primary">Intuitive Guidance</span>
                  </div>
                </div>
              </div>

              {/* Abstract Decor */}
              <div className="absolute -z-10 top-1/2 -right-12 w-64 h-64 bg-accent rounded-full blur-3xl opacity-60"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
