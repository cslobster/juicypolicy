import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Citrus } from 'lucide-react';
import QuotePage from './QuotePage';
import ChatInterface from '../components/ChatInterface';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

interface AgentPublic {
    username: string;
    full_name: string;
    email: string;
    wechat_id: string | null;
    telephone: string | null;
    wechat_qr: string | null;
}


const AgentQuotePage = () => {
    const { agent: agentSlug } = useParams<{ agent: string }>();
    const [agent, setAgent] = useState<AgentPublic | null>(null);
    const [agentLoaded, setAgentLoaded] = useState(false);

    useEffect(() => {
        if (!agentSlug) { setAgentLoaded(true); return; }
        let cancelled = false;
        fetch(`${API_BASE}/api/agents/${encodeURIComponent(agentSlug)}`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (cancelled) return;
                if (data) setAgent(data as AgentPublic);
                setAgentLoaded(true);
            })
            .catch(() => { if (!cancelled) setAgentLoaded(true); });
        return () => { cancelled = true; };
    }, [agentSlug]);

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <AgentHeader agent={agent} loaded={agentLoaded} />
            <main className="flex-1 overflow-hidden">
                <QuotePage forceType="health" agentUsername={agentSlug} />
            </main>
            <ChatInterface />
        </div>
    );
};

const AgentHeader = ({ agent, loaded }: { agent: AgentPublic | null; loaded: boolean }) => {
    const fallbackUrl = agent ? `${window.location.origin}/agent/${agent.username}` : '';
    const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&data=${encodeURIComponent(fallbackUrl)}`;
    const qrSrc = agent ? (agent.wechat_qr || fallbackQr) : null;

    return (
        <header className="sticky top-0 z-30 bg-[#103b35] text-white shadow-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                        <Citrus size={18} className="text-orange-300" />
                    </div>
                    <div className="min-w-0">
                        {agent ? (
                            <>
                                <p className="text-sm font-semibold truncate">{agent.full_name}</p>
                                <p className="text-[11px] text-white/70 truncate">您的专属保险顾问</p>
                            </>
                        ) : loaded ? (
                            <>
                                <p className="text-sm font-semibold truncate">鲜橙保险</p>
                                <p className="text-[11px] text-white/70 truncate">在线获取健康保险报价</p>
                            </>
                        ) : (
                            <>
                                <span className="block h-3.5 w-32 rounded bg-white/15 animate-pulse" />
                                <span className="mt-1.5 block h-2.5 w-20 rounded bg-white/10 animate-pulse" />
                            </>
                        )}
                    </div>
                </div>
                {/* Desktop: phone + address column, with small QR */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-end gap-0.5 text-[11px] text-white/85 leading-tight">
                        {agent?.telephone ? (
                            <a href={`tel:${agent.telephone}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                                <Phone size={12} className="text-orange-300" /> {agent.telephone}
                            </a>
                        ) : !loaded ? (
                            <span className="block h-3 w-32 rounded bg-white/10 animate-pulse" />
                        ) : null}
                        <p className="text-[10px] text-white/55 max-w-[28rem] text-right">
                            150 N Santa Anita Ave. Arcadia, CA 91006 / 7700 Irvine Center Dr. Irvine, CA 92618
                        </p>
                    </div>
                    {qrSrc && (
                        <img
                            src={qrSrc}
                            alt={agent ? `${agent.full_name} QR` : 'QR'}
                            className="h-12 w-12 rounded-md bg-white p-0.5 shrink-0"
                            title="扫码联系顾问"
                        />
                    )}
                </div>
                {/* Mobile: phone + larger QR (scannable) */}
                <div className="md:hidden flex items-center gap-2.5">
                    {agent?.telephone && (
                        <a
                            href={`tel:${agent.telephone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 hover:text-white"
                        >
                            <Phone size={12} className="text-orange-300" /> {agent.telephone}
                        </a>
                    )}
                    {qrSrc && (
                        <img
                            src={qrSrc}
                            alt={agent ? `${agent.full_name} QR` : 'QR'}
                            className="h-16 w-16 rounded-md bg-white p-0.5 shrink-0"
                            title="扫码联系顾问"
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

export default AgentQuotePage;
