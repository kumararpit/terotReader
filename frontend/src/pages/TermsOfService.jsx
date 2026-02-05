import React from 'react';
import { siteInfo } from '../mock';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-8">Terms of Service</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                    <p className="leading-relaxed text-foreground/80">
                        By accessing and using {siteInfo.brandName}, you accept and agree to be bound by the terms and provision of this agreement.
                        In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
                    <p className="leading-relaxed text-foreground/80">
                        {siteInfo.brandName} provides tarot reading services for entertainment and spiritual guidance purposes.
                        Readings are subject to interpretation and should not be taken as absolute.
                        We do not guarantee specific results or accuracy of any reading.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">3. User Responsibilities</h2>
                    <p className="leading-relaxed text-foreground/80">
                        You agree to use the site and services for lawful purposes only. You are responsible for maintaining the confidentiality
                        of your personal information provided during booking.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">4. Payments and Refunds</h2>
                    <p className="leading-relaxed text-foreground/80">
                        All payments are due upon booking. Refund policies are as stated on our booking page.
                        Generally, cancellations made within 24 hours of the appointment time may not be eligible for a full refund.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">5. Disclaimer</h2>
                    <p className="leading-relaxed text-foreground/80">
                        Tarot readings are for entertainment purposes only and should not replace professional medical, legal, or financial advice.
                        {siteInfo.brandName} is not responsible for any decisions made based on a reading.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">6. Changes to Terms</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We reserve the right to modify these terms from time to time at our sole discretion. Therefore, you should review this page periodically.
                        Your continued use of the website after any such changes constitutes your acceptance of the new Terms of Service.
                    </p>
                </section>

                <p className="text-sm text-gray-500 pt-8">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default TermsOfService;
