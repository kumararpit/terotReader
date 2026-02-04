import React from 'react';
import { Heart, Shield, Sparkles, Quote } from 'lucide-react';
import { siteInfo } from '../mock';

export const About = () => {
  const features = [
    {
      icon: Heart,
      text: "Safe & respectful sessions"
    },
    {
      icon: Shield,
      text: "Confidential & compassionate guidance"
    },
    {
      icon: Sparkles,
      text: "Honest & empowering support"
    }
  ];

  return (
    <section id="about" className="section relative py-20 pb-32 overflow-hidden bg-secondary/30">
      {/* Decorative blurred blobs background */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-heading text-primary drop-shadow-sm font-medium">
            Guiding you toward <br />
            <span className="text-primary italic">clarity and purpose</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-6 opacity-30" />
        </div>

        {/* Main Content Card - Redesigned Glass Panel */}
        <div className="max-w-6xl mx-auto backdrop-blur-md bg-white/60 border border-white/60 rounded-[48px] shadow-2xl overflow-hidden fade-in-up shadow-primary/5">
          <div className="flex flex-col md:flex-row items-center">

            {/* Image Side - Elegant & Balanced */}
            <div className="w-full md:w-1/2 p-8 md:p-12">
              <div className="relative group">
                {/* Decorative Frame */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[42px] blur-sm group-hover:blur-md transition-all duration-500" />

                <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-[40px] overflow-hidden border-2 border-white/80 shadow-xl shadow-primary/10">
                  <img
                    src={process.env.PUBLIC_URL + '/assets/aboutme.jpeg'}
                    alt="Tejashvini Batheja"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Floating "Badge" or accent */}
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform duration-500 border border-white">
                  <Quote className="text-primary w-10 h-10 opacity-70" />
                </div>
              </div>
            </div>

            {/* Content Side - Refined Typography */}
            <div className="w-full md:w-1/2 p-8 md:p-12 md:pl-4 text-left">
              <div className="space-y-6 px-4 md:px-0">
                <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-primary text-sm font-medium tracking-wide mb-2 uppercase">
                  Meet Your Guide
                </div>

                <h3 className="text-3xl md:text-4xl font-heading text-primary font-semibold leading-tight">
                  I'm Tejashvini Batheja
                </h3>

                <p className="text-xl text-primary/80 font-medium leading-relaxed italic border-l-4 border-primary/30 pl-6 py-2">
                  "Helping you navigate life with clarity, confidence, and compassion."
                </p>

                <div className="space-y-4 text-primary text-lg leading-relaxed font-normal opacity-90">
                  <p>
                    With 6 years of professional experience, I view tarot as a powerful tool for insight and self-reflection. My mission is to help you understand your present situation and recognize patterns that shape your journey.
                  </p>
                  <p>
                    I focus on helping you connect with your inner intuition, empowering you to make choices that align with your personal growth and long-term well-being.
                  </p>
                  <p className="text-base font-light">
                    Every session is a safe, respectful, and confidential space where your concerns are honored with honest and compassionate guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Strip Footer */}
          <div className="bg-primary/5 border-t border-white/40 p-8 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-primary transition-all duration-300">
                      <Icon className="text-primary group-hover:text-white w-6 h-6 transition-colors duration-300" strokeWidth={1.5} />
                    </div>
                    <span className="text-primary font-medium text-sm lg:text-base leading-tight">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};