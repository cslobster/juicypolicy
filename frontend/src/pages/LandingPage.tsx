import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, BarChart2, Award, Headphones } from 'lucide-react';
import { Button } from '../components/ui/button';

const FEATURES = [
    { icon: Sparkles, title: '即时客制化并挑选合适产品' },
    { icon: BarChart2, title: '实时保单优势及回报对比' },
    { icon: Award, title: '全美顶尖保险公司承保' },
    { icon: Headphones, title: '由我们的保险专家帮助完成申请' },
];

const HERO_IMAGE = 'https://unicorn-images.b-cdn.net/58fd343d-38bc-4708-90c1-4fb7f4f449aa?optimizer=gif';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col overflow-y-auto bg-white text-slate-900">
            {/* Hero — uses available height between header and features (lg+). */}
            <section className="flex-1 px-4 sm:px-6 lg:flex lg:items-center lg:px-8 lg:min-h-0">
                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 py-8 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:py-0">
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
                            className="w-full max-h-[260px] object-contain sm:max-h-[300px] lg:max-h-[360px]"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">为什么选择我们</h2>
                        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">我们的优势</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 md:mt-8 md:grid-cols-2">
                        {FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                                        <Icon className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <p className="text-sm font-medium leading-5 text-slate-800 sm:text-[15px]">{f.title}</p>
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
