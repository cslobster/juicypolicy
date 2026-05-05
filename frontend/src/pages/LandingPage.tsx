import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, Headphones, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

const FEATURES = [
    { icon: Sparkles, title: '即时报价', desc: '秒级生成方案，精准匹配最合适的保险产品。' },
    { icon: Award, title: '顶尖承保', desc: '全美主流保险公司直接对接，正规合规可靠。' },
    { icon: Headphones, title: '专家协助', desc: '资深保险代理全程指导，帮您完成申请流程。' },
    { icon: Heart, title: '贴身服务', desc: '投保后持续跟进，理赔与续保贴心服务。' },
];

const HERO_IMAGE = 'https://unicorn-images.b-cdn.net/58fd343d-38bc-4708-90c1-4fb7f4f449aa?optimizer=gif';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white text-slate-900">
            {/* Hero (top half on lg+) */}
            <section className="lg:flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:items-center lg:px-8 lg:py-0 lg:min-h-0">
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-12">
                    <div>
                        <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                            为您找到合适的<br />健康保险方案。
                        </h1>
                        <p className="mt-4 max-w-md text-base leading-7 text-slate-600 lg:text-lg">
                            填写几个基本信息，查看适合您的最佳保险。
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                onClick={() => navigate('/agent/sisi')}
                                className="h-11 rounded-lg bg-[#ff6b2c] px-5 text-base text-white hover:bg-[#f05f22] shadow-sm"
                            >
                                开始报价
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="relative mx-auto hidden w-full max-w-[420px] sm:block lg:max-w-[460px] lg:justify-self-end">
                        <img
                            src={HERO_IMAGE}
                            alt="鲜橙保险插画"
                            className="w-full max-h-[260px] object-contain sm:max-h-[300px] lg:max-h-[340px]"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            {/* Features (bottom half on lg+) */}
            <section className="bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:flex-1 lg:items-center lg:px-8 lg:py-0 lg:min-h-0">
                <div className="mx-auto w-full max-w-5xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">我们提供的服务</h2>
                        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">让买保险变简单</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 md:mt-8 md:grid-cols-2">
                        {FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:gap-4 sm:p-5">
                                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                                        <Icon className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-slate-900 sm:text-[17px]">{f.title}</h3>
                                        <p className="mt-0.5 text-sm leading-5 text-slate-600">{f.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="shrink-0 border-t border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-3 text-center sm:py-4">
                    <p className="text-xs text-slate-600 sm:text-sm">
                        &copy; {new Date().getFullYear()} 鲜橙保险 JuicyPolicy. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
