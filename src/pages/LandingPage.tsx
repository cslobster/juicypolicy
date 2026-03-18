import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Car, Home, Activity, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface ProductCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    tagLine?: string;
    tagVariant?: 'success' | 'warning' | 'default' | 'info';
    onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ icon, title, desc, tagLine, tagVariant = 'default', onClick }) => {
    return (
        <Card
            className="relative p-5 cursor-pointer transition hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            onClick={onClick}
        >
            {tagLine && (
                <Badge variant={tagVariant} className="absolute top-3 right-3 text-[0.6rem]">
                    {tagLine}
                </Badge>
            )}
            <div className="flex items-center gap-4">
                <div className="shrink-0 flex items-center justify-center w-14 h-14">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-slate-950 flex items-center gap-1 mb-1">
                        {title} <ChevronRight size={14} className="text-muted-foreground" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
                </div>
            </div>
        </Card>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleQuote = (type: string) => {
        navigate('/quote?type=' + type);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-100 h-[calc(100vh-4rem)] overflow-hidden">
                {/* Hero top */}
                <div className="flex justify-between max-w-6xl mx-auto px-6 pt-8">
                    <div className="flex-1 max-w-2xl pt-4">
                        <p className="text-sm font-medium text-muted-foreground tracking-wide mb-2">
                            欢迎来到鲜橙保险®
                        </p>
                        <h1 className="text-5xl font-bold leading-tight mb-8">
                            更好的保障，从这里开始
                        </h1>
                    </div>
                </div>

                {/* Product selector */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 mt-6">
                    <Card className="overflow-hidden">
                        <div className="p-6 pb-4">
                            <h2 className="text-lg font-semibold">选择一个产品以获取报价</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-6 pb-6">
                            <ProductCard
                                icon={<Plane size={40} className="text-sky-400" strokeWidth={1.5} />}
                                title="旅行保险"
                                desc="涵盖医疗、延误、行程取消等"
                                tagLine="热门"
                                tagVariant="warning"
                                onClick={() => handleQuote('travel')}
                            />
                            <ProductCard
                                icon={<Activity size={40} className="text-teal-500" strokeWidth={1.5} />}
                                title="定期寿险"
                                desc="即时获批，经济实惠的家庭保障"
                                onClick={() => handleQuote('term-life')}
                            />
                            <ProductCard
                                icon={<Activity size={40} className="text-orange-500" strokeWidth={1.5} />}
                                title="终身寿险"
                                desc="终身有效且包含现金价值累积"
                                onClick={() => handleQuote('whole-life')}
                            />
                            <ProductCard
                                icon={<Car size={40} className="text-cyan-500" strokeWidth={1.5} />}
                                title="汽车保险"
                                desc="根据驾驶习惯优化的实惠费率"
                                onClick={() => handleQuote('auto')}
                            />
                            <ProductCard
                                icon={<Home size={40} className="text-slate-500" strokeWidth={1.5} />}
                                title="财产与房屋"
                                desc="房屋、租客、公寓等全面保障"
                                onClick={() => handleQuote('property')}
                            />
                            <Card
                                className="flex items-center justify-center gap-3 p-5 cursor-pointer transition hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
                                onClick={() => handleQuote('other')}
                            >
                                <div className="flex gap-1 flex-wrap w-5 h-5">
                                    <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                                </div>
                                <span className="font-semibold text-sm flex items-center">
                                    或者查看：其他保障 <ChevronRight size={14} className="ml-1" />
                                </span>
                            </Card>
                        </div>
                    </Card>
                </div>

                {/* Action buttons */}
                <div className="max-w-5xl mx-auto px-6 mt-6 flex gap-3">
                    <Button variant="outline" className="gap-1">
                        继续之前的报价 <ChevronRight size={14} />
                    </Button>
                    <Button variant="outline" className="gap-1">
                        寻找保险经纪 <ChevronRight size={14} />
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
