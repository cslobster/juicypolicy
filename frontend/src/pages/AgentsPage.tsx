import React, { useState, useEffect, useRef } from 'react';
import { Users, Globe, LogOut, Copy, CheckCircle2, Home, UserCircle, Megaphone, ExternalLink, PenLine, Settings, GraduationCap, FileText, ShieldCheck, KeyRound, Plus, Star, Upload, Trash2, Image as ImageIcon, Film, FileType, Music, X, Share2, LayoutGrid, List, Download, Wand2 } from 'lucide-react';
import QuotePage from './QuotePage';
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
                    <h1 className="text-center text-2xl font-bold mb-1">代理{mode === 'login' ? '登录' : '注册'}</h1>
                    <p className="text-center text-sm text-slate-500 mb-6">
                        {mode === 'login' ? '登录以管理您的专属报价站点' : '注册成为鲜橙保险代理人'}
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

type DashboardView = 'home' | 'quote' | 'clients' | 'marketing' | 'copy' | 'tools' | 'training' | 'admin';

const baseNavItems: { id: DashboardView; label: string; icon: any }[] = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'quote', label: '保险报价', icon: FileText },
    { id: 'clients', label: '客户管理', icon: UserCircle },
    { id: 'marketing', label: '市场推广', icon: Megaphone },
    { id: 'copy', label: '文案制作', icon: PenLine },
    { id: 'tools', label: '佣金管理', icon: Settings },
    { id: 'training', label: '行业培训', icon: GraduationCap },
];

const adminNavItem = { id: 'admin' as DashboardView, label: '保险经纪', icon: ShieldCheck };

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || name.slice(0, 2).toUpperCase();

const AgentDashboard = ({ agent, token, onUpdate, onLogout }: any) => {
    const [view, setView] = useState<DashboardView>('home');
    const NAV_ITEMS = agent?.role === 'admin' ? [...baseNavItems, adminNavItem] : baseNavItems;

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
                {view === 'quote' && <QuoteView agent={agent} />}
                {view === 'clients' && <ClientsView token={token} />}
                {view === 'marketing' && <MarketingView agent={agent} token={token} />}
                {view === 'copy' && <CopyAssetsView token={token} />}
                {view === 'tools' && <ComingSoonView title="佣金管理" subtitle="跟踪每个客户的佣金、对账单和提现记录。" icon={Settings} />}
                {view === 'training' && <ComingSoonView title="行业培训" subtitle="定期发布的产品介绍和销售培训课程。" icon={GraduationCap} />}
                {view === 'admin' && agent?.role === 'admin' && <AdminAgentsView token={token} currentAgentId={agent.id} />}
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
            // wechat_qr is managed by its own presign/confirm endpoints — don't ship it here.
            const { wechat_qr: _ignored, ...profileDraft } = draft;
            void _ignored;
            const res = await fetch(`${API_BASE}/api/agents/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(profileDraft),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '保存失败');
            onUpdate(data);
            setEditing(false);
        } catch (err: any) { setError(err.message || '保存失败'); }
        finally { setSaving(false); }
    };

    const [qrUploading, setQrUploading] = useState(false);
    const handleQrFile = async (file: File) => {
        if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
        if (file.size > 1024 * 1024) { setError('图片大小不能超过 1 MB'); return; }
        setError('');
        setQrUploading(true);
        try {
            // 1. presign
            const presignRes = await fetch(`${API_BASE}/api/agents/me/wechat_qr/presign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ filename: file.name, mime_type: file.type, size_bytes: file.size }),
            });
            const presignData = await presignRes.json();
            if (!presignRes.ok) throw new Error(presignData.detail || 'presign 失败');

            // 2. PUT to R2
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presignData.upload_url);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT 失败 (${xhr.status})`));
                xhr.onerror = () => reject(new Error('R2 网络错误'));
                xhr.send(file);
            });

            // 3. confirm — backend HEADs the object, swaps in the new R2 key, deletes the old
            const confirmRes = await fetch(`${API_BASE}/api/agents/me/wechat_qr/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ r2_key: presignData.r2_key }),
            });
            const confirmData = await confirmRes.json();
            if (!confirmRes.ok) throw new Error(confirmData.detail || '确认失败');

            // 4. update local draft + propagate the fresh agent (with signed wechat_qr URL) up
            setDraft(d => ({ ...d, wechat_qr: confirmData.wechat_qr || '' }));
            onUpdate(confirmData);
        } catch (err: any) {
            setError(err.message || '上传失败');
        } finally {
            setQrUploading(false);
        }
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
                                        accept="image/png,image/jpeg,image/webp"
                                        disabled={qrUploading}
                                        onChange={e => e.target.files?.[0] && handleQrFile(e.target.files[0])}
                                        className="text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:cursor-pointer hover:file:bg-slate-50 disabled:opacity-60"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        {qrUploading ? '上传中…' : '支持 PNG / JPG / WebP，最大 1 MB。上传到 Cloudflare R2。'}
                                    </p>
                                    {draft.wechat_qr && !qrUploading && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!confirm('确认移除当前二维码？')) return;
                                                try {
                                                    const res = await fetch(`${API_BASE}/api/agents/me`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                        body: JSON.stringify({ wechat_qr: '' }),
                                                    });
                                                    const data = await res.json();
                                                    if (!res.ok) throw new Error(data.detail || '删除失败');
                                                    setDraft(d => ({ ...d, wechat_qr: '' }));
                                                    onUpdate(data);
                                                } catch (err: any) {
                                                    alert(err.message || '删除失败');
                                                }
                                            }}
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
    enrollment_status: string | null;
    is_vip: boolean;
    zip: string | null;
    age: number | null;
    sex: string | null;
    income: string | null;
    household_size: number | null;
    ages_list: number[];
    plan_count: number;
    min_premium: number | null;
    applicant: {
        first_name: string | null;
        middle_name: string | null;
        last_name: string | null;
        dob: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zip: string | null;
        ssn: string | null;
        annual_income: string | null;
    } | null;
    plan: {
        plan_name: string | null;
        carrier: string | null;
        monthly_premium: number | null;
    } | null;
}

