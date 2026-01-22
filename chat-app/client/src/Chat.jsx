import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User, Settings, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from './SettingsContext';
import './ComingSoon.css'; // Ensure we have access to shared styles

function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { settings, setIsSettingsOpen } = useSettings();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!settings.openRouterKey || !settings.ynabToken) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Please configure your API keys in Settings to continue." }]);
            setIsSettingsOpen(true);
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-openrouter-key': settings.openRouterKey,
                    'x-ynab-token': settings.ynabToken,
                    'x-ynab-budget-id': settings.budgetId,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                }),
            });

            const data = await response.json();

            if (response.status === 401 || data.error) {
                throw new Error(data.error || "Authentication failed");
            }

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.message.content || "Done." }
            ]);

        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `Error: ${error.message}` },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6">
            <header className="mb-6 flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-accent)] flex items-center justify-center text-[var(--color-primary-600)]">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-display tracking-tight text-[var(--color-primary-900)]">
                            Digit for YNAB
                        </h1>
                        <p className="text-xs text-[var(--color-text-secondary)]">AI Financial Assistant</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-white)] rounded-lg transition-all"
                >
                    <Settings size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-300">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                            <Bot size={48} className="text-[var(--color-primary-300)] mb-4" />
                            <p className="text-[var(--color-text-secondary)] font-medium">Ready to analyze your budget.</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex gap-4 p-5 rounded-2xl max-w-[85%] shadow-sm",
                                message.role === 'user'
                                    ? "ml-auto bg-[var(--color-primary-800)] text-white"
                                    : "mr-auto glass text-[var(--color-text-primary)] border border-[var(--color-border)]"
                            )}
                        >
                            <div className="mt-1 shrink-0">
                                {message.role === 'user' ?
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-700)] flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    :
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-600)] flex items-center justify-center">
                                        <Bot size={18} />
                                    </div>
                                }
                            </div>
                            <div className={clsx(
                                "prose prose-sm max-w-none leading-relaxed",
                                message.role === 'user' ? "prose-invert" : "text-[var(--color-text-primary)]"
                            )}>
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 p-5 mr-auto glass border border-[var(--color-border)] rounded-2xl max-w-[85%]"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-600)] flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <div className="flex gap-1 items-center h-8">
                                <span className="w-2 h-2 bg-[var(--color-accent-400)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-[var(--color-accent-400)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-[var(--color-accent-400)] rounded-full animate-bounce"></span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="relative mb-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your budget..."
                    className="w-full glass border border-[var(--color-border)] rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] focus:border-transparent transition-all placeholder:[var(--color-text-muted)] text-[var(--color-text-primary)] shadow-sm"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-accent-600)] text-white rounded-xl hover:bg-[var(--color-accent-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
    );
}

export default Chat;
