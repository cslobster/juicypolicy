import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Car, Home, Activity, ChevronRight } from 'lucide-react';

interface ProductCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    tagLine?: string;
    tagClass?: string;
    topBorderColor?: string;
    onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ icon, title, desc, tagLine, tagClass, topBorderColor, onClick }) => {
    return (
        <div className="prog-product-card" onClick={onClick} style={topBorderColor ? { borderTop: `4px solid ${topBorderColor}` } : {}}>
            {tagLine && <div className={`prog-badge ${tagClass}`}>{tagLine}</div>}
            <div className="prog-card-content">
                <div className="prog-icon">{icon}</div>
                <div className="prog-text">
                    <h3 className="prog-title">{title} <ChevronRight size={16} /></h3>
                    <p className="prog-desc">{desc}</p>
                </div>
            </div>
        </div>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleQuote = (type: string) => {
        navigate('/quote?type=' + type);
    };

    return (
        <div className="landing-page animate-fade-in">
            <section className="prog-hero">
                <div className="prog-hero-top">
                    <div className="prog-hero-left">
                        <p className="prog-hero-welcome">欢迎来到鲜橙保险®</p>
                        <h1 className="prog-hero-title">更好的保障，<br />从这里开始</h1>
                    </div>
                </div>
                
                <div className="prog-floating-selector">
                    <div className="prog-selector-header">
                        <h2 className="prog-selector-title">选择一个产品以获取报价</h2>
                    </div>
                    <div className="prog-product-grid">
                        <ProductCard 
                            icon={<Plane size={44} color="#75aadb" strokeWidth={1.5} />}
                            title="旅行保险"
                            desc="涵盖医疗、延误、行程取消等"
                            tagLine="热门"
                            tagClass="popular"
                            topBorderColor="#89d0ca"
                            onClick={() => handleQuote('travel')}
                        />
                        <ProductCard 
                            icon={<Car size={44} color="#5ba8c9" strokeWidth={1.5} />}
                            title="汽车保险"
                            desc="根据驾驶习惯优化的实惠费率"
                            tagLine="省钱！"
                            tagClass="savings"
                            onClick={() => handleQuote('auto')}
                        />
                        <ProductCard 
                            icon={<Home size={44} color="#457b9d" strokeWidth={1.5} />}
                            title="财产与房屋"
                            desc="房屋、租客、公寓等全面保障"
                            onClick={() => handleQuote('property')}
                        />
                        <ProductCard 
                            icon={<Activity size={44} color="#2a9d8f" strokeWidth={1.5} />}
                            title="定期寿险"
                            desc="即时获批，经济实惠的家庭保障"
                            onClick={() => handleQuote('term-life')}
                        />
                        <ProductCard 
                            icon={<Activity size={44} color="#e76f51" strokeWidth={1.5} />}
                            title="终身寿险"
                            desc="终身有效且包含现金价值累积"
                            onClick={() => handleQuote('whole-life')}
                        />
                        <div className="prog-all-products" onClick={() => handleQuote('other')}>
                            <div className="prog-dots">
                                 <div className="prog-dot" style={{ background: '#75aadb' }}></div>
                                 <div className="prog-dot" style={{ background: '#457b9d' }}></div>
                                 <div className="prog-dot" style={{ background: '#222' }}></div>
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center' }}>或者查看：其他保障 <ChevronRight size={16} style={{ marginLeft: '4px' }} /></span>
                        </div>
                    </div>
                </div>
                
                <div className="prog-hero-actions">
                    <button className="prog-btn-outline">继续之前的报价 <ChevronRight size={16} /></button>
                    <button className="prog-btn-outline">寻找保险经纪 <ChevronRight size={16} /></button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
