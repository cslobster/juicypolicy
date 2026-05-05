import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, MessageCircle, Users, ShieldCheck, Globe, Clock, Award, ChevronRight, FileText, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import heroImage from '../assets/coveredca-enrollment-hero.png';

// Carrier logos served by Catch's CDN — same source we use in the quote results.
const carrierLogo = (slug: string) => `https://s.catch.co/img/carriers/${slug}.png`;
const CARRIERS = [
    { slug: 'kaiser', name: 'Kaiser Permanente' },
    { slug: 'bcbs', name: 'Blue Shield' },
    { slug: 'anthemca', name: 'Anthem Blue Cross' },
    { slug: 'healthnet', name: 'Health Net' },
    { slug: 'molina', name: 'Molina' },
    { slug: 'oscar', name: 'Oscar' },
];

const FEATURES = [
    { icon: Clock, title: '实时报价', desc: '直连官方数据源，几秒生成方案。' },
    { icon: Sparkles, title: 'AI 保险顾问', desc: '中英双语解答保险疑问。' },
    { icon: ShieldCheck, title: '透明费用', desc: '保费、免赔额、自付一目了然。' },
    { icon: MessageCircle, title: '微信对接', desc: '支持微信、短信、电话联系顾问。' },
    { icon: Globe, title: '中英双语', desc: '中文界面，英文术语随时切换。' },
];

const SOLUTIONS = [
    {
        icon: Users,
        title: '个人与家庭',
        desc: '为您和您的家庭找到最合适的健康保险方案，享受所有可用的税收抵免。',
        cta: '开始报价',
        to: '/quote/health',
    },
    {
        icon: Award,
        title: '保险经纪',
        desc: '加入鲜橙经纪网络，获取专属报价站点、客户管理后台和分享素材。',
        cta: '了解经纪服务',
        to: '/agents',
    },
    {
        icon: FileText,
        title: '企业团体',
        desc: '为团队提供集中报价和投保管理，简化福利对接流程。',
        cta: '联系销售',
        to: '/about',
    },
];

const ALT_BLOCKS = [
    {
        eyebrow: '实时数据',
        title: '一次填写，秒级出单。',
        body: '我们直接接入 HealthSherpa 实时数据源，无需排队等候。填写邮编、年龄、家庭人数和收入，即刻获取所在县所有可投保的健康保险计划。',
        bullets: ['ACA 合规计划', '所有可用税收抵免', '县级精准报价'],
        cta: { label: '试一下', to: '/quote/health' },
        side: 'right',
    },
    {
        eyebrow: 'AI 顾问',
        title: '不懂保险术语？AI 帮您讲清楚。',
        body: '问"哪个计划最划算"、"门诊费多少"、"HSA 有什么用"，AI 顾问会结合您的报价数据用中文给出答案。',
        bullets: ['计划对比', '费用预估', '术语解释'],
        cta: { label: '查看示例', to: '/quote/health' },
        side: 'left',
    },
    {
        eyebrow: '经纪后台',
        title: '为经纪人量身打造的展业工具。',
        body: '专属报价 URL、客户线索归类、分享海报、佣金管理——所有展业需要的工具都在一个后台里。',
        bullets: ['专属报价站点', 'VIP 客户分类', '分享素材一键生成'],
        cta: { label: '加入经纪网络', to: '/agents' },
        side: 'right',
    },
];

const METRICS = [
    { value: '30+', label: '可选保险计划' },
    { value: '5+', label: '主流保险公司' },
    { value: '<10s', label: '报价响应时间' },
];

const TESTIMONIALS = [
    {
        quote: '以前要打很多电话才能搞清楚不同计划的差别，现在几分钟就看完了。',
        name: '王女士',
        role: '橙县家庭',
    },
    {
        quote: 'AI 顾问回答得很专业，特别是 HDHP 和 HSA 的区别讲得很清楚。',
        name: '李先生',
        role: '湾区',
    },
    {
        quote: '专属链接让客户直接看到我的联系方式，签单效率提高很多。',
        name: 'Sisi H.',
        role: '保险经纪',
    },
];

