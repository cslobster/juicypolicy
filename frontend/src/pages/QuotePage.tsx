const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Star, Plus, Trash, ArrowUp, Image as ImageIcon, Search } from 'lucide-react';
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

interface HealthPlan {
    plan_name: string;
    carrier: string;
    plan_type: string;
    network_type: string;
    monthly_premium: number | null;
    deductible: number | null;
    max_out_of_pocket: number | null;
    primary_care_copay: string | null;
    specialist_copay: string | null;
    emergency_room: string | null;
    generic_drugs: string | null;
    features: string[];
}

const PLAN_TYPE_COLORS: Record<string, string> = {
    Bronze: '#B87333',
    Silver: '#8E9BAE',
    Gold: '#D4A843',
    Platinum: '#5A6B7F',
};

const getPlanTypeBadgeClass = (type: string) => {
    switch (type) {
        case 'Bronze': return 'bg-[#B87333] text-white';
        case 'Silver': return 'bg-[#8E9BAE] text-white';
        case 'Gold': return 'bg-[#D4A843] text-white';
        case 'Platinum': return 'bg-[#5A6B7F] text-white';
        default: return 'bg-gray-500 text-white';
    }
};

const HealthQuoteResults: React.FC<{ plans: HealthPlan[]; onBack: () => void; highlightedPlans?: string[]; selectedPlan: HealthPlan | null; onSelectPlan: (plan: HealthPlan | null) => void }> = ({ plans, onBack, highlightedPlans = [], selectedPlan, onSelectPlan }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [planTypeFilter, setPlanTypeFilter] = useState('all');
    const [networkFilter, setNetworkFilter] = useState('all');
    const [carrierFilter, setCarrierFilter] = useState('all');
    const [sortBy, setSortBy] = useState('premium_asc');
    const [page, setPage] = useState(1);
    const perPage = 5;

    const uniquePlanTypes = [...new Set(plans.map(p => p.plan_type).filter(Boolean))];
    const uniqueNetworks = [...new Set(plans.map(p => p.network_type).filter(Boolean))];
    const uniqueCarriers = [...new Set(plans.map(p => p.carrier).filter(Boolean))];

    const filteredPlans = useMemo(() => {
        let filtered = plans.filter(plan => {
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                if (!(plan.plan_name?.toLowerCase().includes(s) || plan.carrier?.toLowerCase().includes(s))) return false;
            }
            if (planTypeFilter !== 'all' && plan.plan_type !== planTypeFilter) return false;
            if (networkFilter !== 'all' && plan.network_type !== networkFilter) return false;
            if (carrierFilter !== 'all' && plan.carrier !== carrierFilter) return false;
            return true;
        });
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc': return (a.plan_name || '').localeCompare(b.plan_name || '');
                case 'name_desc': return (b.plan_name || '').localeCompare(a.plan_name || '');
                case 'premium_asc': return (a.monthly_premium || 0) - (b.monthly_premium || 0);
                case 'premium_desc': return (b.monthly_premium || 0) - (a.monthly_premium || 0);
                case 'deductible_asc': return (a.deductible || 0) - (b.deductible || 0);
                case 'deductible_desc': return (b.deductible || 0) - (a.deductible || 0);
                case 'copay_asc': {
                    const av = parseFloat(a.primary_care_copay?.replace(/[^0-9.]/g, '') || '9999');
                    const bv = parseFloat(b.primary_care_copay?.replace(/[^0-9.]/g, '') || '9999');
                    return av - bv;
                }
                case 'copay_desc': {
                    const av = parseFloat(a.primary_care_copay?.replace(/[^0-9.]/g, '') || '0');
                    const bv = parseFloat(b.primary_care_copay?.replace(/[^0-9.]/g, '') || '0');
                    return bv - av;
                }
                default: return 0;
            }
        });
        return filtered;
    }, [plans, searchTerm, planTypeFilter, networkFilter, carrierFilter, sortBy]);

    const toggleSort = (field: string) => {
        setSortBy(prev => prev === `${field}_asc` ? `${field}_desc` : `${field}_asc`);
    };
    const sortArrow = (field: string) => sortBy === `${field}_asc` ? ' ↑' : sortBy === `${field}_desc` ? ' ↓' : '';
    const totalPages = Math.ceil(filteredPlans.length / perPage);
    const pagedPlans = filteredPlans.slice((page - 1) * perPage, page * perPage);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [searchTerm, planTypeFilter, networkFilter, carrierFilter, sortBy]);

    const hasFilters = searchTerm || planTypeFilter !== 'all' || networkFilter !== 'all' || carrierFilter !== 'all' || sortBy !== 'premium_asc';
    const sel = "h-8 rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
    const fmt = (v: number | null) => typeof v === 'number' ? `$${v.toLocaleString()}` : '-';

    return (
        <div className="flex flex-col shrink-0 w-full">
            {/* Filters */}
            <div className="px-4 py-1.5 border-b bg-white flex items-center gap-1.5 max-w-[768px] mx-auto w-full">
                <div className="relative shrink-0">
                    <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="搜索..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`${sel} w-[80px] pl-5`} />
                </div>
                <select value={planTypeFilter} onChange={e => setPlanTypeFilter(e.target.value)} className={sel}>
                    <option value="all">等级</option>
                    {uniquePlanTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={networkFilter} onChange={e => setNetworkFilter(e.target.value)} className={sel}>
                    <option value="all">网络</option>
                    {uniqueNetworks.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)} className={sel}>
                    <option value="all">保险公司</option>
                    {uniqueCarriers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">{filteredPlans.length}个 · 第{page}/{totalPages}页</span>
                {hasFilters && (
                    <button onClick={() => { setSearchTerm(''); setPlanTypeFilter('all'); setNetworkFilter('all'); setCarrierFilter('all'); setSortBy('premium_asc'); }}
                        className="text-xs text-primary hover:underline shrink-0">清除</button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-auto shrink-0">
                <table className="w-full text-sm border-collapse max-w-[768px] mx-auto">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="border-b text-left text-xs text-muted-foreground tracking-wide">
                            <th className="py-2 px-3 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort('name')}>计划名称{sortArrow('name')}</th>
                            <th className="py-2 px-2 font-medium">类型</th>
                            <th className="py-2 px-2 font-medium text-right cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort('premium')}>月保费{sortArrow('premium')}</th>
                            <th className="py-2 px-2 font-medium text-right cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort('deductible')}>免赔额{sortArrow('deductible')}</th>
                            <th className="py-2 px-2 font-medium cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort('copay')}>门诊费{sortArrow('copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedPlans.map((plan, idx) => {
                            const isSelected = selectedPlan === plan;
                            const isHighlighted = highlightedPlans.some(hp => hp === plan.plan_name);
                            return (
                            <tr key={idx}
                                className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 font-semibold' : isHighlighted ? 'bg-amber-50' : 'hover:bg-blue-50/30'}`}
                                onClick={() => onSelectPlan(isSelected ? null : plan)}>
                                <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-[3px] h-7 rounded-full shrink-0" style={{ background: PLAN_TYPE_COLORS[plan.plan_type] || '#94a3b8' }} />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate max-w-[300px]">{plan.plan_name}</p>
                                            <p className="text-xs text-muted-foreground">{plan.carrier}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2 px-2">
                                    <div className="flex gap-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${getPlanTypeBadgeClass(plan.plan_type)}`}>{plan.plan_type?.slice(0, 1)}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] border border-gray-300">{plan.network_type}</span>
                                    </div>
                                </td>
                                <td className="py-2 px-2 text-right font-bold">
                                    {typeof plan.monthly_premium === 'number' ? `$${plan.monthly_premium.toFixed(0)}` : '-'}
                                </td>
                                <td className="py-2 px-2 text-right">{fmt(plan.deductible)}</td>
                                <td className="py-2 px-2 text-muted-foreground">{plan.primary_care_copay?.match(/\$[\d,.]+/)?.[0] || '-'}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredPlans.length === 0 && (
                    <div className="flex h-20 items-center justify-center text-muted-foreground text-xs max-w-[768px] mx-auto">没有匹配的计划</div>
                )}
                <div className="flex items-center gap-1 py-1.5 max-w-[768px] mx-auto">
                    <button onClick={onBack} className="px-3 py-1 text-sm rounded-full bg-primary text-white hover:opacity-90 mr-auto">重新报价</button>
                    {totalPages > 1 && (<>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">上一页</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                className={`w-6 h-6 text-xs rounded ${p === page ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">下一页</button>
                    </>)}
                </div>
            </div>
        </div>
    );
};

interface HouseholdMember {
    age: string;
    sex: 'M' | 'F' | '';
}

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: string[];
    quotesList?: QuotePlan[];
    isTyping?: boolean;
    interactiveWidget?: 'country_selector' | 'travel_details' | 'life_details' | 'health_details' | 'health_form' | 'health_enroll' | 'enrollment_form' | 'payment_checkout';
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

const LifeDetailsWidget: React.FC<{ onSubmit: (text: string, data: any) => void }> = ({ onSubmit }) => {
    const [age, setAge] = useState('');
    const [zip, setZip] = useState('');
    const [gender, setGender] = useState('');

    const isValid = age && zip && gender;

    const handleSubmit = () => {
        if (!isValid) return;
        const genderLabel = gender === 'male' ? '男' : '女';
        onSubmit(`年龄: ${age}, 邮编: ${zip}, 性别: ${genderLabel}`, { age, zip, gender });
    };

    return (
        <Card className="animate-fade-in mt-6">
            <CardContent className="pt-6">
                <h4 className="mb-4 text-primary font-serif">基本信息</h4>
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">年龄</label>
                        <Input type="number" placeholder="例如: 35" value={age} onChange={e => setAge(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-foreground">邮编</label>
                        <Input type="text" placeholder="例如: 94105" value={zip} onChange={e => setZip(e.target.value)} />
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-sm mb-1 text-foreground">性别</label>
                    <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="" disabled>请选择</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                    </select>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!isValid}>
                    生成报价
                </Button>
            </CardContent>
        </Card>
    );
};

const HealthEnrollWidget: React.FC<{ plan: HealthPlan; onSubmit: (text: string) => void; onBack: () => void }> = ({ plan, onSubmit, onBack }) => {
    const [form, setForm] = useState({
        firstName: '', lastName: '', dob: '', gender: '',
        ssn: '', email: '', phone: '',
        address: '', city: '', state: 'CA', zip: '',
    });
    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
    const isValid = form.firstName && form.lastName && form.dob && form.gender && form.email && form.phone && form.address && form.city && form.zip;

    return (
        <Card className="animate-fade-in mt-4">
            <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-blue-50 rounded">
                    {plan.plan_name} ({plan.carrier}) — ${plan.monthly_premium?.toFixed(2)}/月
                </div>

                <h4 className="text-sm font-semibold mb-3">申请人信息</h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">名 (First Name)</label>
                        <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">姓 (Last Name)</label>
                        <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">出生日期</label>
                        <Input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">性别</label>
                        <select value={form.gender} onChange={e => set('gender', e.target.value)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <option value="">请选择</option>
                            <option value="Male">男</option>
                            <option value="Female">女</option>
                        </select>
                    </div>
                </div>

                <h4 className="text-sm font-semibold mb-3">联系方式</h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">邮箱</label>
                        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">电话</label>
                        <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                </div>

                <h4 className="text-sm font-semibold mb-3">居住地址</h4>
                <div className="flex flex-col gap-3 mb-4">
                    <div>
                        <label className="block text-xs mb-0.5 text-muted-foreground">街道地址</label>
                        <Input value={form.address} onChange={e => set('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs mb-0.5 text-muted-foreground">城市</label>
                            <Input value={form.city} onChange={e => set('city', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs mb-0.5 text-muted-foreground">州</label>
                            <Input value={form.state} onChange={e => set('state', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs mb-0.5 text-muted-foreground">邮编</label>
                            <Input value={form.zip} onChange={e => set('zip', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs mb-0.5 text-muted-foreground">社会安全号码 (可选)</label>
                    <Input type="text" placeholder="XXX-XX-XXXX" value={form.ssn} onChange={e => set('ssn', e.target.value)} />
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onBack}>
                        返回选择
                    </Button>
                    <Button className="flex-1" disabled={!isValid}
                        onClick={() => onSubmit(`申请人: ${form.firstName} ${form.lastName}, ${form.email}, ${form.phone}`)}>
                        提交申请
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const HealthQuoteForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
    const [zip, setZip] = useState('');
    const [age, setAge] = useState('');
    const [sex, setSex] = useState('');
    const [income, setIncome] = useState('');
    const [additionalMembers, setAdditionalMembers] = useState<HouseholdMember[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addMember = () => setAdditionalMembers([...additionalMembers, { age: '', sex: '' }]);
    const removeMember = (idx: number) => setAdditionalMembers(additionalMembers.filter((_, i) => i !== idx));
    const updateMember = (idx: number, field: keyof HouseholdMember, val: string) => {
        const updated = [...additionalMembers];
        updated[idx] = { ...updated[idx], [field]: val };
        setAdditionalMembers(updated);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!zip || !/^\d{5}$/.test(zip)) errs.zip = '请输入5位有效邮编';
        if (!age || parseInt(age) < 0 || parseInt(age) > 120) errs.age = '请输入有效年龄';
        if (!sex) errs.sex = '请选择性别';
        if (!income || isNaN(Number(income.replace(/[,$]/g, ''))) || Number(income.replace(/[,$]/g, '')) <= 0) errs.income = '请输入有效收入';
        additionalMembers.forEach((m, i) => {
            if (!m.age || parseInt(m.age) < 0 || parseInt(m.age) > 120) errs[`member_age_${i}`] = '请输入有效年龄';
            if (!m.sex) errs[`member_sex_${i}`] = '请选择性别';
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const otherAges = additionalMembers.map(m => parseInt(m.age));
        onSubmit({
            name: 'Primary',
            sex: sex === 'M' ? 'Male' : 'Female',
            age: parseInt(age),
            zip,
            income: income.replace(/[,$]/g, ''),
            household_size: 1 + additionalMembers.length,
            ages_list: otherAges.length > 0 ? otherAges : [],
        });
    };

    const inputClass = "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    const selectClass = `${inputClass} appearance-none`;
    const errClass = "text-xs text-red-500 mt-0.5";

    return (
        <Card className="animate-fade-in mt-4">
            <CardContent className="pt-5">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm mb-1 font-medium">邮编 (ZIP)</label>
                        <input type="text" maxLength={5} placeholder="例如: 92602" value={zip}
                            onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
                            className={`${inputClass} ${errors.zip ? 'border-red-500' : 'border-input'}`} />
                        {errors.zip && <p className={errClass}>{errors.zip}</p>}
                    </div>
                    <div>
                        <label className="block text-sm mb-1 font-medium">年龄</label>
                        <input type="number" placeholder="例如: 35" value={age}
                            onChange={e => setAge(e.target.value)}
                            className={`${inputClass} ${errors.age ? 'border-red-500' : 'border-input'}`} />
                        {errors.age && <p className={errClass}>{errors.age}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm mb-1 font-medium">性别</label>
                        <select value={sex} onChange={e => setSex(e.target.value)}
                            className={`${selectClass} ${errors.sex ? 'border-red-500' : 'border-input'}`}>
                            <option value="">请选择</option>
                            <option value="M">男 (M)</option>
                            <option value="F">女 (F)</option>
                        </select>
                        {errors.sex && <p className={errClass}>{errors.sex}</p>}
                    </div>
                    <div>
                        <label className="block text-sm mb-1 font-medium">家庭年收入 (USD)</label>
                        <input type="text" placeholder="例如: 60000" value={income}
                            onChange={e => setIncome(e.target.value)}
                            className={`${inputClass} ${errors.income ? 'border-red-500' : 'border-input'}`} />
                        {errors.income && <p className={errClass}>{errors.income}</p>}
                    </div>
                </div>

                {additionalMembers.length > 0 && (
                    <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">其他家庭成员</p>
                        {additionalMembers.map((m, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-start">
                                <div className="flex-1">
                                    <input type="number" placeholder="年龄" value={m.age}
                                        onChange={e => updateMember(idx, 'age', e.target.value)}
                                        className={`${inputClass} ${errors[`member_age_${idx}`] ? 'border-red-500' : 'border-input'}`} />
                                </div>
                                <div className="flex-1">
                                    <select value={m.sex} onChange={e => updateMember(idx, 'sex', e.target.value)}
                                        className={`${selectClass} ${errors[`member_sex_${idx}`] ? 'border-red-500' : 'border-input'}`}>
                                        <option value="">性别</option>
                                        <option value="M">男</option>
                                        <option value="F">女</option>
                                    </select>
                                </div>
                                <button onClick={() => removeMember(idx)} className="text-red-400 hover:text-red-600 p-2 mt-0.5">
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={addMember}
                    className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Plus size={14} /> 添加家庭成员
                </button>

                <Button className="w-full h-10" onClick={handleSubmit}>
                    生成报价
                </Button>
            </div>
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
    const { type: typeParam = 'unknown' } = useParams();

    const typeMap: Record<string, string> = {
        'health': '健康保险',
        'travel': '旅行保险',
        'auto': '汽车保险',
        'property': '财产与房屋',
        'life': '人寿保险',
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

    const isLifeInsurance = selectedType === '人寿保险';
    const isHealthInsurance = selectedType === '健康保险';

    const getInitialMessage = (): Message => {
        if (isHealthInsurance) {
            return { id: '1', sender: 'bot', text: '欢迎使用鲜橙健康保险报价！请填写以下信息，我们将从 加州健保 为您实时获取报价：', interactiveWidget: 'health_form' };
        }
        if (selectedType === '旅行保险') {
            return { id: '1', sender: 'bot', text: '为了给您提供准确的报价，请问您的国籍和目前的居住国是哪里？', interactiveWidget: 'country_selector' };
        }
        if (isLifeInsurance) {
            return { id: '1', sender: 'bot', text: '为了给您提供准确的报价，请填写以下基本信息：', interactiveWidget: 'life_details' };
        }
        return { id: '1', sender: 'bot', text: '首先，请问您所在美国哪个州，或者您的邮编是多少？' };
    };

    const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);

    const [input, setInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [chatStage, setChatStage] = useState(1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [travelData, setTravelData] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<QuotePlan | null>(null);
    const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
    const [healthCustomerData, setHealthCustomerData] = useState<any>(null);
    const [showHealthResults, setShowHealthResults] = useState(false);
    const [enrollingPlan, setEnrollingPlan] = useState<HealthPlan | null>(null);
    const [activeQuoteId, setActiveQuoteId] = useState<number | null>(null);
    const [lastQuoteData, setLastQuoteData] = useState<any>(null);
    const [quoteChatMessages, setQuoteChatMessages] = useState<Message[]>([]);
    const [highlightedPlans, setHighlightedPlans] = useState<string[]>([]);
    const [selectedViewPlan, setSelectedViewPlan] = useState<HealthPlan | null>(null);
    const [showPlanCard, setShowPlanCard] = useState(false);

    // Load previous quote from localStorage or show form
    useEffect(() => {
        if (!isHealthInsurance || healthPlans.length > 0) return;
        try {
            const saved = localStorage.getItem('jp_health_quote_id');
            if (!saved) { /* no saved quote */ return; }
            const { id, expires } = JSON.parse(saved);
            if (Date.now() > expires) {
                localStorage.removeItem('jp_health_quote_id');
                               return;
            }
            fetch(`${API_BASE}/api/quote/${id}`)
                .then(r => { if (!r.ok) throw new Error(); return r.json(); })
                .then(data => {
                    if (data.has_quote && data.quote_data?.plans) {
                        setHealthPlans(data.quote_data.plans);
                        setHealthCustomerData(data.customer_data);
                        setActiveQuoteId(data.quote_id);
                        setShowHealthResults(true);
                    } else {
                                           }
                })
                .catch(() => { localStorage.removeItem('jp_health_quote_id'); /* no saved quote */ });
        } catch {
            localStorage.removeItem('jp_health_quote_id');
                   }
    }, []);

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

            // ====== HEALTH INSURANCE FLOW ======
            if (isHealthInsurance) {
                if (chatStage === 1) { // After health form submit
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `信息已收到！正在从加州健保为您获取报价...`
                    };
                    setChatStage(4);
                } else if (chatStage === 5) {
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `信息记录成功，核保已初步通过！最后一步，请使用借记卡/信用卡安全支付您的保费：`,
                        interactiveWidget: 'payment_checkout',
                        selectedPlanContext: selectedPlan || undefined
                    };
                    setChatStage(6);
                } else if (chatStage === 6) {
                    setStep(5);
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `支付成功！恭喜，您已成功完成投保。电子保单将在几分钟内发送至您的邮箱。感谢您使用鲜橙保险！`
                    };
                    setChatStage(7);
                } else {
                    newBotMsg = { id: Date.now().toString(), sender: 'bot', text: '如果您对当前流程有任何疑问，可以随时告诉我。' };
                }
            }
            // ====== TRAVEL INSURANCE FLOW ======
            else if (selectedType === '旅行保险') {
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
            // ====== LIFE INSURANCE FLOW ======
            else if (isLifeInsurance) {
                if (chatStage === 1) { // After life details widget
                    if (widgetData) setTravelData(widgetData); // reuse travelData for storing life details
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `信息已收到。鲜橙保险正在为您生成最优${selectedType}方案...`
                    };
                    setChatStage(4);
                    setTimeout(() => triggerQuoteGeneration('general'), 2000);
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

    const triggerHealthQuote = async (data: any) => {
        setLastQuoteData(data);
        setIsBotTyping(true);
        setStep(3);

        try {
            // Step 1: Create quote in DB
            const createRes = await fetch(`${API_BASE}/api/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name || 'Primary',
                    sex: data.sex || 'Male',
                    age: data.age,
                    zip: data.zip,
                    income: data.income,
                    household_size: data.household_size,
                    ages_list: data.ages_list || [],
                }),
            });

            if (!createRes.ok) throw new Error('Failed to create quote');
            const { quote_id } = await createRes.json();

            // Step 2: Show waiting message
            setMessages(prev => [...prev, {
                id: `polling_${quote_id}`,
                sender: 'bot' as const,
                text: `报价请求 #${quote_id} 已创建，正在从 加州健保 实时抓取报价数据，请稍候... (Worker 处理中)`,
            }]);

            // Step 3: Poll for result
            const pollInterval = 5000;
            const maxPolls = 120; // 10 minutes max
            let polls = 0;

            const poll = async () => {
                polls++;
                const statusRes = await fetch(`${API_BASE}/api/quote/${quote_id}`);
                if (!statusRes.ok) throw new Error('Failed to check quote status');
                const quoteData = await statusRes.json();

                if (quoteData.quote_status === 'quoted' && quoteData.has_quote) {
                    const rawPlans: HealthPlan[] = quoteData.quote_data?.plans || [];
                    setHealthPlans(rawPlans);
                    setHealthCustomerData(quoteData.customer_data);
                    setActiveQuoteId(quoteData.quote_id);
                    localStorage.setItem('jp_health_quote_id', JSON.stringify({ id: quoteData.quote_id, expires: Date.now() + 24 * 60 * 60 * 1000 }));

                    setIsBotTyping(false);
                    setMessages(prev => {
                        const filtered = prev.filter(m => m.id !== `polling_${quote_id}`);
                        return [...filtered, {
                            id: Date.now().toString(),
                            sender: 'bot' as const,
                            text: `抓取完成！从 加州健保 找到 ${rawPlans.length} 个健康保险方案。`,
                        }];
                    });
                    setShowHealthResults(true);
                    return;
                }

                if (quoteData.quote_status === 'error') {
                    setIsBotTyping(false);
                    setMessages(prev => {
                        const filtered = prev.filter(m => m.id !== `polling_${quote_id}`);
                        return [...filtered, {
                            id: Date.now().toString(),
                            sender: 'bot' as const,
                            text: `报价抓取失败: ${quoteData.quote_data?.error || '未知错误'}`,
                            options: ['重试', '重新报价'],
                        }];
                    });
                    return;
                }

                if (polls >= maxPolls) {
                    setIsBotTyping(false);
                    setMessages(prev => {
                        const filtered = prev.filter(m => m.id !== `polling_${quote_id}`);
                        return [...filtered, {
                            id: Date.now().toString(),
                            sender: 'bot' as const,
                            text: '报价抓取超时，请稍后刷新页面查看结果。',
                        }];
                    });
                    return;
                }

                // Update polling message with live status from backend
                const statusMsg = quoteData.status_message || 'Processing...';
                const statusIcon = quoteData.quote_status === 'scraping' ? '🔍' :
                                   quoteData.quote_status === 'converting' ? '🤖' : '⏳';
                setMessages(prev =>
                    prev.map(m =>
                        m.id === `polling_${quote_id}`
                            ? { ...m, text: `${statusIcon} 报价 #${quote_id} | ${statusMsg}\n⏱ 已等待 ${polls * 5} 秒` }
                            : m
                    )
                );

                setTimeout(poll, pollInterval);
            };

            setTimeout(poll, pollInterval);
        } catch (err) {
            setIsBotTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'bot' as const,
                text: `抱歉，报价创建失败，请稍后重试。错误: ${err}`,
            }]);
        }
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

    const handleQuoteChat = async () => {
        if (!input.trim() || isBotTyping || !activeQuoteId) return;
        const text = input.trim();
        setInput('');
        setShowPlanCard(false);

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
        setQuoteChatMessages(prev => [...prev, userMsg]);
        setIsBotTyping(true);

        try {
            const history = quoteChatMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
            }));

            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote_id: activeQuoteId, message: text, history, selected_plan: selectedViewPlan }),
            });

            if (!res.ok) throw new Error('Chat failed');
            const data = await res.json();

            setIsBotTyping(false);
            setHighlightedPlans(data.mentioned_plans || []);
            setQuoteChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: data.reply,
            }]);
        } catch {
            setIsBotTyping(false);
            setHighlightedPlans([]);
            setQuoteChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: '抱歉，暂时无法回复，请稍后再试。',
            }]);
        }
    };

    const handleSend = async (textOverride?: string, widgetData?: any, imageBase64?: string) => {
        const textToSend = textOverride || input;
        if ((!textToSend.trim() && !imageBase64) || isBotTyping) return;

        // Handle retry
        if (textToSend === '重试' && lastQuoteData) {
            setMessages(prev => prev.filter(m => !m.options));
            triggerHealthQuote(lastQuoteData);
            return;
        }
        if (textToSend === '重新报价') {
            setMessages([getInitialMessage()]);
            setChatStage(1);
            setStep(1);
            setLastQuoteData(null);
            return;
        }

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

        const newMessages = [...updatedMessages, userMsg];
        setMessages(newMessages);
        setInput('');

        // If we have an active quote and no widget interaction, use AI chat
        if (activeQuoteId && !widgetData && !imageBase64 && !showHealthResults) {
            setIsBotTyping(true);
            try {
                const history = newMessages
                    .filter(m => m.sender === 'user' || m.sender === 'bot')
                    .slice(-10)
                    .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

                const res = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quote_id: activeQuoteId,
                        message: textToSend.trim(),
                        history: history.slice(0, -1),
                    }),
                });

                if (!res.ok) throw new Error('Chat failed');
                const data = await res.json();

                setIsBotTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'bot' as const,
                    text: data.reply,
                }]);
            } catch {
                setIsBotTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'bot' as const,
                    text: '抱歉，暂时无法回复，请稍后再试。',
                }]);
            }
            return;
        }

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
        <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full">

            <div className="px-6 py-2 flex items-center gap-3">
                <h2 className="text-lg font-semibold font-serif shrink-0">{selectedType}</h2>
                <div className="flex items-center gap-1">
                    {steps.map((s) => (
                        <div key={s.num} className="flex items-center gap-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold border transition-all ${
                                step > s.num
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : step === s.num
                                        ? 'bg-white border-primary text-primary'
                                        : 'bg-white border-slate-200 text-muted-foreground'
                            }`}>
                                {s.num}
                            </div>
                            <span className={`text-[10px] mr-1 ${step === s.num ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
                {showHealthResults && healthCustomerData && (
                    <span className="text-xs text-muted-foreground ml-auto">
                        {healthCustomerData.zip} | ${Number(healthCustomerData.income || 0).toLocaleString()} | {healthCustomerData.sex === 'Male' ? '男' : '女'} | {[healthCustomerData.age, ...(healthCustomerData.ages_list || [])].join(', ')}岁
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {showHealthResults && healthPlans.length > 0 ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Quote table - takes available space */}
                        <HealthQuoteResults
                            plans={healthPlans}
                            highlightedPlans={highlightedPlans}
                            selectedPlan={selectedViewPlan}
                            onSelectPlan={(plan) => { setSelectedViewPlan(plan); setHighlightedPlans([]); setShowPlanCard(!!plan); }}
                            onBack={() => { setShowHealthResults(false); /* no saved quote */ setHealthPlans([]); setActiveQuoteId(null); setQuoteChatMessages([]); setSelectedViewPlan(null); localStorage.removeItem('jp_health_quote_id'); }}
                        />

                        {/* Chat panel at bottom */}
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            <div className="max-w-[768px] mx-auto flex flex-col gap-2 w-full">
                                {/* Chat messages */}
                                {quoteChatMessages.map((msg, idx) => {
                                    const isLastBot = msg.sender === 'bot' && idx === quoteChatMessages.length - 1;
                                    return (
                                    <React.Fragment key={msg.id}>
                                    <div className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`text-sm whitespace-pre-wrap ${
                                            msg.sender === 'bot' ? 'w-full text-gray-800' : 'max-w-[85%] bg-primary text-white px-3 py-1.5 rounded-2xl'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                    {isLastBot && !isBotTyping && selectedViewPlan && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Button size="sm" className="h-7 text-xs px-4 rounded-full" onClick={() => {
                                                setShowHealthResults(false);
                                                setStep(4);
                                                setChatStage(10);
                                                const p = selectedViewPlan;
                                                const planSummary = `${p.plan_name} (${p.carrier}) - ${p.plan_type} ${p.network_type}\n月保费: $${p.monthly_premium?.toFixed(2)} | 免赔额: $${p.deductible?.toLocaleString()} | 最高自付: $${p.max_out_of_pocket?.toLocaleString()}`;
                                                setMessages([
                                                    { id: 'enroll-1', sender: 'user', text: `我想投保【${p.plan_name}】` },
                                                    { id: 'enroll-2', sender: 'bot', text: `您选择了以下计划：\n\n${planSummary}\n\n为了完成投保，请提供以下信息：`, interactiveWidget: 'health_enroll' },
                                                ]);
                                                setEnrollingPlan(p);
                                            }}>投保这个计划</Button>
                                            {['这个计划适合我吗', '和最便宜的计划对比', '门诊看病要花多少钱'].map(q => (
                                                <button key={q} onClick={async () => {
                                                    if (isBotTyping || !activeQuoteId) return;
                                                    setShowPlanCard(false);
                                                    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: q };
                                                    setQuoteChatMessages(prev => [...prev, userMsg]);
                                                    setIsBotTyping(true);
                                                    try {
                                                        const res = await fetch(`${API_BASE}/api/chat`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ quote_id: activeQuoteId, message: q, history: quoteChatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), selected_plan: selectedViewPlan }),
                                                        });
                                                        const data = await res.json();
                                                        setIsBotTyping(false);
                                                        setHighlightedPlans(data.mentioned_plans || []);
                                                        setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: data.reply }]);
                                                    } catch { setIsBotTyping(false); setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: '抱歉，暂时无法回复。' }]); }
                                                }}
                                                className="h-7 text-xs px-3 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600">{q}</button>
                                            ))}
                                        </div>
                                    )}
                                    </React.Fragment>
                                    );
                                })}
                                {isBotTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-2xl flex gap-1 items-center">
                                            <div className="typing-dot bg-muted-foreground"></div>
                                            <div className="typing-dot bg-muted-foreground" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="typing-dot bg-muted-foreground" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                )}

                                {/* Selected plan detail card - at end of chat */}
                                {selectedViewPlan && showPlanCard && (<>
                                    <div className="bg-blue-50 rounded-lg p-3 text-sm border border-blue-200 max-w-[480px]">
                                        <p className="font-bold mb-1">{selectedViewPlan.plan_name}</p>
                                        <p className="text-xs text-muted-foreground mb-2">{selectedViewPlan.carrier} · {selectedViewPlan.plan_type} · {selectedViewPlan.network_type}</p>
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                            <div>月保费 <span className="font-bold text-sm">${selectedViewPlan.monthly_premium?.toFixed(2)}</span></div>
                                            <div>免赔额 <span className="font-medium">${selectedViewPlan.deductible?.toLocaleString()}</span></div>
                                            <div>最高自付 <span className="font-medium">${selectedViewPlan.max_out_of_pocket?.toLocaleString()}</span></div>
                                            <div>门诊费 <span className="font-medium">{selectedViewPlan.primary_care_copay || '-'}</span></div>
                                            <div>专科 <span className="font-medium">{selectedViewPlan.specialist_copay || '-'}</span></div>
                                            <div>急诊 <span className="font-medium">{selectedViewPlan.emergency_room || '-'}</span></div>
                                            <div>处方药 <span className="font-medium">{selectedViewPlan.generic_drugs || '-'}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="h-8 text-sm px-8 rounded-full" onClick={() => {
                                            setShowHealthResults(false);
                                            setStep(4);
                                            setChatStage(10);
                                            const p = selectedViewPlan;
                                            const planSummary = `${p.plan_name} (${p.carrier}) - ${p.plan_type} ${p.network_type}\n月保费: $${p.monthly_premium?.toFixed(2)} | 免赔额: $${p.deductible?.toLocaleString()} | 最高自付: $${p.max_out_of_pocket?.toLocaleString()}`;
                                            setMessages([
                                                { id: 'enroll-1', sender: 'user', text: `我想投保【${p.plan_name}】` },
                                                { id: 'enroll-2', sender: 'bot', text: `您选择了以下计划：\n\n${planSummary}\n\n为了完成投保，请提供以下信息：`, interactiveWidget: 'health_enroll' },
                                            ]);
                                            setEnrollingPlan(p);
                                        }}>投保</Button>
                                        <Button variant="outline" size="sm" className="h-8 text-sm px-6 rounded-full" onClick={() => {
                                            setShowPlanCard(false);
                                            const p = selectedViewPlan;
                                            const text = `简单介绍一下这个保险: ${p.plan_name}`;
                                            const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
                                            setQuoteChatMessages(prev => [...prev, userMsg]);
                                            setIsBotTyping(true);
                                            fetch(`${API_BASE}/api/chat`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ quote_id: activeQuoteId, message: text, history: quoteChatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), selected_plan: p }),
                                            })
                                            .then(r => r.json())
                                            .then(data => { setIsBotTyping(false); setHighlightedPlans(data.mentioned_plans || []); setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: data.reply }]); })
                                            .catch(() => { setIsBotTyping(false); setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: '抱歉，暂时无法获取详情。' }]); });
                                        }}>保险介绍</Button>
                                        <Button variant="outline" size="sm" className="h-8 text-sm px-6 rounded-full" onClick={() => {
                                            setShowPlanCard(false);
                                            const p = selectedViewPlan;
                                            const text = `请详细介绍这个保险的所有细节，包括适用人群、优缺点、和其他计划的对比: ${p.plan_name}`;
                                            const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
                                            setQuoteChatMessages(prev => [...prev, userMsg]);
                                            setIsBotTyping(true);
                                            fetch(`${API_BASE}/api/chat`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ quote_id: activeQuoteId, message: text, history: quoteChatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), selected_plan: p }),
                                            })
                                            .then(r => r.json())
                                            .then(data => { setIsBotTyping(false); setHighlightedPlans(data.mentioned_plans || []); setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: data.reply }]); })
                                            .catch(() => { setIsBotTyping(false); setQuoteChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: '抱歉，暂时无法获取详情。' }]); });
                                        }}>详细信息</Button>
                                    </div>
                                </>)}

                                <div ref={bottomRef} />
                            </div>
                        </div>

                    </div>
                ) : (
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

                                {/* === LIFE DETAILS WIDGET === */}
                                {msg.interactiveWidget === 'life_details' && (
                                    <LifeDetailsWidget onSubmit={(text, data) => handleSend(text, data)} />
                                )}

                                {/* === HEALTH QUOTE FORM WIDGET === */}
                                {msg.interactiveWidget === 'health_form' && (
                                    <HealthQuoteForm onSubmit={(data) => {
                                        const summary = `邮编: ${data.zip}, 年龄: ${data.age}, 性别: ${data.sex === 'Male' ? '男' : '女'}, 收入: $${data.income}, 家庭人数: ${data.household_size}`;
                                        handleSend(summary);
                                        triggerHealthQuote(data);
                                    }} />
                                )}

                                {/* === HEALTH ENROLL WIDGET === */}
                                {msg.interactiveWidget === 'health_enroll' && enrollingPlan && (
                                    <HealthEnrollWidget plan={enrollingPlan} onBack={() => {
                                        setShowHealthResults(true);
                                        setStep(3);
                                    }} onSubmit={(text) => {
                                        setMessages(prev => [
                                            ...prev.map(m => ({ ...m, interactiveWidget: undefined as any })),
                                            { id: Date.now().toString(), sender: 'user' as const, text },
                                        ]);
                                        setIsBotTyping(true);
                                        setTimeout(() => {
                                            setIsBotTyping(false);
                                            setStep(5);
                                            setMessages(prev => [...prev, {
                                                id: (Date.now() + 1).toString(),
                                                sender: 'bot' as const,
                                                text: `您的投保申请已提交！\n\n计划: ${enrollingPlan.plan_name}\n保险公司: ${enrollingPlan.carrier}\n月保费: $${enrollingPlan.monthly_premium?.toFixed(2)}\n\n我们的顾问将在1个工作日内与您联系确认投保信息。感谢您使用鲜橙保险！`,
                                            }]);
                                        }, 1500);
                                    }} />
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
                )}

                <div className="px-4 py-3 bg-white relative max-w-[768px] mx-auto w-full shrink-0">
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
                            placeholder={showHealthResults ? "询问保险方案相关问题..." : "输入任何问题..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (showHealthResults ? handleQuoteChat() : handleSend())}
                            onFocus={() => setShowPlusMenu(false)}
                            disabled={isBotTyping}
                            className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-[#2d2d2d] placeholder:text-[#b4b4b4]"
                        />
                        <button
                            onClick={() => showHealthResults ? handleQuoteChat() : handleSend()}
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
