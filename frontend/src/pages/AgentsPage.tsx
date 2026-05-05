import { useState, useEffect } from 'react';
import { Users, Globe, LogOut, Copy, CheckCircle2, Home, UserCircle, Megaphone, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAgentAuth } from '../contexts/AgentAuthContext';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001';

const AgentsPage = () => {
    const { agent, token, loading, setSession, setAgent, logout } = useAgentAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-sm text-slate-500">
                正在加载...
            </div>
        );
    }

    if (!agent || !token) return <AgentAuthForms onAuthed={setSession} />;
    return <AgentDashboard agent={agent} token={token} onUpdate={setAgent} onLogout={logout} />;
};

const AgentAuthForms = ({ onAuthed }: { onAuthed: (a: any, t: string) => void }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [form, setForm] = useState({
        username: '', email: '', full_name: '', password: 'test12345',
        wechat_id: '', telephone: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const url = mode === 'login' ? '/api/agents/login' : '/api/agents/register';
            const body = mode === 'login'
                ? { username: form.username, password: form.password }
                : form;
            const res = await fetch(`${API_BASE}${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '请求失败');
            onAuthed(data.agent, data.token);
        } catch (err: any) {
            setError(err.message || '请求失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/40 via-white to-slate-50 px-4 py-10">
            <Card className="w-full max-w-md">
                <CardContent className="pt-8 pb-6">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                        <Users className="h-6 w-6 text-orange-500" />
                    </div>
                    <h1 className="text-center text-2xl font-bold mb-1">经纪{mode === 'login' ? '登录' : '注册'}</h1>
                    <p className="text-center text-sm text-slate-500 mb-6">
                        {mode === 'login' ? '登录以管理您的专属报价站点' : '注册成为鲜橙保险经纪人'}
                    </p>

                    <form onSubmit={submit} className="space-y-3">
                        {mode === 'register' && (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">用户名（将作为您的站点 URL）</label>
                                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="例如: melody" required />
                                    {form.username && <p className="text-xs text-slate-500 mt-1">您的站点：juicypolicy.com/{form.username.toLowerCase()}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">邮箱</label>
                                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">姓名</label>
                                    <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 mb-1 block">微信 ID（可选）</label>
                                        <Input value={form.wechat_id} onChange={e => setForm({ ...form, wechat_id: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 mb-1 block">电话（可选）</label>
                                        <Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        )}
                        {mode === 'login' && (
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">用户名或邮箱</label>
                                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">密码 {mode === 'register' && '（默认: test12345，至少 8 位）'}</label>
                            <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={mode === 'register' ? 8 : undefined} />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? '处理中...' : mode === 'login' ? '登录' : '注册'}
                        </Button>
                    </form>

                    <div className="mt-5 text-center text-sm text-slate-600">
                        {mode === 'login' ? '还没有账号？' : '已有账号？'}
                        <button
                            type="button"
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                            className="ml-1.5 text-orange-600 hover:underline font-medium"
                        >
                            {mode === 'login' ? '注册' : '登录'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

type DashboardView = 'home' | 'clients' | 'marketing';

const NAV_ITEMS: { id: DashboardView; label: string; icon: any }[] = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'clients', label: '客户', icon: UserCircle },
    { id: 'marketing', label: '推广', icon: Megaphone },
];

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || name.slice(0, 2).toUpperCase();

const AgentDashboard = ({ agent, token, onUpdate, onLogout }: any) => {
    const [view, setView] = useState<DashboardView>('home');

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-white border-r border-slate-200">
                <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm">
                        {initials(agent.full_name)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{agent.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">@{agent.username}</p>
                    </div>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const active = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-orange-500 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={16} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-2 pb-4">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <LogOut size={16} />
                        退出登录
                    </button>
                </div>
            </aside>

            {/* Mobile top tab bar */}
            <div className="md:hidden fixed top-16 inset-x-0 z-20 bg-white border-b border-slate-200 px-3 py-2 flex gap-1 overflow-x-auto">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const active = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                                active ? 'bg-orange-500 text-white' : 'text-slate-700 bg-slate-100'
                            }`}
                        >
                            <Icon size={14} /> {item.label}
                        </button>
                    );
                })}
                <button onClick={onLogout} className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-600">
                    <LogOut size={14} /> 退出
                </button>
            </div>

            {/* Main */}
            <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
                {view === 'home' && <HomeView agent={agent} token={token} onUpdate={onUpdate} />}
                {view === 'clients' && <ClientsView token={token} />}
                {view === 'marketing' && <MarketingView agent={agent} /> }
            </main>
        </div>
    );
};

