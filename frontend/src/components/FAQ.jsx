import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { faqs } from '../mock';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

export const FAQ = () => {
  return (
    <section id="faq" className="section relative py-32 overflow-hidden bg-background">
      <div className="container mx-auto px-6 relative z-10">

        {/* Section Header - Editorial Style */}
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase block mb-4">
            Common Inquiries
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-primary mb-6">
            Seeking clarity? <br />
            <span className="italic font-light text-slate-500">We have answers.</span>
          </h2>
          <p className="text-lg text-slate-600 font-light leading-relaxed">
            Every journey begins with a question. Here are some of the most common things seekers ask before their first reading.
          </p>
        </div>

        {/* FAQ Accordion - Minimalist Editorial */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-0">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${faq.id}`}
                className="border-b border-slate-200/60 last:border-none"
              >
                <AccordionTrigger className="group py-6 text-left hover:no-underline transition-all duration-300">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-heading font-medium text-primary group-data-[state=open]:text-slate-900 pr-8 leading-snug">
                      {faq.question}
                    </span>
                    {/* Icons removed as requested */}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-8 pt-2">
                  <p className="text-slate-600 leading-relaxed text-[16px] font-light max-w-2xl">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 fade-in-up">
          <p className="text-slate-500 font-light text-sm tracking-wide">
            STILL HAVE QUESTIONS? <a href="mailto:bathejatejashvini@gmail.com" className="text-primary font-medium hover:opacity-70 border-b border-primary/20 pb-0.5 transition-all">REACH OUT DIRECTLY</a>
          </p>
        </div>
      </div>
    </section>
  );
};