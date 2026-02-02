import React from "react";
import { Sparkles, Lock, MessagesSquare, Mail } from "lucide-react";

export const HeroLight = () => {
  return (
    <section id="home" className="hero-root">
      {/* ===== BACKGROUND ===== */}
      <div className="hero-bg">
        <div className="hero-clouds" />
        <div className="hero-clouds" />
        <div className="hero-sparkles" />
      </div>

      {/* ===== CONTENT ===== */}
      <div className="hero-container">
        <div className="hero-grid">
          {/* LEFT */}
          <div className="hero-text">
            <h1>
              Tarot Card <br />
              <span>Reading</span>
            </h1>

            <h2>
              Tarot Is a Powerful Tool <br />
              for Insight, Clarity & Self-Reflection
            </h2>

            <p>
              Discover guidance, emotional clarity, and empowerment through
              intuitive tarot readings designed to help you navigate life with
              confidence.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary-soft">
                Book Your Reading
              </button>
              <button className="btn-secondary-soft">
                Explore Services
              </button>
            </div>
          </div>

          {/* RIGHT — ✨ UPDATED IMAGE STYLE ✨ */}
          <div className="hero-image-wrap">
            <div className="hero-image-frame">
              <div className="hero-image">
                <img
                  src={process.env.PUBLIC_URL + "/assets/uploads/img4.png"}
                  alt="Tarot Reader"
                />
                <span className="hero-image-sparkle">✦</span>
              </div>
            </div>
          </div>

        </div>

        {/* TRUST BAR */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <Sparkles size={18} /> 6+ Years of Experience
          </div>
          <div className="trust-item">
            <Lock size={18} /> Confidential & Safe Space
          </div>
          <div className="trust-item">
            <MessagesSquare size={18} /> English & Hindi
          </div>
          <div className="trust-item">
            <Mail size={18} /> Email-Only Communication
          </div>
        </div>
      </div>
    </section>
  );
};
