import { Citrus, MapPin, Cpu, Shield, Heart, Zap } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

const AboutPage = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-100">
            {/* Hero */}
            <div className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                    <Citrus className="h-8 w-8 text-orange-500" />
                </div>
                <h1 className="text-4xl font-bold mb-6">关于鲜橙保险</h1>
                <p className="text-[17px] leading-[1.8] text-[#0d0d0d]">
                    鲜橙保险是一家总部位于加州的新一代保险科技公司。我们以 AI 为核心驱动力，致力于为在美华人提供更智能、更透明、更高效的保险体验。
                </p>
            </div>

            {/* Mission */}
            <div className="max-w-3xl mx-auto px-6 pb-12">
                <Card>
                    <CardContent className="pt-8 pb-8">
                        <h2 className="font-serif text-2xl font-semibold mb-6 text-center">我们的使命</h2>
                        <p className="text-[15px] leading-[1.8] text-[#0d0d0d] text-center max-w-xl mx-auto">
                            让每一位在美华人都能轻松获得适合自己的保险保障。不再被语言障碍、信息不对称和复杂条款所困扰——用科技消除保险行业的摩擦，让保障回归简单。
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Why us */}
            <div className="max-w-3xl mx-auto px-6 pb-16">
                <h2 className="font-serif text-2xl font-semibold mb-8 text-center">为什么选择鲜橙</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="transition hover:-translate-y-1 hover:shadow-md">
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Cpu className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[15px] mb-1">AI 原生</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        从第一天起就以人工智能为核心构建。智能比价、风险评估、个性化推荐——AI 贯穿每一个环节。
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition hover:-translate-y-1 hover:shadow-md">
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Heart className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[15px] mb-1">专为华人设计</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        全中文界面，深谙华人家庭的保障需求。从留学生到新移民，从个人到家庭，量身定制。
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition hover:-translate-y-1 hover:shadow-md">
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[15px] mb-1">多维比价，透明公正</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        同时对接多家顶级保险公司，实时比价。没有隐藏费用，没有偏向推荐，只为您找到最优方案。
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition hover:-translate-y-1 hover:shadow-md">
                        <CardContent className="pt-6 pb-6">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[15px] mb-1">极速体验</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        几分钟内完成报价与投保，告别繁琐的纸质流程。线上全流程，随时随地，触手可及。
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Location */}
            <div className="max-w-3xl mx-auto px-6 pb-16 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>California, United States</span>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
