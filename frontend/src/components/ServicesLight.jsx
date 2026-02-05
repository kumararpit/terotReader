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
    <section id="services" className="section relative py-32 overflow-hidden bg-background">

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header - Editorial Style */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase block mb-4">
            Offerings
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-primary mb-6">
            Guidance tailored to your <br />
            <span className="italic font-light text-primary/80">inner journey.</span>
          </h2>
          <p className="text-lg text-primary/90 font-light leading-relaxed">
            Select the reading style that resonates most with your seeking heart.
          </p>
        </div>

        {/* Services Grid - Reference Layout: Two-Tone Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon];

            // Determine image source based on service type
            let imageSrc;
            if (service.title.includes("Delivered")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/deliveredreading.jpeg';
            } else if (service.title.includes("Live")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/livereading.jpeg';
            } else if (service.title.includes("Aura")) {
              imageSrc = process.env.PUBLIC_URL + '/assets/service-aura.png';
            } else {
              imageSrc = process.env.PUBLIC_URL + '/assets/uploads/img4.png';
            }

            return (
              <div
                key={service.id}
                className="group relative flex flex-col h-full bg-card rounded-[32px] overflow-hidden border border-border/40 hover:border-border/80 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5"
              >
                {/* Image Area - Top Half */}
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />

                  {/* Minimal Badge Top-Left */}
                  <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center text-primary shadow-sm">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content Area - Bottom Half */}
                <div className="p-8 pb-10 flex flex-col flex-grow bg-white">

                  <h3 className="text-2xl font-heading font-medium text-primary mb-4 leading-tight">
                    {service.title}
                  </h3>

                  <p className="text-primary/80 mb-8 leading-relaxed font-light text-[15px]">
                    {service.description}
                  </p>

                  {/* Divider */}
                  <div className="w-full h-px bg-primary/5 mb-6" />

                  {/* Simple Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {service.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-2 block flex-shrink-0" />
                        <span className="leading-relaxed font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer Action Area: Price Left, Link Right */}
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-transparent">
                    <div className="flex flex-row items-baseline gap-2">
                      <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                        Starting from
                      </span>
                      <span className="text-lg font-heading font-medium text-primary">
                        €{service.price}
                      </span>
                    </div>

                    <Link to={`/booking/${service.id}`} className="group/btn inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/70 transition-colors">
                      <span>Book Session</span>
                      <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
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