const HomeView = ({ agent, token, onUpdate }: any) => {
    const url = `${window.location.origin}/agent/${agent.username}`;
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
    };

    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold text-slate-900">欢迎使用鲜橙保险，{agent.full_name}！</h1>
                <p className="text-sm text-slate-500 mt-2">在这里管理您的专属报价站点、客户线索和推广素材。</p>

                <h2 className="mt-8 text-base font-semibold text-slate-900">通知</h2>
                <div className="mt-3 rounded-xl border-l-4 border-orange-500 bg-orange-50/60 px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex gap-3 text-sm text-slate-700">
                        <Globe size={18} className="text-orange-500 mt-0.5 shrink-0" />
                        <span>分享您的专属链接给客户，他们可在线获取健康保险报价。</span>
                    </div>
                    <a href={`/agent/${agent.username}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-orange-600 hover:underline inline-flex items-center gap-1">
                        预览站点 <ExternalLink size={12} />
                    </a>
                </div>

                <h2 className="mt-8 text-base font-semibold text-slate-900">您的专属链接</h2>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                    <Globe size={16} className="text-orange-500 shrink-0" />
                    <code className="flex-1 text-sm text-slate-900 break-all">{url}</code>
                    <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                        {copied ? <><CheckCircle2 size={14} className="text-emerald-600" /> 已复制</> : <><Copy size={14} /> 复制</>}
                    </button>
                </div>

                <h2 className="mt-8 text-base font-semibold text-slate-900">您的联系信息</h2>
                <p className="text-xs text-slate-500 mt-1">客户将在 {url} 看到这些信息。</p>
                <div className="mt-3">
                    <ContactInfoCard agent={agent} token={token} onUpdate={onUpdate} />
                </div>

                <h2 className="mt-8 text-base font-semibold text-slate-900">入门清单</h2>
                <div className="mt-3 rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
                    <ChecklistRow done label="完善您的联系方式（电话、微信、邮箱）" />
                    <ChecklistRow done={!!agent.telephone} label="设置电话以便客户来电咨询" />
                    <ChecklistRow done={!!agent.wechat_id} label="设置微信 ID 以接收客户咨询" />
                    <ChecklistRow done={!!agent.wechat_qr} label="上传微信二维码方便客户扫码添加" />
                    <ChecklistRow done={false} label="将专属链接分享至社交媒体或客户群" />
                </div>
            </div>
        </div>
    );
};

const ContactInfoCard = ({ agent, token, onUpdate }: any) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({
        full_name: agent.full_name,
        email: agent.email,
        wechat_id: agent.wechat_id || '',
        telephone: agent.telephone || '',
        wechat_qr: agent.wechat_qr || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Re-sync draft when agent changes (after save)
    useEffect(() => {
        setDraft({
            full_name: agent.full_name,
            email: agent.email,
            wechat_id: agent.wechat_id || '',
            telephone: agent.telephone || '',
            wechat_qr: agent.wechat_qr || '',
        });
    }, [agent]);

    const save = async () => {
        setError('');
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/agents/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(draft),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '保存失败');
            onUpdate(data);
            setEditing(false);
        } catch (err: any) { setError(err.message || '保存失败'); }
        finally { setSaving(false); }
    };

    const handleQrFile = async (file: File) => {
        if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
        if (file.size > 600 * 1024) { setError('图片大小不能超过 600KB'); return; }
        setError('');
        const reader = new FileReader();
        reader.onload = () => setDraft({ ...draft, wechat_qr: reader.result as string });
        reader.onerror = () => setError('无法读取图片');
        reader.readAsDataURL(file);
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-end mb-4">
                    {!editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>编辑</Button>}
                </div>

                {editing ? (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">姓名</label>
                            <Input value={draft.full_name} onChange={e => setDraft({ ...draft, full_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">邮箱</label>
                            <Input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">电话</label>
                            <Input value={draft.telephone} onChange={e => setDraft({ ...draft, telephone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">微信 ID</label>
                            <Input value={draft.wechat_id} onChange={e => setDraft({ ...draft, wechat_id: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">微信二维码</label>
                            <div className="flex items-start gap-3">
                                {draft.wechat_qr && (
                                    <img src={draft.wechat_qr} alt="WeChat QR" className="w-24 h-24 rounded-lg object-cover border border-slate-200 shrink-0" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => e.target.files?.[0] && handleQrFile(e.target.files[0])}
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:cursor-pointer hover:file:bg-slate-50"
                                    />
                                    <p className="text-[11px] text-slate-500">支持 JPG/PNG，建议小于 600KB。</p>
                                    {draft.wechat_qr && (
                                        <button
                                            type="button"
                                            onClick={() => setDraft({ ...draft, wechat_qr: '' })}
                                            className="text-xs text-red-600 hover:underline"
                                        >
                                            移除二维码
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                                setDraft({ full_name: agent.full_name, email: agent.email, wechat_id: agent.wechat_id || '', telephone: agent.telephone || '', wechat_qr: agent.wechat_qr || '' });
                                setEditing(false); setError('');
                            }}>取消</Button>
                        </div>
                    </div>
                ) : (
                    <dl className="space-y-2.5 text-sm">
                        <div className="flex"><dt className="w-24 text-slate-500">姓名</dt><dd className="text-slate-900">{agent.full_name}</dd></div>
                        <div className="flex"><dt className="w-24 text-slate-500">邮箱</dt><dd className="text-slate-900">{agent.email}</dd></div>
                        <div className="flex"><dt className="w-24 text-slate-500">电话</dt><dd className="text-slate-900">{agent.telephone || <span className="text-slate-400">未设置</span>}</dd></div>
                        <div className="flex"><dt className="w-24 text-slate-500">微信 ID</dt><dd className="text-slate-900">{agent.wechat_id || <span className="text-slate-400">未设置</span>}</dd></div>
                        <div className="flex items-start"><dt className="w-24 text-slate-500 mt-1">微信二维码</dt>
                            <dd>
                                {agent.wechat_qr
                                    ? <img src={agent.wechat_qr} alt="WeChat QR" className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                                    : <span className="text-slate-400">未设置</span>}
                            </dd>
                        </div>
                    </dl>
                )}
            </CardContent>
        </Card>
    );
};

const ChecklistRow = ({ done, label }: { done: boolean; label: string }) => (
    <div className="px-4 py-3 flex items-center gap-3 text-sm">
        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
            {done && <CheckCircle2 size={12} />}
        </div>
        <span className={done ? 'text-slate-600 line-through' : 'text-slate-900'}>{label}</span>
    </div>
);

interface AgentQuote {
    quote_id: number;
    created_at: string | null;
    status: string;
    zip: string | null;
    age: number | null;
    sex: string | null;
    income: string | null;
    household_size: number | null;
    ages_list: number[];
    plan_count: number;
    min_premium: number | null;
}

const ClientsView = ({ token }: { token: string }) => {
    const [quotes, setQuotes] = useState<AgentQuote[] | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`${API_BASE}/api/agents/me/quotes`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then(data => { if (!cancelled) { setQuotes(data.quotes); setLoading(false); } })
            .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false); } });
        return () => { cancelled = true; };
    }, [token]);

    const fmtDate = (iso: string | null) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const sexLabel = (s: string | null) => s === 'Male' ? '男' : s === 'Female' ? '女' : '—';
    const statusBadge = (s: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            quoted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '已报价' },
            error: { bg: 'bg-red-100', text: 'text-red-800', label: '失败' },
            scraping: { bg: 'bg-amber-100', text: 'text-amber-800', label: '处理中' },
            pending: { bg: 'bg-slate-100', text: 'text-slate-700', label: '等待中' },
        };
        const cfg = map[s] || { bg: 'bg-slate-100', text: 'text-slate-700', label: s };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
    };

    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">客户</h1>
                        <p className="text-sm text-slate-500 mt-2">通过您的专属链接提交报价的客户。</p>
                    </div>
                    {quotes && quotes.length > 0 && (
                        <span className="text-sm text-slate-600">共 {quotes.length} 条</span>
                    )}
                </div>

                {loading && (
                    <div className="mt-8 text-sm text-slate-500">加载中...</div>
                )}

                {error && (
                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        加载失败: {error}
                    </div>
                )}

                {!loading && quotes && quotes.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <UserCircle size={36} className="mx-auto text-slate-300" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900">暂无客户</h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                            将您的专属报价链接分享给客户后，他们的报价请求会显示在这里。
                        </p>
                    </div>
                )}

                {quotes && quotes.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">日期</th>
                                    <th className="px-4 py-3 text-left font-medium">状态</th>
                                    <th className="px-4 py-3 text-left font-medium">邮编</th>
                                    <th className="px-4 py-3 text-left font-medium">主申</th>
                                    <th className="px-4 py-3 text-left font-medium">家庭</th>
                                    <th className="px-4 py-3 text-left font-medium">年收入</th>
                                    <th className="px-4 py-3 text-right font-medium">方案数</th>
                                    <th className="px-4 py-3 text-right font-medium">最低保费</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {quotes.map(q => (
                                    <tr key={q.quote_id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtDate(q.created_at)}</td>
                                        <td className="px-4 py-3">{statusBadge(q.status)}</td>
                                        <td className="px-4 py-3 text-slate-700">{q.zip || '—'}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {q.age ?? '—'} <span className="text-slate-400">岁</span>
                                            {q.sex && <span className="text-slate-400 ml-1">·</span>} {sexLabel(q.sex)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {q.household_size ?? 1} 人
                                            {q.ages_list.length > 0 && (
                                                <span className="text-xs text-slate-500 ml-1">({q.ages_list.join(', ')})</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{q.income ? `$${Number(q.income).toLocaleString()}` : '—'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{q.plan_count}</td>
                                        <td className="px-4 py-3 text-right text-slate-900 font-medium">
                                            {q.min_premium != null ? `$${q.min_premium.toFixed(0)}/月` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const MarketingView = ({ agent }: any) => {
    const url = `${window.location.origin}/agent/${agent.username}`;
    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold text-slate-900">推广</h1>
                <p className="text-sm text-slate-500 mt-2">分享素材帮助您将专属链接推广给潜在客户。</p>

                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-3">分享文案</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">推荐文案（中文）</p>
                                <textarea
                                    readOnly
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono"
                                    value={`您好，我是您的保险顾问 ${agent.full_name}。点击此链接获取免费的健康保险报价：${url}`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgentsPage;
