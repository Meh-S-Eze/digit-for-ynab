
import React, { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { X, Key, Lock, ExternalLink, LogOut, CheckCircle, CreditCard, RefreshCw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ComingSoon.css';

export default function SettingsModal() {
    const {
        settings, saveSettings, isSettingsOpen, setIsSettingsOpen,
        budgets, fetchBudgets, isLoadingBudgets,
        models, fetchModels, isLoadingModels,
        loginWithYnab, user, logout, hasYnab
    } = useSettings();

    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isSettingsOpen]);

    const handleSave = (e) => {
        e.preventDefault();
        saveSettings(localSettings);
    };

    if (!isSettingsOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[var(--color-primary-900)]/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="glass border border-[var(--glass-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden bg-white/90 dark:bg-black/80 text-[var(--color-text-primary)]"
                >
                    <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-white/10">
                        <h2 className="text-xl font-bold font-display">
                            Settings
                        </h2>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">

                        {/* Account Section */}
                        {user && (
                            <section className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Account</h3>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{user.email}</span>
                                        <span className="text-xs opacity-60">Logged in</span>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setIsSettingsOpen(false); }}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Sign out"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Connections Section */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Connections</h3>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">YNAB</div>
                                        <div className="text-xs opacity-60">
                                            {hasYnab ? 'Account linked' : 'No account linked'}
                                        </div>
                                    </div>
                                </div>
                                {hasYnab ? (
                                    <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs px-3 py-1 bg-green-100/50 rounded-full">
                                        <CheckCircle size={12} />
                                        <span>Linked</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={loginWithYnab}
                                        className="px-4 py-2 bg-[#4c51bf] hover:bg-[#434190] text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </section>

                        <form onSubmit={handleSave} className="space-y-6">

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold">
                                    OpenRouter API Key
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                                    <input
                                        type="password"
                                        value={localSettings.openRouterKey}
                                        onChange={(e) => setLocalSettings({ ...localSettings, openRouterKey: e.target.value })}
                                        className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] transition-all text-sm"
                                        placeholder="sk-or-..."
                                    />
                                </div>
                                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-xs text-[var(--color-accent-600)] hover:underline inline-flex items-center gap-1">
                                    Get a key <ExternalLink size={10} />
                                </a>
                            </div>

                            {/* Model Config */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold">
                                    AI Model
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={localSettings.model}
                                        onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                                        className="flex-1 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] text-sm appearance-none"
                                    >
                                        <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                                        {models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => fetchModels(localSettings.openRouterKey)}
                                        disabled={isLoadingModels || !localSettings.openRouterKey}
                                        className="px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                                    >
                                        <RefreshCw size={16} className={isLoadingModels ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>

                            {/* Budget Config */}
                            {hasYnab && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold">
                                        Budget
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={localSettings.budgetId}
                                            onChange={(e) => setLocalSettings({ ...localSettings, budgetId: e.target.value })}
                                            className="flex-1 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] text-sm appearance-none"
                                        >
                                            <option value="">Select a budget...</option>
                                            {budgets.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => fetchBudgets(localSettings.ynabToken)}
                                            disabled={isLoadingBudgets}
                                            className="px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                                        >
                                            <RefreshCw size={16} className={isLoadingBudgets ? "animate-spin" : ""} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>

                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
