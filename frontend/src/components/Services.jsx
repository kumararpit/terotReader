import React from 'react';
import { Mail, Phone, Sparkles } from 'lucide-react';
import { services, images } from '../mock';

export const Services = () => {
  const iconMap = {
    Mail: Mail,
    Phone: Phone,
    Sparkles: Sparkles
  };

  return (
    <section id="services" className="section relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="service-tag bg-[#FABFA6] text-white rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Services
          </span>
          <h2 className="section-heading text-white mt-6">
            Choose Your <span className="text-[#FABFA6]">Spiritual Journey</span>
          </h2>
          <p className="body-text text-muted-foreground max-w-2xl mx-auto mt-4">
            Whether you seek written guidance or real-time consultation, I offer personalized readings
            to illuminate your path forward.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon];
            return (
              <div
                key={service.id}
                className="card bg-[#FDD8C5]/20 backdrop-blur-sm border border-[#F49E7D]/20 rounded-xl p-8 hover:border-[#F49E7D]/60 transition-all duration-500 group hover:shadow-2xl hover:shadow-[#F49E7D]/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Service Image */}
                <div className="relative mb-6 overflow-hidden rounded-lg h-48">
                  <img
                    src={images.services[index]}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FDD8C5]/60 via-transparent to-transparent opacity-80" />
                  {/* Icon overlay */}
                  <div className="absolute top-4 right-4 bg-[#F49E7D] rounded-full p-3">
                    <Icon className="text-white" size={24} />
                  </div>
                </div>

                {/* Service Content */}
                <h3 className="card-heading text-white mb-3 group-hover:text-[#FABFA6] transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="body-text text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-muted-foreground">
                      <span className="text-[#F49E7D] mt-1">✦</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">Ready to begin your journey of self-discovery?</p>
          <a href="mailto:bathejatejashvini@gmail.com">
            <button className="btn-primary bg-[#F49E7D] hover:bg-[#FABFA6] text-white rounded-full px-8 py-4 font-semibold uppercase text-sm tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F49E7D]/50">
              Contact Me
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};