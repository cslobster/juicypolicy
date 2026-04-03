import { Users, Globe, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

const AgentsPage = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4">
            <div className="max-w-lg w-full text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                    <Users className="h-8 w-8 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4">经纪网络</h1>
                <p className="text-[#0d0d0d] text-[15px] leading-[1.7] mb-8">
                    加入鲜橙保险经纪网络，我们将为每位经纪人生成专属独立站点，帮助您高效展示产品、获取客户报价、管理业务。
                </p>

                <Card className="text-left mb-6">
                    <CardContent className="pt-6">
                        <h3 className="font-serif text-lg font-semibold mb-4">经纪专属站点包含</h3>
                        <ul className="space-y-3 text-sm text-[#0d0d0d]">
                            <li className="flex items-start gap-3">
                                <Globe className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <span>个性化品牌页面，展示您的专业资质与服务范围</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Globe className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <span>在线报价系统，客户可直接通过您的站点获取保险报价</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Globe className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <span>客户管理工具，追踪潜在客户与保单状态</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="text-left">
                    <CardContent className="pt-6">
                        <h3 className="font-serif text-lg font-semibold mb-4">联系我们了解详情</h3>
                        <div className="space-y-3 text-sm text-[#0d0d0d]">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>agents@juicypolicy.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>(888) 888-8888</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AgentsPage;
