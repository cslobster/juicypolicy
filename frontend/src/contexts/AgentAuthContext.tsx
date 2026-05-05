import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface AgentProfile {
    id: number;
    username: string;
    email: string;
    full_name: string;
    wechat_id: string | null;
    telephone: string | null;
    wechat_qr: string | null;
}

interface AgentAuthContextType {
    agent: AgentProfile | null;
    token: string | null;
    loading: boolean;
    setSession: (agent: AgentProfile, token: string) => void;
    setAgent: (agent: AgentProfile) => void;
    logout: () => void;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'juicypolicy_agent_token';
const AGENT_KEY = 'juicypolicy_agent_profile';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

export const AgentAuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [agent, setAgentState] = useState<AgentProfile | null>(() => {
        const stored = localStorage.getItem(AGENT_KEY);
        try { return stored ? JSON.parse(stored) : null; } catch { return null; }
    });
    const [loading, setLoading] = useState<boolean>(!!token);

    const setSession = useCallback((newAgent: AgentProfile, newToken: string) => {
        setAgentState(newAgent);
        setToken(newToken);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(AGENT_KEY, JSON.stringify(newAgent));
    }, []);

    const setAgent = useCallback((newAgent: AgentProfile) => {
        setAgentState(newAgent);
        localStorage.setItem(AGENT_KEY, JSON.stringify(newAgent));
    }, []);

    const logout = useCallback(() => {
        setAgentState(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(AGENT_KEY);
    }, []);

    useEffect(() => {
        if (!token) { setLoading(false); return; }
        let cancelled = false;
        fetch(`${API_BASE}/api/agents/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (cancelled) return;
                if (r.status === 401) { logout(); return null; }
                if (!r.ok) return null;
                return r.json();
            })
            .then(data => { if (data && !cancelled) setAgent(data as AgentProfile); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AgentAuthContext.Provider value={{ agent, token, loading, setSession, setAgent, logout }}>
            {children}
        </AgentAuthContext.Provider>
    );
};

export const useAgentAuth = () => {
    const ctx = useContext(AgentAuthContext);
    if (!ctx) throw new Error('useAgentAuth must be used inside AgentAuthProvider');
    return ctx;
};
