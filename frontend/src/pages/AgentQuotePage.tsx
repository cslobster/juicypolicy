import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, Citrus } from 'lucide-react';
import QuotePage from './QuotePage';
import ChatInterface from '../components/ChatInterface';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

interface AgentPublic {
    username: string;
    full_name: string;
    email: string;
    wechat_id: string | null;
    telephone: string | null;
}

const AgentQuotePage = () => {
    const { agent: agentSlug } = useParams<{ agent: string }>();
    const [agent, setAgent] = useState<AgentPublic | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');

    useEffect(() => {
        if (!agentSlug) { setStatus('not_found'); return; }
        let cancelled = false;
        fetch(`${API_BASE}/api/agents/${encodeURIComponent(agentSlug)}`)
            .then(r => {
                if (cancelled) return null;
                if (r.status === 404) { setStatus('not_found'); return null; }
                if (!r.ok) { setStatus('error'); return null; }
                return r.json();
            })
            .then(data => { if (data && !cancelled) { setAgent(data as AgentPublic); setStatus('ready'); } });
        return () => { cancelled = true; };
    }, [agentSlug]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen text-sm text-slate-500">
                正在加载...
            </div>
        );
    }

    if (status === 'not_found') {
        return (
            <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
                <h1 className="text-3xl font-bold mb-2">找不到此经纪</h1>
                <p className="text-slate-500 mb-6">链接可能有误，请联系您的经纪人核实。</p>
                <Link to="/" className="text-orange-600 hover:underline">返回首页</Link>
            </div>
        );
    }

    if (status === 'error' || !agent) {
        return (
            <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
                <h1 className="text-2xl font-bold mb-2">加载失败</h1>
                <p className="text-slate-500">请稍后再试。</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <AgentHeader agent={agent} />
            <main className="flex-1 overflow-hidden">
                <QuotePage forceType="health" />
            </main>
            <ChatInterface />
        </div>
    );
};

const AgentHeader = ({ agent }: { agent: AgentPublic }) => {
    return (
        <header className="sticky top-0 z-30 border-b border-orange-100 bg-orange-50/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        <Citrus size={18} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{agent.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">您的专属保险顾问</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4 text-xs text-slate-700">
                    {agent.telephone && (
                        <a href={`tel:${agent.telephone}`} className="inline-flex items-center gap-1.5 hover:text-slate-900">
                            <Phone size={13} className="text-orange-500" /> {agent.telephone}
                        </a>
                    )}
                    {agent.wechat_id && (
                        <span className="inline-flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-orange-500" /> 微信: {agent.wechat_id}
                        </span>
                    )}
                    {agent.email && (
                        <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1.5 hover:text-slate-900">
                            <Mail size={13} className="text-orange-500" /> {agent.email}
                        </a>
                    )}
                </div>
            </div>
            <div className="md:hidden border-t border-orange-100/70 px-4 pb-2 pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
                {agent.telephone && (
                    <a href={`tel:${agent.telephone}`} className="inline-flex items-center gap-1">
                        <Phone size={11} className="text-orange-500" /> {agent.telephone}
                    </a>
                )}
                {agent.wechat_id && (
                    <span className="inline-flex items-center gap-1">
                        <MessageSquare size={11} className="text-orange-500" /> {agent.wechat_id}
                    </span>
                )}
                {agent.email && (
                    <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1 truncate">
                        <Mail size={11} className="text-orange-500" /> {agent.email}
                    </a>
                )}
            </div>
        </header>
    );
};

export default AgentQuotePage;
