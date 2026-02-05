import React from 'react';
import { siteInfo } from '../mock';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-8">Privacy Policy</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
                    <p className="leading-relaxed text-foreground/80">
                        Welcome to {siteInfo.brandName}. We respect your privacy and are committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website
                        and use our tarot reading services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We may collect the following types of information:
                    </p>
                    <ul className="list-disc list-inside text-foreground/80 ml-4 space-y-2">
                        <li><strong>Personal Information:</strong> Name, email address, and birth details provided during booking.</li>
                        <li><strong>Payment Information:</strong> Transaction details securely processed by our payment providers.</li>
                        <li><strong>Usage Data:</strong> Information about how you use our website, including IP address and browser type.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We use your information to:
                    </p>
                    <ul className="list-disc list-inside text-foreground/80 ml-4 space-y-2">
                        <li>Provide and personalize your tarot readings.</li>
                        <li>Process payments and send booking confirmations.</li>
                        <li>Communicate with you regarding your appointments and services.</li>
                        <li>Improve our website and customer service.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We implement appropriate security measures to protect your personal information. However, no method of transmission
                        over the Internet is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">5. Contact Us</h2>
                    <p className="leading-relaxed text-foreground/80">
                        If you have any questions about this Privacy Policy, please contact us at: <br />
                        <a href={`mailto:${siteInfo.email}`} className="text-primary hover:underline">{siteInfo.email}</a>
                    </p>
                </section>

                <p className="text-sm text-gray-500 pt-8">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
