import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Citrus, Home, Plane, HeartPulse, ShieldPlus, Building2, Users, Info, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/quote?type=travel', label: '旅行', icon: Plane },
    { path: '/quote?type=term-life', label: '人寿', icon: HeartPulse },
    { path: '/quote?type=health', label: '健保', icon: ShieldPlus },
    { path: '/quote?type=property', label: '财产', icon: Building2 },
    { path: '/agents', label: '代理网络', icon: Users },
    { path: '/about', label: '关于我们', icon: Info },
];

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        if (path.startsWith('/quote')) {
            return location.pathname === '/quote' && location.search === path.replace('/quote', '');
        }
        return location.pathname === path;
    };

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 font-serif text-base font-semibold text-slate-900">
                    <Citrus size={20} className="text-primary" />
                    鲜橙保险
                </Link>

                {/* Center Nav */}
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
                    {user ? (
                        <>
                            <span className="text-sm font-medium text-slate-700">{user.email}</span>
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                退出
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            登录
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