const FAQS = [
    {
        title: '什么是 ACA 计划？',
        body: 'ACA（《平价医疗法案》）合规的健康保险计划包含 10 项基本保障，并按家庭收入提供税收抵免。',
    },
    {
        title: '报价免费吗？',
        body: '是的，鲜橙保险的报价服务对客户完全免费。',
    },
    {
        title: '如何联系真人顾问？',
        body: '通过经纪人专属链接获取报价后，可直接与该经纪人电话或微信沟通。',
    },
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full overflow-y-auto bg-white text-slate-900">
            {/* 1. Hero */}
            <section className="relative px-4 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 py-12 lg:grid-cols-[1fr_440px] lg:gap-12 lg:py-24">
                    <div>
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                            <Sparkles className="h-3.5 w-3.5" /> 实时数据 · 中英双语 · AI 顾问
                        </p>
                        <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                            为您找到合适的<br />健康保险方案。
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                            填写几个基本信息，几秒内查看您所在县所有可投保的方案。配套 AI 顾问，全程中文协助。
                        </p>
                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                onClick={() => navigate('/quote/health')}
                                className="h-12 rounded-full bg-[#ff6b2c] px-6 text-base text-white hover:bg-[#f05f22]"
                            >
                                开始报价
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Link to="/agents" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                                我是经纪人 →
                            </Link>
                        </div>
                        <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                            {['健康保险实时报价', 'AI 顾问协助投保', '所有可用税收抵免', '清晰费用对比'].map((p) => (
                                <li key={p} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0f766e]" /> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative mx-auto w-full max-w-[440px] lg:justify-self-end">
                        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.45)]">
                            <img src={heroImage} alt="家庭正在在线查看健康保险投保方案" className="h-[320px] w-full object-cover sm:h-[380px]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Logo strip */}
            <section className="border-y border-slate-100 bg-slate-50/60 py-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                        我们对接的保险公司
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
                        {CARRIERS.map((c) => (
                            <div
                                key={c.slug}
                                title={c.name}
                                className="flex items-center gap-2 grayscale opacity-70 transition hover:grayscale-0 hover:opacity-100"
                            >
                                <img src={carrierLogo(c.slug)} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                                <span className="text-sm font-medium text-slate-700 hidden sm:inline">{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Feature grid */}
            <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">为什么选择鲜橙</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">买保险，从未如此简单。</h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                                        <Icon className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <h3 className="text-base font-semibold">{f.title}</h3>
                                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 4. Solutions 3-col */}
            <section className="bg-slate-50/60 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">服务对象</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">为不同角色提供完整方案。</h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {SOLUTIONS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <Card key={s.title} className="overflow-hidden">
                                    <div className="h-32 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                                        <Icon className="h-12 w-12 text-orange-500" />
                                    </div>
                                    <CardContent className="pt-6">
                                        <h3 className="text-lg font-semibold">{s.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{s.desc}</p>
                                        <Link to={s.to} className="mt-4 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700">
                                            {s.cta} <ChevronRight className="ml-0.5 h-4 w-4" />
                                        </Link>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. Alternating feature blocks */}
            <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl space-y-20 lg:space-y-28">
                    {ALT_BLOCKS.map((b) => (
                        <div
                            key={b.title}
                            className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                                b.side === 'left' ? 'lg:[&>*:first-child]:order-2' : ''
                            }`}
                        >
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">{b.eyebrow}</p>
                                <h3 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{b.title}</h3>
                                <p className="mt-4 text-base leading-7 text-slate-600">{b.body}</p>
                                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                                    {b.bullets.map((bullet) => (
                                        <li key={bullet} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0f766e]" />
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to={b.cta.to}
                                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
                                >
                                    {b.cta.label} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 ring-1 ring-orange-100/60 flex items-center justify-center">
                                <Sparkles className="h-20 w-20 text-orange-300/60" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. Metrics band */}
            <section className="border-y border-slate-100 bg-slate-50/60 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 text-center">
                    {METRICS.map((m) => (
                        <div key={m.label}>
                            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{m.value}</p>
                            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">{m.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. Testimonials */}
            <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">用户反馈</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">客户与经纪人怎么说</h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {TESTIMONIALS.map((t) => (
                            <Card key={t.name}>
                                <CardContent className="pt-6">
                                    <div className="mb-3 flex gap-0.5 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-base leading-7 text-slate-800">"{t.quote}"</p>
                                    <div className="mt-5 border-t border-slate-100 pt-4 text-sm">
                                        <p className="font-semibold text-slate-900">{t.name}</p>
                                        <p className="text-slate-500">{t.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. FAQ / Insights */}
            <section className="bg-slate-50/60 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">常见问题</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">您可能想知道</h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {FAQS.map((f) => (
                            <Card key={f.title}>
                                <CardContent className="pt-6">
                                    <h3 className="text-base font-semibold">{f.title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">{f.body}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. Final CTA */}
            <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">现在就来获取您的报价。</h2>
                    <p className="mt-3 text-base text-slate-600">几秒内查看您所在县所有可投保的方案。</p>
                    <div className="mt-7">
                        <Button
                            size="lg"
                            onClick={() => navigate('/quote/health')}
                            className="h-12 rounded-full bg-[#ff6b2c] px-7 text-base text-white hover:bg-[#f05f22]"
                        >
                            开始报价
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* 10. Footer */}
            <footer className="border-t border-slate-200 bg-slate-950 text-slate-400">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                        <div className="col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 text-white">
                                <span className="text-base font-semibold">鲜橙保险</span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-500">
                                JuicyPolicy 致力于为华人社区提供透明、便捷的健康保险服务。
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">产品</p>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link to="/quote/health" className="hover:text-white">健康保险报价</Link></li>
                                <li><Link to="/agents" className="hover:text-white">经纪网络</Link></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">公司</p>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link to="/about" className="hover:text-white">关于我们</Link></li>
                                <li><a href="mailto:hello@juicypolicy.com" className="hover:text-white">联系我们</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">支持</p>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link to="/login" className="hover:text-white">经纪登录</Link></li>
                                <li><a href="mailto:agents@juicypolicy.com" className="hover:text-white">经纪人合作</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} 鲜橙保险 JuicyPolicy. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
