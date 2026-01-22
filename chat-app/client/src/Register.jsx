
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from './SettingsContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useSettings();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const success = await register(email, password);
            if (success) {
                navigate('/app/chat');
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAFA] text-[var(--color-text-primary)] relative z-10">
            {/* Mesh gradient overlay for subtle brand feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-mesh-1)] via-transparent to-[var(--color-mesh-2)] pointer-events-none opacity-80"></div>

            <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-xl relative z-20">
                <h2 className="text-3xl font-bold mb-2 text-center text-[var(--color-primary-900)] font-display">Create Account</h2>
                <p className="text-center text-[var(--color-text-secondary)] mb-8 text-sm">Work with Digit today</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent-400)] focus:border-transparent outline-none text-[var(--color-text-primary)] placeholder-gray-400 transition-all shadow-sm"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent-400)] focus:border-transparent outline-none text-[var(--color-text-primary)] placeholder-gray-400 transition-all shadow-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent-400)] focus:border-transparent outline-none text-[var(--color-text-primary)] placeholder-gray-400 transition-all shadow-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 mt-2 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[var(--color-accent-600)]/20"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-secondary)]">
                    Already have an account?{' '}
                    <Link to="/app/login" className="text-[var(--color-accent-600)] hover:text-[var(--color-accent-700)] font-medium transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
