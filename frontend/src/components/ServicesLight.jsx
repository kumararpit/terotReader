import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Video, Sparkles, ArrowRight, Stars } from 'lucide-react';
import { services } from '../mock';

export const ServicesLight = () => {
  const iconMap = {
    Mail: Mail,
    Phone: Video,
    Sparkles: Sparkles
  };

  return (
    <section id="services" className="section relative py-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-[#2F2A4D] mb-6">
            Choose Your <span className="text-[#9D72FF]">Spiritual Journey</span>
          </h2>
          <p className="text-lg text-[#5A5670] max-w-2xl mx-auto font-light leading-relaxed">
            Professional intuitive guidance tailored to your needs.
            Select the reading style that resonates most with your seeking heart.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#9D72FF] to-transparent mx-auto mt-8 opacity-20" />
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon];

            // Determine image source based on service type
            let imageSrc;
            if (service.title.includes("Delivered")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/service-deck.png';
            } else if (service.title.includes("Live")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/live-call.png';
            } else if (service.title.includes("Aura")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/service-aura.png';
            } else {
              imageSrc = process.env.PUBLIC_URL + '/assets/uploads/img4.png';
            }

            return (
              <div
                key={service.id}
                className="group relative flex flex-col h-full transition-all duration-500 hover:-translate-y-2"
              >
                {/* Glass Background Shell */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] shadow-xl shadow-purple-900/5 group-hover:shadow-purple-500/10 transition-all duration-500" />

                <div className="relative p-8 flex flex-col h-full">
                  {/* Service Image Wrapper */}
                  <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl border border-white/80 shadow-inner bg-white/20">
                    <img
                      src={imageSrc}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    {/* Soft gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2F2A4D]/20 to-transparent opacity-60" />

                    {/* Subtle aesthetic accent: Pulsing Star */}
                    <div className="absolute top-4 right-4 text-[#9D72FF] drop-shadow-[0_0_8px_rgba(157,114,255,1)] animate-pulse">
                      <Stars size={18} fill="currentColor" />
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100/80 flex items-center justify-center text-[#9D72FF]">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-heading font-semibold text-[#2F2A4D]">
                      {service.title}
                    </h3>
                  </div>

                  {/* Full Description */}
                  <p className="text-[#3F3A52] mb-8 leading-relaxed font-medium text-[14px] italic">
                    {service.description}
                  </p>

                  {/* Features List - Redesigned with thematic icons */}
                  <div className="flex-grow space-y-4 mb-10">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-[14px] text-[#2F2A4D]">
                        <div className="flex-shrink-0 mt-1">
                          <Sparkles size={14} className="text-[#9D72FF]" />
                        </div>
                        <span className="font-semibold leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Area - Refined, more elegant button size */}
                  <div className="pt-6 border-t border-white/40 mt-auto flex justify-center">
                    <Link to={`/booking/${service.id}`} className="w-full max-w-[200px]">
                      <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#B9A3E6] to-[#9D80D6] hover:from-[#9D80D6] hover:to-[#8E6DCF] text-white py-3 rounded-full font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 transform active:scale-95 group/btn">
                        <span>Book Now</span>
                        <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
