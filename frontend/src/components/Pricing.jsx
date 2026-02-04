import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { pricingPackages } from '../mock';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const Pricing = () => {
  return (
    <section id="pricing" className="section relative">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#151515] via-[#2D2463] to-[#151515] opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="service-tag bg-[#FFD1E7] text-black rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="section-heading text-white mt-6">
            Investment in Your <span className="text-[#FFD700]">Spiritual Growth</span>
          </h2>
          <p className="body-text text-muted-foreground max-w-2xl mx-auto mt-4">
            Transparent pricing for transformative guidance. All sessions require advance payment to confirm booking.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPackages.map((category, index) => (
            <div
              key={category.id}
              className="card rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-500"
              style={{
                backgroundColor: category.bgColor,
                color: category.textColor,
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* Card Header */}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2" style={{ color: category.textColor }}>
                  {category.type}
                </h3>
                <div className="h-1 w-16 bg-current opacity-50 mb-6" />

                {/* Package Options */}
                <div className="space-y-4">
                  {category.packages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className={`relative p-5 rounded-lg transition-all duration-300 ${pkg.popular
                          ? 'bg-black/20 border-2 border-current shadow-lg scale-105'
                          : 'bg-black/10 border border-current/30 hover:bg-black/15'
                        }`}
                    >
                      {pkg.popular && (
                        <Badge className="absolute -top-3 right-4 bg-black text-white rounded-full px-3 py-1 text-xs font-semibold uppercase">
                          Popular
                        </Badge>
                      )}

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium opacity-80 mb-1">
                            {pkg.questions || pkg.duration || pkg.service}
                          </p>
                          <p className="text-3xl font-bold">
                            {pkg.price}
                          </p>
                        </div>
                        <Check size={24} className="opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Book Button */}
                <a href="#booking" className="block mt-6">
                  <Button
                    className="w-full rounded-full py-6 font-semibold uppercase text-sm tracking-wider transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: category.textColor,
                      color: category.bgColor
                    }}
                  >
                    Book Now
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-[#1a1a3e]/50 backdrop-blur-sm border border-[#D4AF37]/30 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <Sparkles className="text-[#D4AF37] flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-white font-semibold text-lg mb-3">Important Information</h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start">
                    <span className="text-[#D4AF37] mr-2">•</span>
                    <span>All delivered readings include 3 follow-up questions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D4AF37] mr-2">•</span>
                    <span>Emergency/priority slots available with 25% additional charge</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D4AF37] mr-2">•</span>
                    <span>Payment methods: UPI, Bank Transfer, PayPal</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D4AF37] mr-2">•</span>
                    <span>Working hours: {"Mon-Fri, 9:00 AM - 5:00 PM EST"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D4AF37] mr-2">•</span>
                    <span>Delivered readings completed within 48 hours</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};