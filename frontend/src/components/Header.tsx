import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Citrus, Home, ShieldPlus, Users, Info, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAgentAuth } from '../contexts/AgentAuthContext';

const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/quote/health', label: '健康保险', icon: ShieldPlus },
    { path: '/agents', label: '代理网络', icon: Users },
    { path: '/about', label: '关于我们', icon: Info },
];

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || name.slice(0, 2).toUpperCase();

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { agent, logout } = useAgentAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!profileOpen) return;
        const onClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [profileOpen]);

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        if (path.startsWith('/quote')) {
            return location.pathname === '/quote' && location.search === path.replace('/quote', '');
        }
        return location.pathname === path;
    };

    return (
        <header className="sticky top-0 z-50 border-b border-orange-100 bg-orange-50/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 font-serif text-base font-semibold text-slate-900">
                    <Citrus size={20} className="text-orange-500" />
                    鲜橙保险
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex flex-1 items-center justify-center">
                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {agent ? (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(v => !v)}
                                aria-label={`已登录：${agent.full_name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
                            >
                                {initials(agent.full_name)}
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 py-2">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{agent.full_name}</p>
                                        <p className="text-xs text-slate-500 truncate">@{agent.username}</p>
                                    </div>
                                    <button
                                        onClick={() => { setProfileOpen(false); navigate('/login'); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        代理后台
                                    </button>
                                    <button
                                        onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        退出登录
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            代理登陆
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                    {agent ? (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                    {initials(agent.full_name)}
                                </div>
                                <span className="text-sm text-slate-700 truncate">{agent.full_name}</span>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                退出
                            </button>
                        </div>
                    ) : (
                        <div className="mt-3 pt-3 border-t border-slate-100 px-3">
                            <Link
                                to="/login"
                                onClick={() => setMobileOpen(false)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                代理登陆
                            </Link>
                        </div>
                    )}
                </nav>
            )}
        </header>
    );
};

export default Header;
