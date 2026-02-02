import React from 'react';
import { HelpCircle, Sparkles, Plus, Minus } from 'lucide-react';
import { faqs } from '../mock';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

export const FAQ = () => {
  return (
    <section id="faq" className="section relative py-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20 fade-in-up">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-100/50 text-[#9D72FF] text-sm font-medium tracking-wide mb-6 uppercase border border-purple-200/50">
            <HelpCircle size={14} />
            <span>Common Inquiries</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-[#2F2A4D] mb-6">
            Seeking <span className="text-[#9D72FF]">Clarity?</span>
          </h2>
          <p className="text-lg text-[#5A5670] max-w-2xl mx-auto font-light leading-relaxed">
            Every journey begins with a question. Here are some of the most common things
            seekers ask before their first reading.
          </p>
          <div className="after:block after:content-[''] after:w-24 after:h-1 after:bg-gradient-to-r after:from-transparent after:via-[#9D72FF] after:to-transparent after:mx-auto after:mt-8 after:opacity-20" />
        </div>

        {/* FAQ Accordion - Redesigned to be more airy and mystical */}
        <div className="max-w-4xl mx-auto space-y-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${faq.id}`}
                className="group border-none mb-4"
              >
                <div className="relative overflow-hidden rounded-[30px] transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
                  {/* Glass Background for each item */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[30px] group-data-[state=open]:bg-white/60 transition-colors duration-500" />

                  <AccordionTrigger className="relative px-8 py-6 text-left text-[#2F2A4D] hover:no-underline transition-all duration-300">
                    <div className="flex items-center space-x-4 w-full pr-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-white flex items-center justify-center text-[#9D72FF] border border-purple-100/50 group-data-[state=open]:rotate-180 transition-transform duration-500">
                        <Sparkles size={16} className="opacity-70" />
                      </div>
                      <span className="text-lg md:text-xl font-heading font-semibold text-[#2F2A4D] group-data-[state=open]:text-[#9D72FF] transition-colors">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="relative px-8 pb-8 pt-0">
                    <div className="pl-14">
                      <div className="w-full h-[1px] bg-gradient-to-r from-[#9D72FF]/20 to-transparent mb-6" />
                      <p className="text-[#3F3A52] leading-relaxed text-[16px] font-medium">
                        {faq.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA or Decorative Note */}
        <div className="text-center mt-20 fade-in-up">
          <p className="text-[#3F3A52] italic font-medium">
            Still have questions? <a href="mailto:bathejatejashvini@gmail.com" className="text-[#9D72FF] font-semibold hover:underline">Reach out directly</a> — I'm here to help.
          </p>
        </div>
      </div>
    </section>
  );
};