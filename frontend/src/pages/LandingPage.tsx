import { useNavigate } from 'react-router-dom';
import { PlayCircle, FileHeart, Stethoscope, Heart, Globe2, Pill, Activity, FileText, Hospital, Sparkles, Award, BarChart2, FileSignature, FileSearch, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/button';

const SERVICES = [
    { icon: Sparkles, title: '即时客制化并挑选合适产品' },
    { icon: BarChart2, title: '实时保单优势及回报对比' },
    { icon: Award, title: '全美顶尖保险公司承保' },
    { icon: FileSignature, title: '线上电子签字、自动递交一个或多个申请' },
    { icon: FileSearch, title: '一键同步医疗记录及上传文件' },
    { icon: UserCheck, title: '可选择专家帮助或自行完成申请，无需通过保险代理人' },
];

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

            {/* Services */}
            <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">我们提供的服务</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            我们使用大数据和保险科技为您选择最合适的高回报产品。
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
                        {/* Service icons grid */}
                        <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            {SERVICES.map((s) => {
                                const Icon = s.icon;
                                return (
                                    <li key={s.title} className="flex flex-col items-start">
                                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                            <Icon className="h-6 w-6 text-blue-700" />
                                        </div>
                                        <p className="text-sm font-medium leading-6 text-slate-800">{s.title}</p>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Illustration block (placeholder; swap with real artwork when available) */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-white to-slate-100 ring-1 ring-slate-200/70">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Stethoscope className="h-32 w-32 text-blue-200" />
                            </div>
                            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/60">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-medium text-slate-700">实时报价</span>
                            </div>
                            <div className="absolute right-6 bottom-6 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/60">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                <span className="text-xs font-medium text-slate-700">高回报产品</span>
                            </div>
                        </div>
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

export default LandingPage;
