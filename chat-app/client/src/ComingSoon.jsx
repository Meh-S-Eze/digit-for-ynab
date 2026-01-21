import React from 'react';
import './ComingSoon.css';
import { Lightbulb, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ComingSoon() {
    return (
        <>
            {/* Mesh Gradient Background (Tech Forward) */}
            <div className="mesh-gradient"></div>

            {/* Main Container (Editorial Left-aligned) */}
            <div className="container">

                {/* Badge */}
                <div className="badge-container">
                    <span className="badge">
                        <span className="badge-dot"></span>
                        UNDER CONSTRUCTION
                    </span>
                </div>

                {/* Hero Section */}
                <div className="hero">
                    <h1 className="hero-title">
                        <span className="brand-name">Digit</span>
                        <span className="brand-suffix">for YNAB</span>
                    </h1>
                    <p className="hero-subtitle">is getting ready.</p>

                    <p className="hero-tagline">
                        Experience a new way to talk to your money. AI-powered insights for your YNAB budget, coming soon to a browser near you.
                    </p>
                </div>

                {/* Features Grid (Glass cards) */}
                <div className="features">

                    <div className="feature-card glass">
                        <div className="feature-icon-wrapper">
                            <Lightbulb size={32} strokeWidth={2} />
                        </div>
                        <h3 className="feature-title">AI Analysis</h3>
                        <p className="feature-description">Deep insights into your spending habits.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon-wrapper">
                            <ShieldCheck size={32} strokeWidth={2} />
                        </div>
                        <h3 className="feature-title">Secure & Private</h3>
                        <p className="feature-description">Your data never leaves your control.</p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon-wrapper">
                            <MessageCircle size={32} strokeWidth={2} />
                        </div>
                        <h3 className="feature-title">Real-time Chat</h3>
                        <p className="feature-description">Ask questions, get instant answers.</p>
                    </div>

                </div>

                {/* CTA Section */}
                <div className="cta-section">
                    <button className="btn-primary">
                        Get Notified When We Launch
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Footer */}
                <footer className="footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <p>© 2026 Digit for YNAB. Powered by YNAB & MCP.</p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: 'var(--text-xs)' }}>
                        <Link to="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
                        <Link to="/privacy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
                    </div>
                </footer>

            </div>
        </>
    );
}
