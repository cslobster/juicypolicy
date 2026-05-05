import { useNavigate, Link } from 'react-router-dom';
import { Users, ShieldPlus, PlayCircle, ArrowRight, FileHeart, Stethoscope, Heart, Globe2, Pill, Activity, FileText, Hospital } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full overflow-y-auto bg-white text-slate-900">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
                {/* Background icon pattern */}
                <div aria-hidden className="pointer-events-none absolute inset-0 select-none text-slate-200/70">
                    <FileHeart className="absolute h-20 w-20 -left-4 top-12" />
                    <Stethoscope className="absolute h-24 w-24 right-6 top-8" />
                    <Heart className="absolute h-16 w-16 left-1/4 bottom-6" />
                    <Globe2 className="absolute h-24 w-24 right-1/4 bottom-2" />
                    <Pill className="absolute h-16 w-16 left-2/3 top-1/2" />
                    <Activity className="absolute h-20 w-20 left-12 top-1/2" />
                    <FileText className="absolute h-16 w-16 right-12 top-1/2" />
                    <Hospital className="absolute h-20 w-20 right-1/3 top-10" />
                </div>

                <div className="relative mx-auto max-w-5xl py-20 sm:py-28 lg:py-36">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            为您提供最好的<br />健康保险产品
                        </h1>
                        <p className="mt-5 text-lg leading-7 text-slate-600">
                            即刻线上申请，无需见保险代理。
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                onClick={() => navigate('/agent/sisi')}
                                className="h-12 rounded-lg bg-slate-900 px-6 text-base text-white hover:bg-slate-800 shadow-sm"
                            >
                                开始体验
                            </Button>
                            <button
                                type="button"
                                onClick={() => alert('视频即将上线，敬请期待。')}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-5 text-base font-medium text-slate-900 hover:bg-white"
                            >
                                <PlayCircle className="h-5 w-5" />
                                观看影片
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">为什么选择我们</h2>
                        <p className="mt-3 text-base text-slate-600">我们的优势</p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FeatureCard
                            icon={<Users className="h-5 w-5 text-orange-500" />}
                            title="专业的代理人"
                            desc="我们的代理人都经过严格的培训，为您提供最专业的服务。"
                            cta="了解更多"
                            to="/agents"
                        />
                        <FeatureCard
                            icon={<ShieldPlus className="h-5 w-5 text-orange-500" />}
                            title="全面的保险服务"
                            desc="我们提供全面的健康保险和人寿保险，满足您的所有需求。"
                            cta="了解更多"
                            to="/agent/sisi"
                        />
                    </div>

                    <div className="mt-12 flex justify-center">
                        <a
                            href="mailto:hello@juicypolicy.com"
                            className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-lg border border-orange-500 px-6 text-sm font-medium text-orange-600 hover:bg-orange-50"
                        >
                            联系我们
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-slate-600">
                        &copy; {new Date().getFullYear()} 鲜橙保险 JuicyPolicy. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    cta: string;
    to: string;
}> = ({ icon, title, desc, cta, to }) => (
    <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
            {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>
        <Link
            to={to}
            className="mt-5 inline-flex h-11 min-w-[140px] items-center justify-center gap-1.5 rounded-lg border border-orange-500 px-5 text-sm font-medium text-orange-600 hover:bg-orange-50"
        >
            {cta}
            <ArrowRight className="h-4 w-4" />
        </Link>
    </div>
);

export default LandingPage;
