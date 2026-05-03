import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import heroImage from '../assets/coveredca-enrollment-hero.png';

const points = [
    '健康保险实时报价',
    'AI顾问协助投保',
    '清楚比较保费、免赔额和常见看病费用',
];

const steps = [
    ['填写信息', '输入邮编、年龄、家庭人数和预估收入。'],
    ['比较计划', '查看不同保险计划的关键费用和保障差异。'],
    ['继续投保', '选定计划后进入信息确认和投保流程。'],
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full overflow-hidden bg-[#fbfaf6] text-slate-950">
            <section className="relative h-full">
                <main className="mx-auto flex h-full max-w-6xl flex-col px-5 pb-36 pt-52 sm:px-6 lg:px-8">
                    <section className="grid shrink-0 grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_430px]">
                        <div className="max-w-2xl">
                            <p className="max-w-xl text-lg leading-8 text-slate-600">
                                为您找到合适的保险方案。
                            </p>

                            <div className="mt-6 flex">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/quote/health')}
                                    className="h-11 rounded-full bg-[#ff6b2c] px-6 text-base text-white hover:bg-[#f05f22]"
                                >
                                    开始报价
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>

                            <div className="mt-5 space-y-2">
                                {points.map((point) => (
                                    <div key={point} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0f766e]" />
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-[430px] lg:justify-self-end">
                            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.7)]">
                                <img
                                    src={heroImage}
                                    alt="家庭正在在线查看健康保险投保方案"
                                    className="h-[300px] w-full object-cover"
                                />
                            </div>
                        </div>
                    </section>
                </main>

                {/* 3-step section, absolutely anchored to overlap the dark bar */}
                <section className="pointer-events-none absolute inset-x-0 bottom-[160px] z-10 px-5 sm:px-6 lg:px-8">
                    <div className="pointer-events-auto mx-auto max-w-6xl">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-orange-600">投保流程</p>
                                <h2 className="mt-1 text-2xl font-bold">三步完成计划选择</h2>
                            </div>
                            <div className="hidden items-center gap-2 text-sm text-slate-600 lg:flex">
                                <MessageCircle className="h-4 w-4 text-[#0f766e]" />
                                选择计划后，可以继续询问保费、免赔额、门诊、急诊和处方药费用。
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            {steps.map(([title, desc], index) => (
                                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.25)]">
                                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                    <p className="mt-1.5 text-sm leading-5 text-slate-600">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-between bg-[#103b35] px-10 py-4 text-white">
                    <div className="flex items-start gap-3">
                        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                        <div>
                            <h2 className="text-base font-bold text-white">需要先问清楚再选择？</h2>
                            <p className="mt-1 text-sm text-white/75">
                                可以继续询问保费、免赔额、门诊、急诊和处方药费用。
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/quote/health')} size="sm" className="hidden rounded-full bg-white px-5 text-[#103b35] hover:bg-orange-50 sm:inline-flex">
                        获取报价
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white py-3 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} 鲜橙保险 JuicyPolicy. All rights reserved.
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
