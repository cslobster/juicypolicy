import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, CheckCircle2, ShieldAlert, Star, Plus, Trash, ArrowUp, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

interface QuotePlan {
    id: string;
    name: string;
    tag?: string;
    underwriter: string;
    price: string;
    period: string;
    policyMax: string;
    deductible: string;
    features: string[];
}

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: string[];
    quotesList?: QuotePlan[];
    isTyping?: boolean;
    interactiveWidget?: 'country_selector' | 'travel_details' | 'enrollment_form' | 'payment_checkout';
    selectedPlanContext?: QuotePlan;
    imageUrl?: string;
}

const COUNTRIES = [
    '中国 (China)',
    '美国 (United States)',
    '加拿大 (Canada)',
    '英国 (United Kingdom)',
    '澳大利亚 (Australia)',
    '日本 (Japan)',
    '韩国 (South Korea)',
    '德国 (Germany)',
    '法国 (France)',
    '其他国家 (Other)'
];

const TravelDetailsWidget: React.FC<{ onSubmit: (text: string, data: any) => void }> = ({ onSubmit }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [primaryAge, setPrimaryAge] = useState('50');
    const [spouseAge, setSpouseAge] = useState('');
    const [childAges, setChildAges] = useState<string[]>([]);

    const handleAddChild = () => setChildAges([...childAges, '']);
    const updateChildAge = (idx: number, val: string) => {
        const newAges = [...childAges];
        newAges[idx] = val;
        setChildAges(newAges);
    };
    const removeChild = (idx: number) => {
        setChildAges(childAges.filter((_, i) => i !== idx));
    };

    const isValid = startDate && endDate && primaryAge;

    const handleSubmit = () => {
        if (!isValid) return;
        let text = `出发: ${startDate}, 返回: ${endDate}. 主申年龄: ${primaryAge}.`;
        if (spouseAge) text += ` 配偶年龄: ${spouseAge}.`;
        if (childAges.length > 0) text += ` 儿童年龄: ${childAges.filter(a => a).join(', ')}.`;

        onSubmit(text, { startDate, endDate, primaryAge, spouseAge, childAges });
    };

    return (
        <Card className="animate-fade-in mt-6">
            <CardContent className="pt-6">
                <h4 className="mb-4 text-primary font-serif">行程日期</h4>
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">开始日期</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">结束日期</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>

                <h4 className="mb-4 text-primary font-serif">投保人年龄</h4>
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">主申请人</label>
                        <Input type="number" placeholder="年龄" value={primaryAge} onChange={e => setPrimaryAge(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">配偶</label>
                        <Input type="number" placeholder="年龄（可选）" value={spouseAge} onChange={e => setSpouseAge(e.target.value)} />
                    </div>
                </div>

                {childAges.map((age, idx) => (
                    <div key={idx} className="flex gap-4 mb-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm mb-1 text-foreground">儿童 {idx + 1}</label>
                            <Input type="number" placeholder="年龄" value={age} onChange={e => updateChildAge(idx, e.target.value)} />
                        </div>
                        <button onClick={() => removeChild(idx)} className="bg-transparent border-none text-destructive cursor-pointer p-2">
                            <Trash size={18} />
                        </button>
                    </div>
                ))}

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddChild}
                    className="mb-6 flex items-center gap-2"
                >
                    <Plus size={16} /> 添加儿童
                </Button>

                <Button className="w-full" onClick={handleSubmit} disabled={!isValid}>
                    生成报价
                </Button>
            </CardContent>
        </Card>
    );
};

const EnrollmentFormWidget: React.FC<{ plan: QuotePlan, travelData: any, onSubmit: (text: string) => void }> = ({ plan, travelData, onSubmit }) => {
    // Contact State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Insured State
    const [primaryName, setPrimaryName] = useState({ first: '', last: '', dob: '', gender: '', govId: '' });
    const [spouseName, setSpouseName] = useState({ first: '', last: '', dob: '', gender: '', govId: '' });
    const [childNames, setChildNames] = useState<any[]>(travelData?.childAges?.map(() => ({ first: '', last: '', dob: '', gender: '', govId: '' })) || []);

    // Address State
    const [residence, setResidence] = useState({ country: 'China', addr1: '', addr2: '', city: '', state: '', zip: '' });
    const [mailing, setMailing] = useState({ sameAsResidence: true, country: '', addr1: '', addr2: '', city: '', state: '', zip: '' });

    const isValid = email && phone && primaryName.first && primaryName.last && primaryName.dob && residence.country && residence.addr1;

    const updateChild = (idx: number, field: string, val: string) => {
        const newChildren = [...childNames];
        newChildren[idx] = { ...newChildren[idx], [field]: val };
        setChildNames(newChildren);
    };

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit(`已填写入保信息: ${primaryName.first} ${primaryName.last}, 联系方式: ${email}, ${phone}`);
    };

    return (
        <Card className="animate-fade-in mt-6 bg-slate-50 shadow-md">
            <CardContent className="pt-6">
                <h3 className="text-primary mb-6 text-xl font-serif">入保信息填写 - {plan.name}</h3>

                {/* Contact Information */}
                <div className="mb-8">
                    <h4 className="text-primary mb-4 pb-2 border-b border-input text-lg font-serif">联系方式</h4>
                    <p className="text-xs text-muted-foreground mb-4">请填写您的邮箱和电话，我们将通过此方式发送保单和通知。</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                         <div>
                            <label className="block text-sm mb-1 text-foreground font-medium">邮箱</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-sm mb-1 text-foreground font-medium">电话号码</label>
                            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                         </div>
                    </div>
                </div>

                {/* Insured(s) Information */}
                <div className="mb-8">
                    <h4 className="text-primary mb-4 pb-2 border-b border-input text-lg font-serif">投保人信息</h4>
                    <p className="text-xs text-muted-foreground mb-4">请填写每位投保人的信息以确保承保。</p>

                    <div className="bg-white p-6 rounded-xl border border-input mb-4">
                        <Badge className="mb-4">主申请人</Badge>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">名（First & Middle Name）</label>
                                <Input type="text" value={primaryName.first} onChange={e => setPrimaryName({...primaryName, first: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">姓（Last Name）</label>
                                <Input type="text" value={primaryName.last} onChange={e => setPrimaryName({...primaryName, last: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">出生日期</label>
                                <Input type="date" value={primaryName.dob} onChange={e => setPrimaryName({...primaryName, dob: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">性别</label>
                                <select value={primaryName.gender} onChange={e => setPrimaryName({...primaryName, gender: e.target.value})} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <option value="">请选择</option>
                                    <option value="Male">男</option>
                                    <option value="Female">女</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">证件号码</label>
                                <Input type="text" placeholder="可选" value={primaryName.govId} onChange={e => setPrimaryName({...primaryName, govId: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {travelData?.spouseAge && (
                        <div className="bg-white p-6 rounded-xl border border-input mb-4">
                            <Badge className="mb-4">配偶</Badge>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                                <div><label className="block text-sm mb-1 text-foreground font-medium">名</label><Input type="text" value={spouseName.first} onChange={e => setSpouseName({...spouseName, first: e.target.value})} /></div>
                                <div><label className="block text-sm mb-1 text-foreground font-medium">姓</label><Input type="text" value={spouseName.last} onChange={e => setSpouseName({...spouseName, last: e.target.value})} /></div>
                                <div><label className="block text-sm mb-1 text-foreground font-medium">出生日期</label><Input type="date" value={spouseName.dob} onChange={e => setSpouseName({...spouseName, dob: e.target.value})} /></div>
                            </div>
                        </div>
                    )}

                    {travelData?.childAges?.map((age: string, idx: number) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-input mb-4">
                            <Badge className="mb-4">儿童 {idx + 1}（年龄: {age}）</Badge>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                                <div><label className="block text-sm mb-1 text-foreground font-medium">名</label><Input type="text" value={childNames[idx]?.first} onChange={e => updateChild(idx, 'first', e.target.value)} /></div>
                                <div><label className="block text-sm mb-1 text-foreground font-medium">姓</label><Input type="text" value={childNames[idx]?.last} onChange={e => updateChild(idx, 'last', e.target.value)} /></div>
                                <div><label className="block text-sm mb-1 text-foreground font-medium">出生日期</label><Input type="date" value={childNames[idx]?.dob} onChange={e => updateChild(idx, 'dob', e.target.value)} /></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Residence Address */}
                <div className="mb-8">
                    <h4 className="text-primary mb-4 pb-2 border-b border-input text-lg font-serif">居住地址</h4>
                    <p className="text-xs text-muted-foreground mb-4">请填写您的主要居住地址。</p>
                    <div className="flex flex-col gap-4">
                         <div>
                            <label className="block text-sm mb-1 text-foreground font-medium">国家</label>
                            <Input type="text" value={residence.country} onChange={e => setResidence({...residence, country: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">地址 1</label>
                                <Input type="text" value={residence.addr1} onChange={e => setResidence({...residence, addr1: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">地址 2（公寓/套房号）</label>
                                <Input type="text" placeholder="可选" value={residence.addr2} onChange={e => setResidence({...residence, addr2: e.target.value})} />
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                            <div><label className="block text-sm mb-1 text-foreground font-medium">城市</label><Input type="text" value={residence.city} onChange={e => setResidence({...residence, city: e.target.value})} /></div>
                            <div><label className="block text-sm mb-1 text-foreground font-medium">州/省</label><Input type="text" value={residence.state} onChange={e => setResidence({...residence, state: e.target.value})} /></div>
                            <div><label className="block text-sm mb-1 text-foreground font-medium">邮编</label><Input type="text" value={residence.zip} onChange={e => setResidence({...residence, zip: e.target.value})} /></div>
                         </div>
                    </div>
                </div>

                {/* Mailing Address */}
                <div className="mb-8">
                    <h4 className="text-primary mb-4 pb-2 border-b border-input text-lg font-serif">邮寄地址</h4>
                    <p className="text-xs text-muted-foreground mb-4">请填写您接收邮件的地址。</p>
                    <div className="flex gap-4 items-center mb-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={mailing.sameAsResidence} onChange={e => setMailing({...mailing, sameAsResidence: e.target.checked})} />
                            与居住地址相同
                        </label>
                    </div>
                    {!mailing.sameAsResidence && (
                        <div className="flex flex-col gap-4">
                            <div><label className="block text-sm mb-1 text-foreground font-medium">国家</label><Input type="text" value={mailing.country} onChange={e => setMailing({...mailing, country: e.target.value})} /></div>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                                <div><label className="block text-sm mb-1 text-foreground font-medium">地址 1</label><Input type="text" value={mailing.addr1} onChange={e => setMailing({...mailing, addr1: e.target.value})} /></div>
                                <div><label className="block text-sm mb-1 text-foreground font-medium">地址 2</label><Input type="text" value={mailing.addr2} onChange={e => setMailing({...mailing, addr2: e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                </div>

                <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit} disabled={!isValid}>
                    提交承保信息
                </Button>
            </CardContent>
        </Card>
    );
};

const PaymentCheckoutWidget: React.FC<{ plan: QuotePlan, onSubmit: (text: string) => void }> = ({ plan, onSubmit }) => {
    const [nameOnCard, setNameOnCard] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const isValid = nameOnCard && cardNumber && expiry && cvv;

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit(`支付已完成`);
    };

    return (
        <Card className="animate-fade-in mt-6 bg-slate-50 shadow-md">
            <CardContent className="pt-6">
                <h3 className="text-primary mb-6 text-xl font-serif">安全支付</h3>
                <div className="mb-6 p-5 bg-white rounded-xl border border-input">
                    <div className="flex justify-between mb-2 items-center">
                        <span className="font-semibold text-foreground">支付总额</span>
                        <span className="text-xl font-extrabold text-primary">{plan.price}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">保单: {plan.name}</div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <div>
                        <label className="block text-sm mb-1 text-foreground font-medium">持卡人姓名 *</label>
                        <Input type="text" value={nameOnCard} onChange={e => setNameOnCard(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-foreground font-medium">卡号 *</label>
                        <Input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-foreground font-medium">有效期 *</label>
                            <Input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-foreground font-medium">CVV *</label>
                            <Input type="text" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" />
                        </div>
                    </div>
                </div>

                <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit} disabled={!isValid}>
                    确认支付
                </Button>
            </CardContent>
        </Card>
    );
};

const QuotePage: React.FC = () => {
    const [step, setStep] = useState(1);
    const location = useLocation();
    const typeParam = new URLSearchParams(location.search).get('type') || 'unknown';

    const typeMap: Record<string, string> = {
        'travel': '旅行保险',
        'auto': '汽车保险',
        'property': '财产与房屋',
        'term-life': '定期寿险',
        'whole-life': '终身寿险',
        'other': '其他保障',
    };

    const selectedType = typeMap[typeParam] || '保险';

    const steps = [
        { num: 1, label: '开始' },
        { num: 2, label: '保障计划' },
        { num: 3, label: '多重报价' },
        { num: 4, label: '信息确认' },
        { num: 5, label: '完成' }
    ];

    const initialGreeting = selectedType === '旅行保险'
        ? `为了给您提供准确的报价，请问您的国籍和目前的居住国是哪里？`
        : `首先，请问您所在美国哪个州，或者您的邮编是多少？`;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'bot',
            text: initialGreeting,
            interactiveWidget: selectedType === '旅行保险' ? 'country_selector' : undefined
        }
    ]);

    const [input, setInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [chatStage, setChatStage] = useState(1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [travelData, setTravelData] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<QuotePlan | null>(null);

    // Widget States
    const [citizenship, setCitizenship] = useState('');
    const [residence, setResidence] = useState('');

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isBotTyping]);

    const simulateBotResponse = (userText: string, widgetData?: any) => {
        setIsBotTyping(true);
        setStep(Math.min(chatStage + 1, 4));

        setTimeout(() => {
            setIsBotTyping(false);
            let newBotMsg: Message | null = null;

            // ====== TRAVEL INSURANCE FLOW ======
            if (selectedType === '旅行保险') {
                if (chatStage === 1) { // After country selector
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `已记录您的国籍与居住地信息。接下来，请问您此次旅行的主要目的地是哪个国家或地区？`,
                        options: ['美国 (包含全球保障)', '申根区域 (欧洲)', '日本', '其他']
                    };
                    setChatStage(2);
                } else if (chatStage === 2) { // After destination
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `收到目的地【${userText}】。为了准确计算保费，请填写您的具体出行日期，以及所有投保人的年龄信息：`,
                        interactiveWidget: 'travel_details'
                    };
                    setChatStage(3);
                } else if (chatStage === 3) { // After travel details
                    if (widgetData) setTravelData(widgetData);
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `日期及人员信息确认完毕。鲜橙保险正在实时为您从市场抓取最优的旅行险产品对比...`
                    };
                    setChatStage(4);
                    setTimeout(() => triggerQuoteGeneration('travel'), 2000);
                } else if (chatStage === 5) { // After enrollment form
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `信息记录成功，核保已初步通过！最后一步，请使用借记卡/信用卡安全支付您的保费：`,
                        interactiveWidget: 'payment_checkout',
                        selectedPlanContext: selectedPlan || undefined
                    };
                    setChatStage(6);
                } else if (chatStage === 6) { // After payment
                    setStep(5);
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `🎉 支付成功！恭喜，您已成功完成投保。电子保单将在几分钟内发送至您的邮箱。感谢您使用鲜橙保险！`
                    };
                    setChatStage(7);
                } else {
                    newBotMsg = { id: Date.now().toString(), sender: 'bot', text: '如果您对当前流程有任何疑问，可以随时告诉我。' };
                }
            }
            // ====== GENERAL FLOW ======
            else {
                if (chatStage === 1) {
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `了解，在${userText}地区我们有很好的服务覆盖。接下来，您最看重的是性价比还是全面保障？`,
                        options: ['极致性价比', '全面平衡 (推荐)', '顶级服务体验']
                    };
                    setChatStage(2);
                } else if (chatStage === 2) {
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `已记录偏好【${userText}】。鲜橙保险正在生成您的专属比价结果...`
                    };
                    setChatStage(3);
                    setTimeout(() => triggerQuoteGeneration('general'), 2000);
                }
            }

            if (newBotMsg) {
                setMessages(prev => [...prev, newBotMsg!]);
            }
        }, 1000);
    };

    const triggerQuoteGeneration = (flowType: string) => {
        setIsBotTyping(true);
        setStep(3);

        setTimeout(() => {
            setIsBotTyping(false);

            let generatedQuotes: QuotePlan[] = [];

            if (flowType === 'travel') {
                generatedQuotes = [
                    {
                        id: 'plan_1',
                        name: 'Patriot 基础版',
                        underwriter: 'SiriusPoint 财险',
                        price: '$45',
                        period: '14天',
                        policyMax: '$50,000',
                        deductible: '$250',
                        features: ['突发疾病承保', '网络内医院直付', '新冠医疗有限承保']
                    },
                    {
                        id: 'plan_2',
                        name: 'Atlas America 全面计划',
                        tag: '最畅销',
                        underwriter: 'Lloyds of London',
                        price: '$138',
                        period: '14天',
                        policyMax: '$1,000,000',
                        deductible: '$0 (网络内)',
                        features: ['零免赔额特权', 'PPO 优质医疗网络', '新冠全面保障', '包含紧急牙科']
                    }
                ];
            } else {
                generatedQuotes = [
                    {
                        id: 'plan_gen_1',
                        name: '经济实惠型',
                        underwriter: '官方直属',
                        price: '$199',
                        period: '每年',
                        policyMax: '$1,000,000',
                        deductible: '$10,000',
                        features: ['基础保障范围', '核心理赔覆盖']
                    }
                ];
            }

            const quoteMsg: Message = {
                id: Date.now().toString(),
                sender: 'bot',
                text: '计算完成！以下是为您精选的保险方案对比，请选择您心仪的计划：',
                quotesList: generatedQuotes
            };
            setMessages(prev => [...prev, quoteMsg]);
            setChatStage(flowType === 'travel' ? 4 : 4); // wait for user choice
        }, 2000);
    };

    const handlePurchase = (plan: QuotePlan) => {
        setIsBotTyping(true);
        setStep(4);

        // Remove options and widgets from previous messages
        const updatedMessages = messages.map(msg => ({
            ...msg,
            quotesList: undefined,
            interactiveWidget: undefined
        }));

        setSelectedPlan(plan);
        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: `我想购买【${plan.name}】` };
        setMessages([...updatedMessages, userMsg]);

        setTimeout(() => {
            setIsBotTyping(false);

            if (selectedType === '旅行保险') {
                setChatStage(5);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: `极好的选择！为了完成【${plan.name}】的投保，请填写下方入保人员的详细信息。我们会严格保护您的隐私：`,
                    interactiveWidget: 'enrollment_form',
                    selectedPlanContext: plan
                }]);
            } else {
                setChatStage(5);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: `极好的选择！为了完成【${plan.name}】的投保，请填写下方入保人员的详细信息。我们会严格保护您的隐私：`,
                    interactiveWidget: 'enrollment_form',
                    selectedPlanContext: plan
                }]);
            }
        }, 1500);
    };

    const handleSend = (textOverride?: string, widgetData?: any, imageBase64?: string) => {
        const textToSend = textOverride || input;
        if ((!textToSend.trim() && !imageBase64) || isBotTyping) return;

        // Clear widgets/options from previous bot messages
        const updatedMessages = messages.map(msg => ({
            ...msg,
            options: undefined,
            interactiveWidget: undefined
        }));

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend.trim(),
            imageUrl: imageBase64
        };

        setMessages([...updatedMessages, userMsg]);
        setInput('');
        simulateBotResponse(textToSend.trim() || '上传了图片', widgetData);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                handleSend(undefined, undefined, base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCountryWidgetSubmit = () => {
        if (!citizenship || !residence) return;
        handleSend(`国籍：${citizenship}，居住地：${residence}`);
    };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-4rem)] w-full">

            <div className="px-8 pt-8">
                <div className="flex justify-between items-start relative mb-8">
                    {/* Connector line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0" />
                    {steps.map((s) => (
                        <div key={s.num} className="flex flex-col items-center z-[2]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                                step > s.num
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : step === s.num
                                        ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                                        : 'bg-white border-slate-200 text-muted-foreground'
                            }`}>
                                {s.num}
                            </div>
                            <span className={`text-xs mt-2 ${step === s.num ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center mb-4">
                <h2 className="text-2xl font-semibold mb-2 font-serif">{selectedType}</h2>
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-5">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full max-w-[768px] mx-auto flex-col ${msg.sender === 'bot' ? 'items-start' : 'items-end'}`}>
                            <div className={`flex flex-col gap-4 break-words text-[#0d0d0d] text-[15px] leading-[1.7] ${msg.sender === 'bot' ? 'max-w-full' : 'max-w-[85%] bg-[#f4f4f4] px-5 py-4 rounded-3xl'}`}>
                                <div>
                                    {msg.text}
                                    {msg.imageUrl && (
                                        <div className="mt-5">
                                            <img src={msg.imageUrl} alt="Uploaded" className="max-w-full max-h-[400px] rounded-lg border border-input" />
                                        </div>
                                    )}
                                </div>

                                {/* === INTERACTIVE COUNTRY SELECTOR WIDGET === */}
                                {msg.interactiveWidget === 'country_selector' && (
                                    <Card className="animate-fade-in mt-2">
                                        <CardContent className="pt-6">
                                            <div className="mb-4">
                                                <label className="block mb-2 font-medium text-sm text-foreground">
                                                    国籍
                                                </label>
                                                <select
                                                    value={citizenship}
                                                    onChange={(e) => setCitizenship(e.target.value)}
                                                    className="w-full py-3 px-3 rounded-lg border border-input text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background"
                                                >
                                                    <option value="" disabled>请选择...</option>
                                                    {COUNTRIES.map(c => <option key={`cit-${c}`} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="mb-6">
                                                <label className="block mb-2 font-medium text-sm text-foreground">
                                                    目前居住地
                                                </label>
                                                <select
                                                    value={residence}
                                                    onChange={(e) => setResidence(e.target.value)}
                                                    className="w-full py-3 px-3 rounded-lg border border-input text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background"
                                                >
                                                    <option value="" disabled>请选择...</option>
                                                    {COUNTRIES.map(c => <option key={`res-${c}`} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <Button
                                                className="w-full"
                                                onClick={handleCountryWidgetSubmit}
                                                disabled={!citizenship || !residence}
                                            >
                                                提交信息
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* === TRAVEL DETAILS WIDGET === */}
                                {msg.interactiveWidget === 'travel_details' && (
                                    <TravelDetailsWidget onSubmit={(text, data) => handleSend(text, data)} />
                                )}

                                {/* === ENROLLMENT FORM WIDGET === */}
                                {msg.interactiveWidget === 'enrollment_form' && msg.selectedPlanContext && (
                                    <EnrollmentFormWidget
                                        plan={msg.selectedPlanContext}
                                        travelData={travelData}
                                        onSubmit={(text) => handleSend(text)}
                                    />
                                )}

                                {/* === PAYMENT CHECKOUT WIDGET === */}
                                {msg.interactiveWidget === 'payment_checkout' && msg.selectedPlanContext && (
                                    <PaymentCheckoutWidget
                                        plan={msg.selectedPlanContext}
                                        onSubmit={(text) => handleSend(text)}
                                    />
                                )}
                            </div>

                            {/* === MULTI-QUOTE PRESENTATION === */}
                            {msg.quotesList && (
                                <div className="quotes-grid animate-fade-in flex flex-col gap-6 mt-2 w-full py-2">
                                    {msg.quotesList.map((plan) => (
                                        <Card key={plan.id} className={`hover-lift relative flex flex-row justify-between items-center p-6 px-8 ${plan.tag ? 'border-2 border-primary' : ''}`}>
                                            {plan.tag && (
                                                <Badge className="absolute -top-3 left-8 bg-primary text-primary-foreground shadow-sm flex gap-1 items-center">
                                                    <Star size={12} fill="white" /> {plan.tag}
                                                </Badge>
                                            )}

                                            <div className="flex-1 pr-8">
                                                <h3 className="text-2xl text-primary mb-1 font-serif">{plan.name}</h3>
                                                <div className="text-muted-foreground text-sm mb-4 flex items-center gap-2">
                                                    <ShieldAlert size={14} /> 承保公司: <strong>{plan.underwriter}</strong>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                                    <div>方案最高保额: <strong>{plan.policyMax}</strong></div>
                                                    <div>自付/免赔额: <strong>{plan.deductible}</strong></div>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-1 text-sm text-foreground">
                                                            <CheckCircle2 size={14} className="text-primary" />
                                                            {feature}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center min-w-[180px] border-l border-input pl-8">
                                                <div className="text-muted-foreground text-sm mb-1">预计保费</div>
                                                <div className="flex items-baseline gap-1 text-primary mb-4">
                                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                                    <span className="font-semibold">/{plan.period}</span>
                                                </div>
                                                <Button
                                                    className="w-full rounded-full"
                                                    onClick={() => handlePurchase(plan)}
                                                >
                                                    立即购买
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {msg.options && (
                                <div className="chat-options animate-fade-in flex flex-row flex-wrap gap-3 mt-2">
                                    {msg.options.map((opt, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            onClick={() => handleSend(opt)}
                                            className="rounded-full bg-white shadow-sm"
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isBotTyping && (
                        <div className="flex w-full max-w-[900px] mx-auto mb-8">
                            <div className="flex gap-1.5 items-center h-6">
                                <div className="typing-dot bg-muted-foreground"></div>
                                <div className="typing-dot bg-muted-foreground" style={{ animationDelay: '0.2s' }}></div>
                                <div className="typing-dot bg-muted-foreground" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="px-4 py-3 bg-white relative max-w-[768px] mx-auto w-full">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    {/* Plus menu popover */}
                    {showPlusMenu && (
                        <div className="absolute bottom-full left-4 mb-2 bg-white rounded-xl shadow-lg border border-[#e3e3e3] py-1.5 min-w-[160px] z-10">
                            <button
                                onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2d2d2d] hover:bg-[#f5f5f5] transition-colors"
                            >
                                <ImageIcon size={16} className="text-[#6e6e6e]" />
                                添加图片
                            </button>
                        </div>
                    )}
                    <div className={`flex items-center gap-1 rounded-full border border-[#e3e3e3] bg-white px-1.5 py-1 transition-all ${isBotTyping ? 'opacity-60' : ''}`}>
                        <button
                            onClick={() => setShowPlusMenu(!showPlusMenu)}
                            disabled={isBotTyping}
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#b4b4b4] hover:text-[#2d2d2d] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} strokeWidth={2} />
                        </button>
                        <input
                            type="text"
                            placeholder="输入任何问题..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            onFocus={() => setShowPlusMenu(false)}
                            disabled={isBotTyping}
                            className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-[#2d2d2d] placeholder:text-[#b4b4b4]"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isBotTyping || !input.trim()}
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                input.trim() && !isBotTyping
                                    ? 'bg-[#0d0d0d] text-white hover:bg-[#2d2d2d]'
                                    : 'bg-[#e8e8e8] text-[#c8c8c8] cursor-default'
                            }`}
                        >
                            <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotePage;
