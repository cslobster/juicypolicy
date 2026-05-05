import { Link } from 'react-router-dom';
import { Users, FileText, UserCircle, Megaphone, PenLine, Settings, GraduationCap, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const features = [
    { icon: FileText, title: '保险报价', desc: '实时报价，几秒生成方案。' },
    { icon: UserCircle, title: '客户管理', desc: '客户线索自动归类。' },
    { icon: Megaphone, title: '市场推广', desc: '海报、文案、短视频一键生成。' },
    { icon: PenLine, title: '文案制作', desc: '中英双语营销文案模板。' },
    { icon: Settings, title: '佣金管理', desc: '跟踪佣金、对账与提现。' },
    { icon: GraduationCap, title: '行业培训', desc: '产品、销售与合规培训。' },
];

const AgentsMarketingPage = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-b from-orange-50/40 via-white to-slate-50">
            <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
                <div className="mx-auto max-w-5xl text-center">
                    <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                        <Users className="h-7 w-7 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">加入鲜橙代理网络</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                        专属报价站点 + 完整展业工具，专注服务客户。
                    </p>
                    <div className="mt-7 flex items-center justify-center gap-3">
                        <Link to="/login">
                            <Button size="lg" className="rounded-full px-6">
                                代理登录
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="mailto:agents@juicypolicy.com" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900">
                            申请加入 →
                        </a>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-20">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-center text-2xl font-bold text-slate-900">加入即可获得</h2>
                    <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
                        代理后台内置以下功能模块，登录后即可使用。
                    </p>
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => {
                            const Icon = f.icon;
                            return (
                                <Card key={f.title}>
                                    <CardContent className="pt-6">
                                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                                            <Icon className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                                        <p className="mt-1.5 text-sm leading-6 text-slate-600">{f.desc}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AgentsMarketingPage;
