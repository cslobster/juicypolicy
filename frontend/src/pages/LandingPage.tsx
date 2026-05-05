import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Users, ShieldPlus } from 'lucide-react';
import { Button } from '../components/ui/button';

const HERO_IMAGE = 'https://unicorn-images.b-cdn.net/58fd343d-38bc-4708-90c1-4fb7f4f449aa?optimizer=gif';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full overflow-y-auto bg-white text-slate-900">
            {/* Hero */}
            <section className="bg-white px-4 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24">
                    <div>
                        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                            欢迎来到鲜橙保险
                        </h1>
                        <p className="mt-5 max-w-md text-lg leading-7 text-slate-600">
                            我们提供最优质的健康保险和人寿保险。
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                onClick={() => navigate('/agent/sisi')}
                                className="h-12 rounded-lg bg-[#ff6b2c] px-6 text-base text-white hover:bg-[#f05f22] shadow-sm"
                            >
                                开始您的保险之旅
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
                        <img
                            src={HERO_IMAGE}
                            alt="鲜橙保险插画"
                            className="w-full"
                            loading="lazy"
                        />
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
