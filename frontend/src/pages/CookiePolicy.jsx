import React from 'react';
import { siteInfo } from '../mock';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-8">Cookie Policy</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">1. What Are Cookies?</h2>
                    <p className="leading-relaxed text-foreground/80">
                        Cookies are small text files that are stored on your computer or mobile device when you visit a website.
                        They allow the website to remember your actions and preferences (such as login, language, font size and other display preferences)
                        over a period of time.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">2. How We Use Cookies</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We use cookies to:
                    </p>
                    <ul className="list-disc list-inside text-foreground/80 ml-4 space-y-2">
                        <li>Ensure the website functions correctly.</li>
                        <li>Analyze how our visitors use the website.</li>
                        <li>Remember your preferences and settings.</li>
                        <li>Facilitate the booking and payment process.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">3. Types of Cookies We Use</h2>
                    <p className="leading-relaxed text-foreground/80">
                        <strong>Essential Cookies:</strong> These are necessary for the website to function and cannot be switched off in our systems.<br />
                        <strong>Analytics Cookies:</strong> These allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">4. Managing Cookies</h2>
                    <p className="leading-relaxed text-foreground/80">
                        You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer
                        and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually
                        adjust some preferences every time you visit a site and some services and functionalities may not work.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">5. Changes to This Policy</h2>
                    <p className="leading-relaxed text-foreground/80">
                        We may update our Cookie Policy from time to time. We encourage you to review this policy periodically for any changes.
                    </p>
                </section>

                <p className="text-sm text-gray-500 pt-8">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default CookiePolicy;
