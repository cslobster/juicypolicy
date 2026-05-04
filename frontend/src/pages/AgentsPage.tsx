import { useState } from 'react';
import { Users, Globe, LogOut, Copy, CheckCircle2 } from 'lucide-react';
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

const AgentDashboard = ({ agent, token, onUpdate, onLogout }: any) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({
        full_name: agent.full_name,
        wechat_id: agent.wechat_id || '',
        telephone: agent.telephone || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const url = `${window.location.origin}/agent/${agent.username}`;

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
        } catch (err: any) {
            setError(err.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/40 via-white to-slate-50 px-4 py-10">
            <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">您好，{agent.full_name}</h1>
                        <p className="text-sm text-slate-500 mt-1">@{agent.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onLogout}>
                        <LogOut size={14} className="mr-1.5" /> 退出
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Globe size={18} className="text-orange-500" />
                            <h3 className="font-semibold">您的专属报价站点</h3>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 border border-slate-200">
                            <code className="flex-1 text-sm text-slate-900 break-all">{url}</code>
                            <button
                                onClick={copyUrl}
                                className="shrink-0 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                            >
                                {copied ? <><CheckCircle2 size={14} className="text-emerald-600" /> 已复制</> : <><Copy size={14} /> 复制</>}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            将此链接发送给客户，他们将看到您的联系信息并可直接获取报价。
                        </p>
                        <a href={`/agent/${agent.username}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
                            预览站点 →
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">联系信息（客户在您的站点上看到这些）</h3>
                            {!editing && (
                                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>编辑</Button>
                            )}
                        </div>

                        {editing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">姓名</label>
                                    <Input value={draft.full_name} onChange={e => setDraft({ ...draft, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">电话</label>
                                    <Input value={draft.telephone} onChange={e => setDraft({ ...draft, telephone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">微信 ID</label>
                                    <Input value={draft.wechat_id} onChange={e => setDraft({ ...draft, wechat_id: e.target.value })} />
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setDraft({ full_name: agent.full_name, wechat_id: agent.wechat_id || '', telephone: agent.telephone || '' }); setEditing(false); setError(''); }}>取消</Button>
                                </div>
                            </div>
                        ) : (
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex"><dt className="w-24 text-slate-500">姓名</dt><dd className="text-slate-900">{agent.full_name}</dd></div>
                                <div className="flex"><dt className="w-24 text-slate-500">邮箱</dt><dd className="text-slate-900">{agent.email}</dd></div>
                                <div className="flex"><dt className="w-24 text-slate-500">电话</dt><dd className="text-slate-900">{agent.telephone || <span className="text-slate-400">未设置</span>}</dd></div>
                                <div className="flex"><dt className="w-24 text-slate-500">微信 ID</dt><dd className="text-slate-900">{agent.wechat_id || <span className="text-slate-400">未设置</span>}</dd></div>
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgentsPage;
