import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="header glass">
            <Link to="/" className="header-logo">
                <Shield size={28} />
                智能保险 (AInsurance)
            </Link>
            <nav className="header-nav">
                <Link to="/products" className="nav-link">产品</Link>
                <Link to="/claims" className="nav-link">理赔</Link>
                <Link to="/about" className="nav-link">关于我们</Link>
            </nav>
            <div className="header-actions">
                <Link to="/login" className="nav-link" style={{ marginRight: '1.5rem' }}>登录</Link>
                <Link to="/quote" className="btn btn-primary">
                    获取报价 <ChevronRight size={18} />
                </Link>
            </div>
        </header>
    );
};

export default Header;
