import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

export default function PrivacyPolicy() {
    return (
        <>
            <div className="mesh-gradient"></div>
            <div className="container" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: '800px' }}>

                <Link to="/" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-sm)' }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <h1 className="heading-1">Privacy Policy</h1>
                <p className="body-large">Last Updated: January 20, 2026</p>

                <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p>
                        Digit for YNAB ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our service.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>1. Data We Collect</h2>
                    <p>
                        <strong>YNAB Data:</strong> We access your YNAB budget data (categories, transactions, accounts) solely to provide the chat analysis features. This data is processed in real-time and is not permanently stored on our servers.
                        <br /><br />
                        <strong>Authentication Data:</strong> We use OAuth verification with YNAB to securely authenticate you. We store keys/tokens securely to maintain your session.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>2. Data Usage</h2>
                    <p>
                        We use your data strictly to:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                        <li>Provide AI-powered insights (we send text summaries to LLM providers like OpenRouter/OpenAI, subject to their data policies).</li>
                        <li>Maintain your login session.</li>
                        <li>Improve our service.</li>
                    </ul>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>3. Third-Party Sharing</h2>
                    <p>
                        We do not sell your data. We share data only with:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                        <li><strong>YNAB (You Need A Budget):</strong> To fetch your budget information securely via their API.</li>
                        <li><strong>AI Model Providers (e.g. OpenRouter, OpenAI):</strong> To generate chat responses. We strip sensitive Personally Identifiable Information (PII) where possible before sending data to AI models, but transaction details are necessary for the service to function.</li>
                    </ul>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>4. Data Security</h2>
                    <p>
                        We implement industry-standard security measures to protect your access tokens and session data. Connections to YNAB and our servers are encrypted using SSL/TLS.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>5. Contact Us</h2>
                    <p>
                        If you have privacy concerns, please email privacy@getdigit.app.
                    </p>
                </div>

                <div className="footer">
                    <p>© 2026 Digit for YNAB.</p>
                </div>
            </div>
        </>
    );
}
