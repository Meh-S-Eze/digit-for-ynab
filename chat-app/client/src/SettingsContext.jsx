

import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        openRouterKey: '',
        ynabToken: '',
        budgetId: '',
        model: 'deepseek/deepseek-chat', // Default to DeepSeek V3
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
    const [models, setModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Auth State
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasYnab, setHasYnab] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const storedRouterKey = localStorage.getItem('ynab_chat_openrouter_key');
        const storedYnabToken = localStorage.getItem('ynab_chat_ynab_token');
        const storedBudgetId = localStorage.getItem('ynab_chat_budget_id');
        const storedModel = localStorage.getItem('ynab_chat_model');

        if (storedRouterKey || storedYnabToken) {
            setSettings({
                openRouterKey: storedRouterKey || '',
                ynabToken: storedYnabToken || '',
                budgetId: storedBudgetId || '',
                model: storedModel || 'deepseek/deepseek-chat',
            });
        }
        // Note: Logic to open settings if empty is moved to CheckSession or component logic
    }, []);

    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        if (newSettings.openRouterKey) localStorage.setItem('ynab_chat_openrouter_key', newSettings.openRouterKey);
        if (newSettings.ynabToken) localStorage.setItem('ynab_chat_ynab_token', newSettings.ynabToken);
        if (newSettings.budgetId) localStorage.setItem('ynab_chat_budget_id', newSettings.budgetId);
        if (newSettings.model) localStorage.setItem('ynab_chat_model', newSettings.model);
        setIsSettingsOpen(false);
    };

    const clearSettings = () => {
        setSettings({ openRouterKey: '', ynabToken: '', budgetId: '', model: 'deepseek/deepseek-chat' });
        localStorage.removeItem('ynab_chat_openrouter_key');
        localStorage.removeItem('ynab_chat_ynab_token');
        localStorage.removeItem('ynab_chat_budget_id');
        localStorage.removeItem('ynab_chat_model');
        setIsSettingsOpen(true);
    };

    const fetchBudgets = async (ynabToken) => {
        if (!ynabToken) return;
        setIsLoadingBudgets(true);
        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-ynab-token': ynabToken
                }
            });
            const data = await response.json();

            let parsedData = data;
            if (typeof data === 'string') {
                try { parsedData = JSON.parse(data); } catch (e) { console.error("Failed to parse budgets", e) }
            }

            setBudgets(parsedData.budgets || parsedData.data?.budgets || []);

        } catch (error) {
            console.error("Failed to fetch budgets", error);
        } finally {
            setIsLoadingBudgets(false);
        }
    };

    const fetchModels = async (apiKey) => {
        if (!apiKey) return;
        setIsLoadingModels(true);
        try {
            const response = await fetch('/api/models', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-openrouter-key': apiKey
                }
            });
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
                setModels(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch models", error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const loginWithYnab = () => {
        // Now mostly for "Connect YNAB"
        window.location.href = '/api/ynab/connect';
    };

    const checkSession = async () => {
        setAuthLoading(true);
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json();

            if (res.ok && data.authenticated) {
                setIsAuthenticated(true);
                setUser(data.user);
                setHasYnab(!!data.hasYnab);

                if (data.ynabToken) {
                    setSettings(prev => ({ ...prev, ynabToken: data.ynabToken }));
                    // Also trigger fetch budgets if we have token?
                    // fetchBudgets(data.ynabToken);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (e) {
            console.error("Session check failed", e);
            setIsAuthenticated(false);
        } finally {
            setAuthLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                setIsAuthenticated(true);
                setUser(data.user);
                checkSession(); // refresh state fully
                return true;
            }
            throw new Error(data.error);
        } catch (e) {
            throw e;
        }
    };

    const register = async (email, password) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                setIsAuthenticated(true);
                setUser(data.user);
                checkSession();
                return true;
            }
            throw new Error(data.error);
        } catch (e) {
            throw e;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setUser(null);
            setHasYnab(false);
            // Optionally clear settings or keep them?
            // Clearing settings might be annoying if they want to re-login.
            // But for security maybe clear sensitive ones?
            // clearSettings(); 
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            saveSettings,
            isSettingsOpen,
            setIsSettingsOpen,
            clearSettings,
            budgets,
            fetchBudgets,
            isLoadingBudgets,
            models,
            fetchModels,
            isLoadingModels,
            loginWithYnab,
            user,
            isAuthenticated,
            hasYnab,
            authLoading,
            login,
            register,
            logout
        }}>
            {children}
        </SettingsContext.Provider>
    );
}
