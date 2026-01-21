import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

export default function TermsOfService() {
    return (
        <>
            <div className="mesh-gradient"></div>
            <div className="container" style={{ alignItems: 'flex-start', textAlign: 'left', maxWidth: '800px' }}>

                <Link to="/" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-sm)' }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <h1 className="heading-1">Terms of Service</h1>
                <p className="body-large">Last Updated: January 20, 2026</p>

                <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p>
                        Welcome to Digit for YNAB. By accessing or using our service, you agree to be bound by these Terms of Service.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>1. Acceptance of Terms</h2>
                    <p>
                        By registering for and/or using the Service in any manner, you agree to these Terms of Service and all other operating rules, policies, and procedures that may be published from time to time on this site by us, each of which is incorporated by reference and each of which may be updated from time to time without notice to you.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>2. Description of Service</h2>
                    <p>
                        Digit for YNAB provides an AI-powered chat interface for interacting with your You Need A Budget (YNAB) data. We are not affiliated with YNAB (You Need A Budget LLC).
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>3. User Data & Privacy</h2>
                    <p>
                        Your privacy is important to us. We do not store your YNAB banking credentials on our servers permanently. Access tokens are kept in secure session storage or encrypted databases solely for the purpose of fetching your budget data during your active session. Please refer to our Privacy Policy for more details.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>4. AI Limitations</h2>
                    <p>
                        Our service utilizes Artificial Intelligence (AI) to analyze data and generates responses. AI can make mistakes ("hallucinations"). You should always verify important financial information directly within your official YNAB application. We are not responsible for financial decisions made based on AI analysis.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>5. Limitation of Liability</h2>
                    <p>
                        In no event shall Digit for YNAB, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>

                    <h2 className="feature-title" style={{ fontSize: 'var(--text-2xl)', marginTop: '1rem' }}>6. Contact</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at support@getdigit.app.
                    </p>
                </div>

                <div className="footer">
                    <p>© 2026 Digit for YNAB.</p>
                </div>
            </div>
        </>
    );
}
