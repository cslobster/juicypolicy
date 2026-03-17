import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Activity, CheckCircle2, ShieldAlert, Star, Plus, Trash, Image as ImageIcon } from 'lucide-react';

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
        <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>行程日期 (Coverage Dates)</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
            </div>

            <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>投保人年龄 (Insureds' Ages)</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Primary</label>
                    <input type="number" placeholder="Age" value={primaryAge} onChange={e => setPrimaryAge(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Spouse</label>
                    <input type="number" placeholder="Age (Optional)" value={spouseAge} onChange={e => setSpouseAge(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
            </div>

            {childAges.map((age, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Child {idx + 1}</label>
                        <input type="number" placeholder="Age" value={age} onChange={e => updateChildAge(idx, e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                    </div>
                    <button onClick={() => removeChild(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash size={18} />
                    </button>
                </div>
            ))}

            <button onClick={handleAddChild} className="btn" style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-dark)', marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> 添加儿童 (Add Child)
            </button>

            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={!isValid} style={{ opacity: !isValid ? 0.5 : 1 }}>
                生成报价
            </button>
        </div>
    );
};

const EnrollmentFormWidget: React.FC<{ plan: QuotePlan, travelData: any, onSubmit: (text: string) => void }> = ({ plan, travelData, onSubmit }) => {
    // Contact State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Insured State
    const [primaryName, setPrimaryName] = useState({ first: 'Given Names', last: 'Surname', dob: '', gender: '', govId: '' });
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

    const inputStyle = { width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--color-text-dark)', fontWeight: 500 };
    const sectionStyle = { marginBottom: '2rem' };
    const titleStyle = { color: 'var(--color-primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', fontSize: '1.1rem' };
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' };

    return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '2rem', background: '#fafbfc', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>入保信息填写 - {plan.name}</h3>
            
            {/* Contact Information */}
            <div style={sectionStyle}>
                <h4 style={titleStyle}>Contact Information</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Use your best email and phone, we'll send your policy and alerts here.</p>
                <div style={gridStyle}>
                     <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                     </div>
                     <div>
                        <label style={labelStyle}>Phone Number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                     </div>
                </div>
            </div>

            {/* Insured(s) Information */}
            <div style={sectionStyle}>
                <h4 style={titleStyle}>Insured(s) Information</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Enter each insured's information to secure their coverage.</p>
                
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                    <div style={{ display: 'inline-block', background: 'var(--color-bg-light)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Primary
                    </div>
                    <div style={gridStyle}>
                        <div>
                            <label style={labelStyle}>First & Middle Name</label>
                            <input type="text" value={primaryName.first} onChange={e => setPrimaryName({...primaryName, first: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input type="text" value={primaryName.last} onChange={e => setPrimaryName({...primaryName, last: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Birth Date</label>
                            <input type="date" value={primaryName.dob} onChange={e => setPrimaryName({...primaryName, dob: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Gender</label>
                            <select value={primaryName.gender} onChange={e => setPrimaryName({...primaryName, gender: e.target.value})} style={inputStyle}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Government Issued ID Number</label>
                            <input type="text" placeholder="Optional" value={primaryName.govId} onChange={e => setPrimaryName({...primaryName, govId: e.target.value})} style={inputStyle} />
                        </div>
                    </div>
                </div>

                {travelData?.spouseAge && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                        <div style={{ display: 'inline-block', background: 'var(--color-bg-light)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Spouse
                        </div>
                        <div style={gridStyle}>
                            <div><label style={labelStyle}>First Name</label><input type="text" value={spouseName.first} onChange={e => setSpouseName({...spouseName, first: e.target.value})} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Last Name</label><input type="text" value={spouseName.last} onChange={e => setSpouseName({...spouseName, last: e.target.value})} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Birth Date</label><input type="date" value={spouseName.dob} onChange={e => setSpouseName({...spouseName, dob: e.target.value})} style={inputStyle} /></div>
                        </div>
                    </div>
                )}

                {travelData?.childAges?.map((age: string, idx: number) => (
                    <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                        <div style={{ display: 'inline-block', background: 'var(--color-bg-light)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Child {idx + 1} (Age: {age})
                        </div>
                        <div style={gridStyle}>
                            <div><label style={labelStyle}>First Name</label><input type="text" value={childNames[idx]?.first} onChange={e => updateChild(idx, 'first', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Last Name</label><input type="text" value={childNames[idx]?.last} onChange={e => updateChild(idx, 'last', e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Birth Date</label><input type="date" value={childNames[idx]?.dob} onChange={e => updateChild(idx, 'dob', e.target.value)} style={inputStyle} /></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Residence Address */}
            <div style={sectionStyle}>
                <h4 style={titleStyle}>Residence Address</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Tell us the address where you live and have a primary residence.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <div>
                        <label style={labelStyle}>Country</label>
                        <input type="text" value={residence.country} onChange={e => setResidence({...residence, country: e.target.value})} style={inputStyle} />
                     </div>
                     <div style={gridStyle}>
                        <div>
                            <label style={labelStyle}>Address 1</label>
                            <input type="text" value={residence.addr1} onChange={e => setResidence({...residence, addr1: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Address 2 (Apt/Suite #)</label>
                            <input type="text" placeholder="Optional" value={residence.addr2} onChange={e => setResidence({...residence, addr2: e.target.value})} style={inputStyle} />
                        </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>City</label><input type="text" value={residence.city} onChange={e => setResidence({...residence, city: e.target.value})} style={inputStyle} /></div>
                        <div><label style={labelStyle}>State/Province/Region</label><input type="text" value={residence.state} onChange={e => setResidence({...residence, state: e.target.value})} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Postal Code</label><input type="text" value={residence.zip} onChange={e => setResidence({...residence, zip: e.target.value})} style={inputStyle} /></div>
                     </div>
                </div>
            </div>
            
            {/* Mailing Address */}
            <div style={sectionStyle}>
                <h4 style={titleStyle}>Mailing Address</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Tell us the address where you receive physical mail correspondence.</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={mailing.sameAsResidence} onChange={e => setMailing({...mailing, sameAsResidence: e.target.checked})} />
                        Same as Residence
                    </label>
                </div>
                {!mailing.sameAsResidence && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div><label style={labelStyle}>Country</label><input type="text" value={mailing.country} onChange={e => setMailing({...mailing, country: e.target.value})} style={inputStyle} /></div>
                        <div style={gridStyle}>
                            <div><label style={labelStyle}>Address 1</label><input type="text" value={mailing.addr1} onChange={e => setMailing({...mailing, addr1: e.target.value})} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Address 2</label><input type="text" value={mailing.addr2} onChange={e => setMailing({...mailing, addr2: e.target.value})} style={inputStyle} /></div>
                        </div>
                    </div>
                )}
            </div>

            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={!isValid} style={{ padding: '0.85rem', fontSize: '1.05rem', fontWeight: 600, opacity: !isValid ? 0.5 : 1 }}>
                提交承保信息 (Submit Enrollment)
            </button>
        </div>
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
        onSubmit(`支付已完成 (Credit Card Payment Successful)`);
    };

    const inputStyle = { width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--color-text-dark)', fontWeight: 500 };

    return (
        <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '2rem', background: '#fafbfc', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>安全支付 (Secure Checkout)</h3>
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>Total Amount</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>{plan.price}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Policy: {plan.name}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={labelStyle}>Name on Card *</label>
                    <input type="text" value={nameOnCard} onChange={e => setNameOnCard(e.target.value)} style={inputStyle} placeholder="John Doe" />
                </div>
                <div>
                    <label style={labelStyle}>Card Number *</label>
                    <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={inputStyle} placeholder="0000 0000 0000 0000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Expiry Date *</label>
                        <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} style={inputStyle} placeholder="MM/YY" />
                    </div>
                    <div>
                        <label style={labelStyle}>CVV *</label>
                        <input type="text" value={cvv} onChange={e => setCvv(e.target.value)} style={inputStyle} placeholder="123" />
                    </div>
                </div>
            </div>

            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={!isValid} style={{ padding: '0.85rem', fontSize: '1.05rem', fontWeight: 600, opacity: !isValid ? 0.5 : 1 }}>
                确认支付 (Pay Now)
            </button>
        </div>
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
        ? `您好！我是您的专属保险顾问。您选择了【旅行保险】。为了给您提供准确的报价，请问您的国籍和目前的居住国是哪里？`
        : `您好！我是您的专属保险顾问。您选择了【${selectedType}】，我们将一起完成您的个性化报价。首先，请问您所在美国哪个州，或者您的邮编是多少？`;

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
                        text: `日期及人员信息确认完毕。AI 正在实时为您从市场抓取最优的旅行险产品对比...`
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
                        text: `🎉 支付成功！恭喜，您已成功完成投保。电子保单将在几分钟内发送至您的邮箱。感谢您使用智能比价 AI！`
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
                        text: `已记录偏好【${userText}】。AI 正在生成您的专属比价结果...`
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
                        price: '¥220',
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
                        price: '¥680',
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
                        price: '¥998',
                        period: '每年',
                        policyMax: '100万人民币',
                        deductible: '1万元',
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
                setStep(5);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: `🎉 恭喜！您已成功选购【${plan.name}】。电子保单已发送至您的邮箱。`
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
        <div className="quote-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', width: '100%', maxWidth: '100vw', margin: '0', borderRadius: '0', border: 'none', padding: '0', boxShadow: 'none' }}>

            <div style={{ padding: '2rem 2rem 0' }}>
                <div className="progress-bar">
                    {steps.map((s) => (
                        <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                            <div className={`progress-step ${step > s.num ? 'completed' : ''} ${step === s.num ? 'active' : ''}`}>
                                {s.num}
                            </div>
                            <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: step === s.num ? 600 : 400, color: step === s.num ? 'var(--color-text-dark)' : 'var(--color-text-main)' }}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 className="quote-title" style={{ marginBottom: '0.5rem' }}>多维比价 - {selectedType}</h2>
                <p style={{ color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Activity size={16} color="var(--color-accent)" />
                    基于市场大数据的智能推荐
                </p>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--color-bg-light)',
                borderTop: '1px solid var(--color-border)',
                overflow: 'hidden'
            }}>
                <div style={{
                    flex: 1,
                    padding: '2rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            width: '100%',
                            maxWidth: '900px',
                            margin: '0 auto',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                maxWidth: msg.sender === 'bot' ? '100%' : '85%',
                                background: msg.sender === 'bot' ? 'transparent' : '#f4f4f4',
                                padding: msg.sender === 'bot' ? '0' : '1.25rem 1.5rem',
                                borderRadius: msg.sender === 'bot' ? '0' : '24px',
                                color: 'var(--color-text-dark)',
                                fontSize: '1.05rem',
                                lineHeight: '1.6',
                                wordBreak: 'break-word',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem' // gap for widgets/options
                            }}>
                                <div>
                                    {msg.text}
                                    {msg.imageUrl && (
                                        <div style={{ marginTop: '1.25rem' }}>
                                            <img src={msg.imageUrl} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                                        </div>
                                    )}
                                </div>

                                {/* === INTERACTIVE COUNTRY SELECTOR WIDGET === */}
                                {msg.interactiveWidget === 'country_selector' && (
                                    <div className="animate-fade-in" style={{
                                        marginTop: '0.5rem',
                                        padding: '1.5rem',
                                        background: 'white',
                                        borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                                                国籍 (Citizenship)
                                            </label>
                                            <select
                                                value={citizenship}
                                                onChange={(e) => setCitizenship(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none' }}
                                            >
                                                <option value="" disabled>请选择...</option>
                                                {COUNTRIES.map(c => <option key={`cit-${c}`} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                                                目前居住地 (Residence Country)
                                            </label>
                                            <select
                                                value={residence}
                                                onChange={(e) => setResidence(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none' }}
                                            >
                                                <option value="" disabled>请选择...</option>
                                                {COUNTRIES.map(c => <option key={`res-${c}`} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        <button
                                            className="btn btn-primary w-full"
                                            onClick={handleCountryWidgetSubmit}
                                            disabled={!citizenship || !residence}
                                            style={{
                                                opacity: (!citizenship || !residence) ? 0.5 : 1,
                                                cursor: (!citizenship || !residence) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            提交信息
                                        </button>
                                    </div>
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
                                <div className="quotes-grid animate-fade-in" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    padding: '0.5rem 0'
                                }}>
                                    {msg.quotesList.map((plan) => (
                                        <div key={plan.id} className="plan-card glass hover-lift" style={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'white',
                                            border: plan.tag ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                            borderRadius: '16px',
                                            padding: '1.5rem 2rem',
                                        }}>
                                            {plan.tag && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-12px',
                                                    left: '2rem',
                                                    background: 'var(--color-accent)',
                                                    color: 'white',
                                                    padding: '0.25rem 1rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    gap: '0.25rem',
                                                    alignItems: 'center',
                                                    boxShadow: 'var(--shadow-sm)'
                                                }}>
                                                    <Star size={12} fill="white" /> {plan.tag}
                                                </div>
                                            )}

                                            <div style={{ flex: 1, paddingRight: '2rem' }}>
                                                <h3 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{plan.name}</h3>
                                                <div style={{ color: 'var(--color-text-main)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <ShieldAlert size={14} /> 承保公司: <strong>{plan.underwriter}</strong>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                                    <div>方案最高保额: <strong>{plan.policyMax}</strong></div>
                                                    <div>自付/免赔额: <strong>{plan.deductible}</strong></div>
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-text-dark)' }}>
                                                            <CheckCircle2 size={14} color="var(--color-accent)" />
                                                            {feature}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '180px', borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
                                                <div style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>预计保费</div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                                                    <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
                                                    <span style={{ fontWeight: 600 }}>/{plan.period}</span>
                                                </div>
                                                <button
                                                    className="btn btn-primary w-full"
                                                    style={{ borderRadius: '999px', fontSize: '1rem' }}
                                                    onClick={() => handlePurchase(plan)}
                                                >
                                                    立即购买
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {msg.options && (
                                <div className="chat-options animate-fade-in" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    {msg.options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            className="btn btn-outline"
                                            onClick={() => handleSend(opt)}
                                            style={{
                                                borderRadius: '999px',
                                                padding: '0.5rem 1.25rem',
                                                fontSize: '0.9rem',
                                                background: 'white',
                                                boxShadow: 'var(--shadow-sm)'
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isBotTyping && (
                        <div style={{ display: 'flex', width: '100%', maxWidth: '900px', margin: '0 auto', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '24px' }}>
                                <div className="typing-dot" style={{ background: 'var(--color-text-main)' }}></div>
                                <div className="typing-dot" style={{ background: 'var(--color-text-main)', animationDelay: '0.2s' }}></div>
                                <div className="typing-dot" style={{ background: 'var(--color-text-main)', animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div style={{
                    padding: '1.25rem 2rem',
                    background: 'white',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBotTyping}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-main)',
                            cursor: isBotTyping ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isBotTyping ? 0.6 : 1,
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-main)'}
                        title="上传图片文件"
                    >
                        <ImageIcon size={26} strokeWidth={1.5} />
                    </button>
                    <input
                        type="text"
                        placeholder="随时回复顾问..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isBotTyping}
                        style={{
                            flex: 1,
                            padding: '1rem 1.5rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '999px',
                            outline: 'none',
                            fontSize: '1rem',
                            backgroundColor: 'var(--color-bg-light)',
                            transition: 'all 0.3s ease',
                            opacity: isBotTyping ? 0.6 : 1
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSend()}
                        disabled={isBotTyping || !input.trim()}
                        style={{
                            borderRadius: '999px',
                            padding: '0 2rem',
                            height: '52px',
                            opacity: (isBotTyping || !input.trim()) ? 0.6 : 1,
                            cursor: (isBotTyping || !input.trim()) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        发送 <Send size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotePage;