const ClientsView = ({ token }: { token: string }) => {
    const [quotes, setQuotes] = useState<AgentQuote[] | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'enrolled' | 'vip' | 'quoted'>('enrolled');
    const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`${API_BASE}/api/agents/me/quotes`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then(data => { if (!cancelled) { setQuotes(data.quotes); setLoading(false); } })
            .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false); } });
        return () => { cancelled = true; };
    }, [token]);

    const isVip = (q: AgentQuote) => !!q.is_vip;
    const filtered = (quotes || []).filter(q => {
        if (tab === 'enrolled') return q.enrollment_status === 'submitted';
        if (tab === 'vip') return isVip(q);
        return q.enrollment_status !== 'submitted' && q.status === 'quoted';
    });
    const enrolledCount = (quotes || []).filter(q => q.enrollment_status === 'submitted').length;
    const vipCount = (quotes || []).filter(isVip).length;
    const quotedOnlyCount = (quotes || []).filter(q => q.enrollment_status !== 'submitted' && q.status === 'quoted').length;

    const patchQuote = async (quote_id: number, body: any) => {
        const res = await fetch(`${API_BASE}/api/agents/me/quotes/${quote_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || '保存失败');
        }
    };

    const toggleVip = async (q: AgentQuote) => {
        setActionLoading(q.quote_id);
        try {
            await patchQuote(q.quote_id, { is_vip: !q.is_vip });
            setQuotes(prev => prev?.map(x => x.quote_id === q.quote_id ? { ...x, is_vip: !x.is_vip } : x) || prev);
        } catch (err: any) {
            alert(err.message || '操作失败');
        } finally {
            setActionLoading(null);
        }
    };

    const removeQuote = async (q: AgentQuote) => {
        if (!confirm(`确认删除此客户记录？此操作不可撤销。`)) return;
        setActionLoading(q.quote_id);
        try {
            const res = await fetch(`${API_BASE}/api/agents/me/quotes/${q.quote_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || '删除失败');
            }
            setQuotes(prev => prev?.filter(x => x.quote_id !== q.quote_id) || prev);
        } catch (err: any) {
            alert(err.message || '操作失败');
        } finally {
            setActionLoading(null);
        }
    };

    const startEdit = (q: AgentQuote) => {
        const a = q.applicant || {} as any;
        setEditingQuoteId(q.quote_id);
        setEditForm({
            firstName: a.first_name || '',
            lastName: a.last_name || '',
            phone: a.phone || '',
            email: a.email || '',
            dob: a.dob || '',
            address: a.address || '',
            city: a.city || '',
            state: a.state || '',
            zip: a.zip || '',
        });
    };

    const saveEdit = async () => {
        if (editingQuoteId == null) return;
        setActionLoading(editingQuoteId);
        try {
            await patchQuote(editingQuoteId, { applicant: editForm });
            // Optimistic local update
            setQuotes(prev => prev?.map(x => x.quote_id === editingQuoteId
                ? { ...x, applicant: {
                    ...(x.applicant || {} as any),
                    first_name: editForm.firstName || null,
                    last_name: editForm.lastName || null,
                    phone: editForm.phone || null,
                    email: editForm.email || null,
                    dob: editForm.dob || null,
                    address: editForm.address || null,
                    city: editForm.city || null,
                    state: editForm.state || null,
                    zip: editForm.zip || null,
                }} : x) || prev);
            setEditingQuoteId(null);
        } catch (err: any) {
            alert(err.message || '保存失败');
        } finally {
            setActionLoading(null);
        }
    };

    const fmtDate = (iso: string | null) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const sexLabel = (s: string | null) => s === 'Male' ? '男' : s === 'Female' ? '女' : '—';
    const statusBadge = (q: AgentQuote) => {
        if (q.enrollment_status === 'submitted') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-100 text-violet-800">已申请</span>;
        }
        const map: Record<string, { bg: string; text: string; label: string }> = {
            quoted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '已报价' },
            error: { bg: 'bg-red-100', text: 'text-red-800', label: '失败' },
            scraping: { bg: 'bg-amber-100', text: 'text-amber-800', label: '处理中' },
            pending: { bg: 'bg-slate-100', text: 'text-slate-700', label: '等待中' },
            enrollment: { bg: 'bg-violet-100', text: 'text-violet-800', label: '已申请' },
        };
        const cfg = map[q.status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: q.status };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
    };
    const toggleRow = (id: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">客户管理</h1>
                        <p className="text-sm text-slate-500 mt-2">通过您的专属链接提交报价或申请的客户。</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-1 rounded-full bg-slate-100 p-1 w-fit">
                    {[
                        { id: 'enrolled', label: `已申请 (${enrolledCount})` },
                        { id: 'vip', label: `VIP客户 (${vipCount})` },
                        { id: 'quoted', label: `仅报价 (${quotedOnlyCount})` },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading && <div className="mt-8 text-sm text-slate-500">加载中...</div>}

                {error && (
                    <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        加载失败: {error}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <UserCircle size={36} className="mx-auto text-slate-300" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            {tab === 'enrolled' ? '暂无投保申请' : tab === 'vip' ? '暂无VIP客户' : tab === 'quoted' ? '暂无仅报价客户' : '暂无客户'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                            {tab === 'vip'
                                ? '点击客户姓名旁的 ★ 标记可将其加入 VIP。'
                                : '将您的专属报价链接分享给客户后，他们的请求会显示在这里。'}
                        </p>
                    </div>
                )}

                {filtered.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-3 py-3 text-left font-medium w-8"></th>
                                    <th className="px-4 py-3 text-left font-medium">日期</th>
                                    <th className="px-4 py-3 text-left font-medium">状态</th>
                                    <th className="px-4 py-3 text-left font-medium">客户</th>
                                    <th className="px-4 py-3 text-left font-medium">联系方式</th>
                                    <th className="px-4 py-3 text-right font-medium">月保费</th>
                                    <th className="px-4 py-3 text-right font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(q => {
                                    const a = q.applicant;
                                    const isOpen = expanded.has(q.quote_id);
                                    const hasDetails = !!a;
                                    const customerName = a && (a.first_name || a.last_name) ? `${a.last_name || ''}${a.first_name || ''}`.trim() : `#${q.quote_id}`;
                                    return (
                                    <React.Fragment key={q.quote_id}>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-3 py-3 text-slate-400 cursor-pointer" onClick={() => hasDetails && toggleRow(q.quote_id)}>
                                                {hasDetails ? (isOpen ? '▾' : '▸') : ''}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtDate(q.created_at)}</td>
                                            <td className="px-4 py-3">{statusBadge(q)}</td>
                                            <td className="px-4 py-3 text-slate-900 font-medium">
                                                <button
                                                    onClick={() => toggleVip(q)}
                                                    disabled={actionLoading === q.quote_id}
                                                    className="mr-1.5 align-middle text-amber-400 hover:text-amber-500 disabled:opacity-50"
                                                    title={q.is_vip ? '取消 VIP 标记' : '标记为 VIP'}
                                                >
                                                    <Star size={14} className={q.is_vip ? 'fill-current' : ''} />
                                                </button>
                                                {customerName}
                                                <span className="text-xs text-slate-500 ml-1.5 font-normal">
                                                    {q.age ?? '—'}岁{q.sex && ` · ${sexLabel(q.sex)}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                                {a?.phone || a?.email || (q.zip ? `${q.zip}` : '—')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-medium">
                                                {q.plan?.monthly_premium != null
                                                    ? `$${q.plan.monthly_premium.toFixed(0)}`
                                                    : q.min_premium != null
                                                        ? `$${q.min_premium.toFixed(0)}起`
                                                        : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => startEdit(q)}
                                                    disabled={actionLoading === q.quote_id}
                                                    className="text-xs text-orange-600 hover:underline mr-3 disabled:opacity-50"
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={() => removeQuote(q)}
                                                    disabled={actionLoading === q.quote_id}
                                                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                        {isOpen && a && editingQuoteId !== q.quote_id && (
                                            <tr className="bg-slate-50/60">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                                        {q.plan?.plan_name && (
                                                            <div className="col-span-full mb-2 pb-2 border-b border-slate-200/70">
                                                                <span className="text-xs text-slate-500">投保计划</span>
                                                                <p className="font-medium text-slate-900">{q.plan.plan_name} · {q.plan.carrier}</p>
                                                            </div>
                                                        )}
                                                        <Field label="姓名" value={[a.last_name, a.middle_name, a.first_name].filter(Boolean).join(' ')} />
                                                        <Field label="出生日期" value={a.dob} />
                                                        <Field label="电话" value={a.phone} />
                                                        <Field label="邮箱" value={a.email} />
                                                        <Field label="社会安全号码" value={a.ssn} />
                                                        <Field label="年收入" value={a.annual_income ? `$${Number(a.annual_income).toLocaleString()}` : null} />
                                                        <Field label="地址" value={[a.address, a.city, a.state, a.zip].filter(Boolean).join(', ')} className="col-span-full" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {editingQuoteId === q.quote_id && (
                                            <tr className="bg-slate-50/60">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div><label className="text-xs text-slate-500 mb-1 block">姓</label><Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">名</label><Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">出生日期</label><Input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">电话</label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">邮箱</label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                                                        <div className="sm:col-span-2"><label className="text-xs text-slate-500 mb-1 block">街道地址</label><Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">城市</label><Input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">州</label><Input value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500 mb-1 block">邮编</label><Input value={editForm.zip} onChange={e => setEditForm({ ...editForm, zip: e.target.value })} /></div>
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        <Button size="sm" onClick={saveEdit} disabled={actionLoading === q.quote_id}>{actionLoading === q.quote_id ? '保存中...' : '保存'}</Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditingQuoteId(null)}>取消</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const Field = ({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) => (
    <div className={className}>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-900 mt-0.5 break-words">{value || <span className="text-slate-400">—</span>}</p>
    </div>
);

const MarketingView = ({ agent, token }: any) => {
    const url = `${window.location.origin}/agent/${agent.username}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(url)}`;
    const qrUrlHiRes = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=8&data=${encodeURIComponent(url)}`;
    const [shared, setShared] = useState<AgentUpload[]>([]);
    const [sharedLoading, setSharedLoading] = useState(true);
    const [previewing, setPreviewing] = useState<AgentUpload | null>(null);
    const [posterEditorOpen, setPosterEditorOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setSharedLoading(true);
        fetch(`${API_BASE}/api/uploads/shared`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : { uploads: [] })
            .then(data => { if (!cancelled) { setShared(data.uploads || []); setSharedLoading(false); } })
            .catch(() => { if (!cancelled) setSharedLoading(false); });
        return () => { cancelled = true; };
    }, [token]);

    useEffect(() => {
        if (!previewing) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewing(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [previewing]);

    const copyUrl = async (u: string) => { try { await navigator.clipboard.writeText(u); } catch { /* */ } };

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

                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-3">制作海报</h3>
                        <p className="text-xs text-slate-500 mb-4">选择海报底图，将自己的二维码放上去并下载，方便在朋友圈、社交媒体或线下宣传。</p>
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shrink-0">
                                <img src={qrUrl} alt="专属链接二维码" className="w-32 h-32" />
                            </div>
                            <div className="flex-1 space-y-2 text-sm">
                                <p className="text-slate-700">扫描二维码可直接打开您的报价页面。</p>
                                <p className="text-xs text-slate-500 break-all">{url}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <a
                                        href={qrUrl}
                                        download={`juicypolicy-${agent.username}-qr.png`}
                                        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                        <Download size={14} /> 下载二维码
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPosterEditorOpen(true)}
                                        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700"
                                    >
                                        <Wand2 size={14} /> 制作海报
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold">共享素材库</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">所有代理共享的图片和视频素材，可点击预览或复制链接使用。</p>

                        {sharedLoading ? (
                            <div className="text-sm text-slate-500">加载中...</div>
                        ) : shared.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center">
                                <Share2 size={26} className="mx-auto text-slate-300" />
                                <p className="mt-2 text-sm text-slate-700 font-medium">暂无共享素材</p>
                                <p className="mt-1 text-xs text-slate-500">在「文案制作」中点击素材的「共享」按钮即可发布到这里。</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {shared.map(u => {
                                    const Icon = iconForMime(u.mime_type);
                                    const isImage = u.mime_type?.startsWith('image/');
                                    const canPreview = isImage || u.mime_type?.startsWith('video/') || u.mime_type?.startsWith('audio/') || u.mime_type === 'application/pdf';
                                    return (
                                        <div key={u.id} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                                            <div
                                                className={`aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden ${canPreview ? 'cursor-zoom-in select-none' : ''}`}
                                                onClick={() => canPreview && setPreviewing(u)}
                                            >
                                                {isImage ? (
                                                    <img src={u.public_url} alt={u.filename} className="h-full w-full object-cover" draggable={false} />
                                                ) : (
                                                    <Icon size={28} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div className="px-2.5 py-2">
                                                <p className="text-xs font-medium text-slate-900 truncate" title={u.filename}>{u.filename}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                                    {u.agent ? `@${u.agent.username}` : ''}{u.agent && u.size_bytes != null ? ' · ' : ''}{fmtSize(u.size_bytes)}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                                    <button onClick={() => copyUrl(u.public_url)} className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"><Copy size={11} /> 复制</button>
                                                    <a href={u.public_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"><ExternalLink size={11} /> 打开</a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {previewing && (
                <PreviewModal upload={previewing} onClose={() => setPreviewing(null)} />
            )}

            {posterEditorOpen && (
                <PosterEditor
                    agent={agent}
                    marketingQrUrl={qrUrlHiRes}
                    sharedAssets={shared.filter(u => u.mime_type?.startsWith('image/'))}
                    onClose={() => setPosterEditorOpen(false)}
                />
            )}
        </div>
    );
};

// ---------- Poster editor: pick a poster, drop the agent's QR onto it, download ----------

interface PosterEditorProps {
    agent: any;
    marketingQrUrl: string;
    sharedAssets: AgentUpload[];
    onClose: () => void;
}

const PosterEditor: React.FC<PosterEditorProps> = ({ agent, marketingQrUrl, sharedAssets, onClose }) => {
    const [posterSrc, setPosterSrc] = useState<string | null>(null);
    const [posterDims, setPosterDims] = useState<{ w: number; h: number } | null>(null);
    const [qrSource, setQrSource] = useState<'marketing' | 'wechat'>('marketing');
    const [qrBox, setQrBox] = useState({ x: 0.4, y: 0.6, size: 0.2 });
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // For canvas reads, route R2-hosted images through the FastAPI proxy so the
    // browser sees Access-Control-Allow-Origin from our own origin (no R2 CORS).
    const r2Proxy = (key: string) => `${API_BASE}/api/r2/file/${key}`;

    const wechatQrAvailable = !!agent.wechat_qr;
    const qrSrc = qrSource === 'marketing'
        ? marketingQrUrl
        : (agent.wechat_qr_key ? r2Proxy(agent.wechat_qr_key) : agent.wechat_qr);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const onPosterFile = (file: File) => {
        if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('图片不能超过 10 MB'); return; }
        setError('');
        const reader = new FileReader();
        reader.onload = () => loadPoster(reader.result as string);
        reader.onerror = () => setError('读取图片失败');
        reader.readAsDataURL(file);
    };

    const loadPoster = (src: string) => {
        const img = new Image();
        // Only set crossOrigin for true cross-origin URLs. Setting it on a
        // data: URL trips Safari, and same-origin URLs don't need it.
        if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
        img.onload = () => {
            setPosterSrc(src);
            setPosterDims({ w: img.naturalWidth, h: img.naturalHeight });
            const size = 0.22;
            const aspectWoverH = img.naturalWidth / img.naturalHeight;
            const sizeYFrac = size * aspectWoverH;
            setQrBox({ x: (1 - size) / 2, y: Math.min(0.95 - sizeYFrac, 0.7), size });
        };
        img.onerror = () => {
            let host = '';
            try { host = new URL(src).host; } catch { host = src.slice(0, 24); }
            setError(`无法加载图片（来源: ${host || 'data'}）。请尝试其他图片或重新上传。`);
        };
        img.src = src;
    };

    const startMove = (e: React.PointerEvent) => {
        if (!containerRef.current || !posterDims) return;
        e.preventDefault();
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const rect = containerRef.current.getBoundingClientRect();
        const startBox = { ...qrBox };
        const startX = e.clientX;
        const startY = e.clientY;
        const aspectWoverH = posterDims.w / posterDims.h;
        const sizeYFrac = startBox.size * aspectWoverH;

        const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / rect.width;
            const dy = (ev.clientY - startY) / rect.height;
            setQrBox(prev => ({
                ...prev,
                x: Math.max(0, Math.min(1 - prev.size, startBox.x + dx)),
                y: Math.max(0, Math.min(1 - sizeYFrac, startBox.y + dy)),
            }));
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const startResize = (e: React.PointerEvent) => {
        if (!containerRef.current || !posterDims) return;
        e.preventDefault();
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const rect = containerRef.current.getBoundingClientRect();
        const startBox = { ...qrBox };
        const startX = e.clientX;
        const aspectWoverH = posterDims.w / posterDims.h;

        const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / rect.width;
            const newSize = Math.max(0.05, Math.min(1 - startBox.x, startBox.size + dx));
            const sizeYFrac = newSize * aspectWoverH;
            setQrBox({
                x: startBox.x,
                y: Math.min(startBox.y, Math.max(0, 1 - sizeYFrac)),
                size: newSize,
            });
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                let host = '';
                try { host = new URL(src).host; } catch { host = src.slice(0, 24); }
                reject(new Error(`图片加载失败（来源: ${host || 'data'}）`));
            };
            img.src = src;
        });

    const handleDownload = async () => {
        if (!posterSrc || !posterDims) return;
        setError('');
        setDownloading(true);
        try {
            const [posterImg, qrImg] = await Promise.all([loadImg(posterSrc), loadImg(qrSrc)]);
            const canvas = document.createElement('canvas');
            canvas.width = posterImg.naturalWidth;
            canvas.height = posterImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas 不可用');
            ctx.drawImage(posterImg, 0, 0);

            const px = qrBox.x * canvas.width;
            const py = qrBox.y * canvas.height;
            const ps = qrBox.size * canvas.width;
            const pad = Math.round(ps * 0.04);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - pad, py - pad, ps + pad * 2, ps + pad * 2);
            ctx.drawImage(qrImg, px, py, ps, ps);

            const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), 'image/png'));
            if (!blob) throw new Error('生成图片失败');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `poster-${agent.username}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (err: any) {
            setError(err.message || '下载失败');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">制作海报</h3>
                        <p className="text-xs text-slate-500 mt-0.5">选择海报底图，拖动方框定位二维码位置，点击下载即可保存。</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                    <div>
                        <p className="text-xs font-medium text-slate-700 mb-2">1. 选择海报底图</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 cursor-pointer">
                                <Upload size={14} /> 上传图片
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => e.target.files?.[0] && onPosterFile(e.target.files[0])}
                                />
                            </label>
                            {sharedAssets.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowLibrary(s => !s)}
                                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                                >
                                    <ImageIcon size={14} /> {showLibrary ? '收起共享素材' : '从共享素材选择'}
                                </button>
                            )}
                            {posterSrc && (
                                <button
                                    type="button"
                                    onClick={() => { setPosterSrc(null); setPosterDims(null); }}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    重新选择
                                </button>
                            )}
                        </div>
                        {showLibrary && sharedAssets.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {sharedAssets.map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => { loadPoster(r2Proxy(u.r2_key)); setShowLibrary(false); }}
                                        className="aspect-[3/4] rounded-md overflow-hidden bg-slate-100 hover:ring-2 hover:ring-orange-400"
                                        title={u.filename}
                                    >
                                        <img src={u.public_url} alt={u.filename} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {posterSrc && posterDims && (
                        <>
                            <div>
                                <p className="text-xs font-medium text-slate-700 mb-2">2. 选择要嵌入的二维码</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQrSource('marketing')}
                                        className={`text-sm px-3 py-1.5 rounded-md border ${qrSource === 'marketing' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        营销链接二维码
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => wechatQrAvailable && setQrSource('wechat')}
                                        disabled={!wechatQrAvailable}
                                        className={`text-sm px-3 py-1.5 rounded-md border ${qrSource === 'wechat' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-slate-300 hover:bg-slate-50'} ${!wechatQrAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title={wechatQrAvailable ? '' : '请先在「资料设置」上传微信二维码'}
                                    >
                                        微信二维码
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-700 mb-2">3. 拖动方框定位（右下角小方块可调整大小）</p>
                                <div
                                    ref={containerRef}
                                    className="relative w-full mx-auto bg-slate-100 rounded-lg overflow-hidden select-none touch-none"
                                    style={{ aspectRatio: `${posterDims.w} / ${posterDims.h}`, maxHeight: '60vh' }}
                                >
                                    <img
                                        src={posterSrc}
                                        alt="poster"
                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        draggable={false}
                                    />
                                    <div
                                        className="absolute border-2 border-orange-500 shadow-[0_0_0_2px_rgba(255,255,255,0.6)] cursor-move bg-white/30"
                                        style={{
                                            left: `${qrBox.x * 100}%`,
                                            top: `${qrBox.y * 100}%`,
                                            width: `${qrBox.size * 100}%`,
                                            aspectRatio: '1 / 1',
                                            touchAction: 'none',
                                        }}
                                        onPointerDown={startMove}
                                    >
                                        {qrSrc && (
                                            <img
                                                src={qrSrc}
                                                alt="QR preview"
                                                className="w-full h-full object-contain p-1 pointer-events-none"
                                                {...(/^https?:/i.test(qrSrc) ? { crossOrigin: 'anonymous' as const } : {})}
                                                draggable={false}
                                            />
                                        )}
                                        <div
                                            onPointerDown={startResize}
                                            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-sm bg-orange-500 border-2 border-white cursor-se-resize"
                                            style={{ touchAction: 'none' }}
                                            title="调整大小"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    海报原始尺寸 {posterDims.w} × {posterDims.h}px。下载图片为同尺寸 PNG。
                                </p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!posterSrc || downloading}
                        className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={14} /> {downloading ? '生成中…' : '下载海报'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuoteView = ({ agent }: any) => (
    <div className="h-full flex flex-col">
        <div className="px-6 py-5 lg:px-10 border-b border-slate-200 bg-white shrink-0">
            <h1 className="text-xl font-bold text-slate-900">保险报价</h1>
            <p className="text-xs text-slate-500 mt-1">为客户即时生成健康保险报价。生成的报价将自动归入您的客户管理。</p>
        </div>
        <div className="flex-1 overflow-hidden">
            <QuotePage forceType="health" agentUsername={agent.username} />
        </div>
    </div>
);

interface AgentUpload {
    id: number;
    filename: string;
    mime_type: string | null;
    size_bytes: number | null;
    r2_key: string;
    public_url: string;
    label: string | null;
    is_shared: boolean;
    created_at: string | null;
    agent?: { id: number; username: string; full_name: string };
}

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'application/pdf', 'audio/'];
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const fmtSize = (n: number | null) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const fmtUploadDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const iconForMime = (mime: string | null) => {
    if (!mime) return FileText;
    if (mime.startsWith('image/')) return ImageIcon;
    if (mime.startsWith('video/')) return Film;
    if (mime === 'application/pdf') return FileType;
    if (mime.startsWith('audio/')) return Music;
    return FileText;
};

const CopyAssetsView = ({ token }: { token: string }) => {
    const [uploads, setUploads] = useState<AgentUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [dragOver, setDragOver] = useState(false);
    const [previewing, setPreviewing] = useState<AgentUpload | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!previewing) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewing(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [previewing]);

    const refresh = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/agents/me/uploads`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '加载失败');
            setUploads(data.uploads);
        } catch (err: any) {
            setError(err.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

    const validate = (file: File): string | null => {
        const ok = ALLOWED_MIME_PREFIXES.some(p => file.type.startsWith(p) || (p === 'application/pdf' && file.type === p));
        if (!ok) return `不支持的文件类型: ${file.type || '未知'}`;
        if (file.size > MAX_UPLOAD_BYTES) return `文件 ${file.name} 超过 100 MB`;
        return null;
    };

    const uploadFile = async (file: File) => {
        const err = validate(file);
        if (err) { alert(err); return; }
        const tag = `${file.name}-${Date.now()}`;
        setProgress(p => ({ ...p, [tag]: 0 }));
        try {
            // 1. presign
            const presignRes = await fetch(`${API_BASE}/api/agents/me/uploads/presign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    filename: file.name,
                    mime_type: file.type,
                    size_bytes: file.size,
                }),
            });
            const presignData = await presignRes.json();
            if (!presignRes.ok) throw new Error(presignData.detail || 'presign 失败');

            // 2. PUT to R2 with progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presignData.upload_url);
                if (file.type) xhr.setRequestHeader('Content-Type', file.type);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        const pct = Math.round((ev.loaded / ev.total) * 100);
                        setProgress(p => ({ ...p, [tag]: pct }));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error(`R2 PUT 失败 (${xhr.status})`));
                };
                xhr.onerror = () => reject(new Error('R2 网络错误'));
                xhr.send(file);
            });

            // 3. confirm — only now does the DB row get created
            const confirmRes = await fetch(`${API_BASE}/api/agents/me/uploads/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    r2_key: presignData.r2_key,
                    filename: file.name,
                    mime_type: file.type,
                    size_bytes: file.size,
                }),
            });
            if (!confirmRes.ok) {
                const d = await confirmRes.json().catch(() => ({}));
                throw new Error(d.detail || '确认上传失败');
            }

            setProgress(p => { const next = { ...p }; delete next[tag]; return next; });
            await refresh();
        } catch (err: any) {
            alert(err.message || '上传失败');
            setProgress(p => { const next = { ...p }; delete next[tag]; return next; });
        }
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(f => uploadFile(f));
    };

    const remove = async (u: AgentUpload) => {
        if (!confirm(`确认删除 ${u.filename}？`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/agents/me/uploads/${u.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(((await res.json()).detail) || '删除失败');
            setUploads(prev => prev.filter(x => x.id !== u.id));
        } catch (err: any) {
            alert(err.message || '删除失败');
        }
    };

    const toggleShare = async (u: AgentUpload) => {
        try {
            const res = await fetch(`${API_BASE}/api/agents/me/uploads/${u.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ is_shared: !u.is_shared }),
            });
            if (!res.ok) throw new Error(((await res.json()).detail) || '共享失败');
            setUploads(prev => prev.map(x => x.id === u.id ? { ...x, is_shared: !x.is_shared } : x));
        } catch (err: any) {
            alert(err.message || '共享失败');
        }
    };

    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-5xl">
                <h1 className="text-2xl font-bold text-slate-900">文案制作</h1>
                <p className="text-sm text-slate-500 mt-2">上传素材（图片、视频、PDF、音频），最大 100 MB / 文件，可用于宣传素材或客户分享。</p>

                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                        dragOver ? 'border-orange-500 bg-orange-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                    }`}
                >
                    <Upload size={28} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-900">拖拽文件到此处或点击上传</p>
                    <p className="mt-1 text-xs text-slate-500">支持 JPG / PNG / MP4 / PDF / MP3，单个最大 100 MB</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,application/pdf"
                        className="hidden"
                        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                    />
                </div>

                {Object.keys(progress).length > 0 && (
                    <div className="mt-4 space-y-2">
                        {Object.entries(progress).map(([tag, pct]) => (
                            <div key={tag} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                    <span className="truncate">{tag.split('-').slice(0, -1).join('-')}</span>
                                    <span>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                {!loading && uploads.length === 0 && Object.keys(progress).length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                        <PenLine size={32} className="mx-auto text-slate-300" />
                        <h3 className="mt-3 text-base font-semibold text-slate-900">还没有素材</h3>
                        <p className="mt-1 text-sm text-slate-500">上传保险产品介绍图片、宣传视频或客户分享文案。</p>
                    </div>
                )}

                {uploads.length > 0 && (
                    <>
                        <div className="mt-8 mb-3 flex items-center justify-between">
                            <p className="text-sm text-slate-500">{uploads.length} 个素材</p>
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                    aria-label="网格视图"
                                    title="网格视图"
                                >
                                    <LayoutGrid size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                    aria-label="列表视图"
                                    title="列表视图"
                                >
                                    <List size={14} />
                                </button>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {uploads.map(u => {
                                    const Icon = iconForMime(u.mime_type);
                                    const isImage = u.mime_type?.startsWith('image/');
                                    const canPreview = isImage || u.mime_type?.startsWith('video/') || u.mime_type?.startsWith('audio/') || u.mime_type === 'application/pdf';
                                    return (
                                        <div key={u.id} className={`rounded-xl bg-white shadow-sm ring-1 overflow-hidden ${u.is_shared ? 'ring-emerald-300' : 'ring-slate-200'}`}>
                                            <div
                                                className={`relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden ${canPreview ? 'cursor-zoom-in select-none' : ''}`}
                                                onClick={() => canPreview && setPreviewing(u)}
                                                title={canPreview ? '点击预览' : undefined}
                                            >
                                                {isImage ? (
                                                    <img src={u.public_url} alt={u.filename} className="h-full w-full object-cover" draggable={false} />
                                                ) : (
                                                    <Icon size={36} className="text-slate-400" />
                                                )}
                                                {u.is_shared && (
                                                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 text-white px-2 py-0.5 text-[11px] font-medium shadow-sm">
                                                        <Share2 size={10} /> 已共享
                                                    </span>
                                                )}
                                            </div>
                                            <div className="px-3 py-2.5">
                                                <p className="text-sm font-medium text-slate-900 truncate" title={u.filename}>{u.filename}</p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">{fmtSize(u.size_bytes)} · {fmtUploadDate(u.created_at)}</p>
                                                <div className="mt-2 flex items-center gap-3 text-xs">
                                                    <button
                                                        onClick={() => toggleShare(u)}
                                                        className={`inline-flex items-center gap-1 transition-colors ${u.is_shared ? 'text-emerald-600 hover:text-emerald-700 font-medium' : 'text-slate-600 hover:text-slate-900'}`}
                                                    >
                                                        <Share2 size={12} /> {u.is_shared ? '取消共享' : '共享'}
                                                    </button>
                                                    <a href={u.public_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"><ExternalLink size={12} /> 打开</a>
                                                    <button onClick={() => remove(u)} className="ml-auto text-red-600 hover:text-red-700 inline-flex items-center gap-1"><Trash2 size={12} /> 删除</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left font-medium w-10"></th>
                                            <th className="px-3 py-2.5 text-left font-medium">文件名</th>
                                            <th className="px-3 py-2.5 text-left font-medium hidden sm:table-cell">类型</th>
                                            <th className="px-3 py-2.5 text-right font-medium hidden sm:table-cell">大小</th>
                                            <th className="px-3 py-2.5 text-left font-medium hidden md:table-cell">日期</th>
                                            <th className="px-3 py-2.5 text-right font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {uploads.map(u => {
                                            const Icon = iconForMime(u.mime_type);
                                            const isImage = u.mime_type?.startsWith('image/');
                                            const canPreview = isImage || u.mime_type?.startsWith('video/') || u.mime_type?.startsWith('audio/') || u.mime_type === 'application/pdf';
                                            return (
                                                <tr key={u.id} className="hover:bg-slate-50/60">
                                                    <td className="px-3 py-2">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 overflow-hidden ${canPreview ? 'cursor-zoom-in' : ''}`}
                                                            onClick={() => canPreview && setPreviewing(u)}
                                                            title={canPreview ? '点击预览' : undefined}
                                                        >
                                                            {isImage ? (
                                                                <img src={u.public_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Icon size={18} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-900">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="truncate" title={u.filename}>{u.filename}</span>
                                                            {u.is_shared && (
                                                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-medium">
                                                                    <Share2 size={9} /> 已共享
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500 text-xs hidden sm:table-cell">{u.mime_type || '—'}</td>
                                                    <td className="px-3 py-2 text-slate-700 text-right whitespace-nowrap hidden sm:table-cell">{fmtSize(u.size_bytes)}</td>
                                                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell">{fmtUploadDate(u.created_at)}</td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap text-xs">
                                                        <button
                                                            onClick={() => toggleShare(u)}
                                                            className={`inline-flex items-center gap-1 mr-3 transition-colors ${u.is_shared ? 'text-emerald-600 hover:text-emerald-700 font-medium' : 'text-slate-600 hover:text-slate-900'}`}
                                                        >
                                                            <Share2 size={12} /> {u.is_shared ? '取消共享' : '共享'}
                                                        </button>
                                                        <a href={u.public_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mr-3 text-slate-600 hover:text-slate-900"><ExternalLink size={12} /> 打开</a>
                                                        <button onClick={() => remove(u)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"><Trash2 size={12} /> 删除</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {previewing && (
                <PreviewModal upload={previewing} onClose={() => setPreviewing(null)} />
            )}
        </div>
    );
};

const PreviewModal = ({ upload, onClose }: { upload: AgentUpload; onClose: () => void }) => {
    const mime = upload.mime_type || '';
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/');
    const isPdf = mime === 'application/pdf';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <button
                onClick={onClose}
                aria-label="关闭"
                className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <X size={20} />
            </button>

            <div
                className="relative max-h-full max-w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {isImage && (
                    <img src={upload.public_url} alt={upload.filename} className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
                )}
                {isVideo && (
                    <video src={upload.public_url} controls autoPlay className="max-h-[88vh] max-w-[92vw] rounded-lg shadow-2xl" />
                )}
                {isAudio && (
                    <div className="rounded-2xl bg-slate-900 px-8 py-10 shadow-2xl text-center min-w-[360px]">
                        <Music size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-white font-medium mb-4 break-all">{upload.filename}</p>
                        <audio src={upload.public_url} controls autoPlay className="w-full" />
                    </div>
                )}
                {isPdf && (
                    <iframe
                        src={upload.public_url}
                        title={upload.filename}
                        className="h-[88vh] w-[90vw] max-w-[1200px] rounded-lg bg-white shadow-2xl"
                    />
                )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm text-white/80">
                <span className="truncate max-w-[60vw]">{upload.filename}</span>
                <span className="text-white/50">·</span>
                <span>{fmtSize(upload.size_bytes)}</span>
            </div>
        </div>
    );
};

const ComingSoonView = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) => (
    <div className="px-6 py-8 lg:px-10">
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Icon size={36} className="mx-auto text-slate-300" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">即将上线</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                    我们正在打磨这个功能，敬请期待。
                </p>
            </div>
        </div>
    </div>
);

interface AdminAgentRow {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'admin' | 'normal';
    telephone: string | null;
    wechat_id: string | null;
}

const AdminAgentsView = ({ token, currentAgentId }: { token: string; currentAgentId: number }) => {
    const [agents, setAgents] = useState<AdminAgentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ username: '', email: '', full_name: '', password: 'test12345', role: 'normal', telephone: '', wechat_id: '' });
    const [createError, setCreateError] = useState('');
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [edit, setEdit] = useState<{ full_name: string; email: string; role: string; telephone: string; wechat_id: string }>({ full_name: '', email: '', role: 'normal', telephone: '', wechat_id: '' });
    const [editSaving, setEditSaving] = useState(false);
    const [resetMsg, setResetMsg] = useState<{ id: number; pw: string } | null>(null);

    const refresh = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '加载失败');
            setAgents(data.agents);
        } catch (err: any) { setError(err.message || '加载失败'); }
        finally { setLoading(false); }
    };

    useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

    const submitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(createForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '创建失败');
            setShowCreate(false);
            setCreateForm({ username: '', email: '', full_name: '', password: 'test12345', role: 'normal', telephone: '', wechat_id: '' });
            await refresh();
        } catch (err: any) { setCreateError(err.message || '创建失败'); }
        finally { setCreateSubmitting(false); }
    };

    const startEdit = (a: AdminAgentRow) => {
        setEditingId(a.id);
        setEdit({ full_name: a.full_name, email: a.email, role: a.role, telephone: a.telephone || '', wechat_id: a.wechat_id || '' });
    };

    const saveEdit = async () => {
        if (editingId == null) return;
        setEditSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(edit),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '保存失败');
            setEditingId(null);
            await refresh();
        } catch (err: any) { alert(err.message || '保存失败'); }
        finally { setEditSaving(false); }
    };

    const resetPassword = async (id: number, username: string) => {
        if (!confirm(`确认重置 ${username} 的密码？`)) return;
        const res = await fetch(`${API_BASE}/api/admin/agents/${id}/reset-password`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) { alert(data.detail || '重置失败'); return; }
        setResetMsg({ id, pw: data.reset_password });
    };

    return (
        <div className="px-6 py-8 lg:px-10">
            <div className="max-w-5xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">保险经纪</h1>
                        <p className="text-sm text-slate-500 mt-2">添加新代理、调整角色、重置密码。</p>
                    </div>
                    <Button onClick={() => setShowCreate(s => !s)} size="sm">
                        <Plus size={14} className="mr-1.5" /> 添加代理
                    </Button>
                </div>

                {showCreate && (
                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4">添加新代理</h3>
                            <form onSubmit={submitCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">用户名</label>
                                    <Input value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} required /></div>
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">邮箱</label>
                                    <Input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required /></div>
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">姓名</label>
                                    <Input value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} required /></div>
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">初始密码</label>
                                    <Input value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} /></div>
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">角色</label>
                                    <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                        <option value="normal">普通代理</option>
                                        <option value="admin">管理员</option>
                                    </select></div>
                                <div><label className="text-xs font-medium text-slate-600 mb-1 block">电话（可选）</label>
                                    <Input value={createForm.telephone} onChange={e => setCreateForm({ ...createForm, telephone: e.target.value })} /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600 mb-1 block">微信 ID（可选）</label>
                                    <Input value={createForm.wechat_id} onChange={e => setCreateForm({ ...createForm, wechat_id: e.target.value })} /></div>
                                {createError && <p className="sm:col-span-2 text-sm text-red-600">{createError}</p>}
                                <div className="sm:col-span-2 flex gap-2">
                                    <Button type="submit" disabled={createSubmitting} size="sm">{createSubmitting ? '创建中...' : '创建'}</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => { setShowCreate(false); setCreateError(''); }}>取消</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading && <div className="mt-6 text-sm text-slate-500">加载中...</div>}
                {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                {!loading && agents.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">用户名</th>
                                    <th className="px-4 py-3 text-left font-medium">姓名</th>
                                    <th className="px-4 py-3 text-left font-medium">邮箱</th>
                                    <th className="px-4 py-3 text-left font-medium">角色</th>
                                    <th className="px-4 py-3 text-left font-medium">联系</th>
                                    <th className="px-4 py-3 text-right font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {agents.map(a => {
                                    const isEditing = editingId === a.id;
                                    return (
                                    <React.Fragment key={a.id}>
                                        <tr className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">@{a.username}</td>
                                            <td className="px-4 py-3 text-slate-900 font-medium">{a.full_name}{a.id === currentAgentId && <span className="ml-1 text-[10px] text-slate-400">（您）</span>}</td>
                                            <td className="px-4 py-3 text-slate-700 break-all">{a.email}</td>
                                            <td className="px-4 py-3">
                                                {a.role === 'admin'
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-100 text-violet-800"><ShieldCheck size={11} /> 管理员</span>
                                                    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">普通</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 text-xs">{a.telephone || '—'}{a.wechat_id ? ` · ${a.wechat_id}` : ''}</td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <button onClick={() => startEdit(a)} className="text-xs text-orange-600 hover:underline mr-3">编辑</button>
                                                <button onClick={() => resetPassword(a.id, a.username)} className="text-xs text-slate-600 hover:underline inline-flex items-center gap-1"><KeyRound size={11} /> 重置密码</button>
                                            </td>
                                        </tr>
                                        {resetMsg && resetMsg.id === a.id && (
                                            <tr className="bg-emerald-50/60">
                                                <td colSpan={6} className="px-4 py-3 text-sm text-emerald-900">
                                                    密码已重置为 <code className="font-mono px-1.5 py-0.5 bg-white rounded">{resetMsg.pw}</code>。请告知该代理并要求其登录后修改。
                                                    <button onClick={() => setResetMsg(null)} className="ml-3 text-xs text-emerald-700 hover:underline">关闭</button>
                                                </td>
                                            </tr>
                                        )}
                                        {isEditing && (
                                            <tr className="bg-slate-50/60">
                                                <td colSpan={6} className="px-4 py-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div><label className="text-xs text-slate-500">姓名</label>
                                                            <Input value={edit.full_name} onChange={e => setEdit({ ...edit, full_name: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500">邮箱</label>
                                                            <Input type="email" value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} /></div>
                                                        <div><label className="text-xs text-slate-500">角色</label>
                                                            <select value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })} disabled={a.id === currentAgentId} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400">
                                                                <option value="normal">普通代理</option>
                                                                <option value="admin">管理员</option>
                                                            </select>
                                                            {a.id === currentAgentId && <p className="text-[10px] text-slate-500 mt-1">不能修改自己的角色</p>}</div>
                                                        <div><label className="text-xs text-slate-500">电话</label>
                                                            <Input value={edit.telephone} onChange={e => setEdit({ ...edit, telephone: e.target.value })} /></div>
                                                        <div className="sm:col-span-2"><label className="text-xs text-slate-500">微信 ID</label>
                                                            <Input value={edit.wechat_id} onChange={e => setEdit({ ...edit, wechat_id: e.target.value })} /></div>
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        <Button size="sm" onClick={saveEdit} disabled={editSaving}>{editSaving ? '保存中...' : '保存'}</Button>
                                                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>取消</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentsPage;
