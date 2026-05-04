const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Star, Plus, Trash, Sparkles, X, FileText, ChevronRight, ChevronDown, Compass, Stethoscope, FlaskConical, Pill, Briefcase, ShieldCheck, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { registerChatHandler, pushBotMessage } from '../lib/chatBus';

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
    gross_premium?: number | null;
    deductible: number | null;
    deductible_family?: number | null;
    max_out_of_pocket: number | null;
    max_out_of_pocket_family?: number | null;
    primary_care_copay: string | null;
    specialist_copay: string | null;
    urgent_care?: string | null;
    emergency_room: string | null;
    generic_drugs: string | null;
    hsa_eligible?: boolean;
    features: string[];
    plan_id?: string | null;
    sbc_url?: string | null;
}

const PLAN_TYPE_COLORS: Record<string, string> = {
    Bronze: '#B87333',
    Silver: '#8E9BAE',
    Gold: '#D4A843',
    Platinum: '#5A6B7F',
};

const CARRIER_PALETTE = [
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
    { bg: 'bg-rose-100', text: 'text-rose-800' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
];

const carrierStyle = (carrier: string) => {
    let h = 0;
    for (let i = 0; i < carrier.length; i++) h = (h * 31 + carrier.charCodeAt(i)) | 0;
    return CARRIER_PALETTE[Math.abs(h) % CARRIER_PALETTE.length];
};

const carrierInitials = (carrier: string) => {
    const parts = carrier.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return carrier.slice(0, 2).toUpperCase();
};

const carrierLogoUrl = (carrier: string): string | null => {
    const c = carrier.toLowerCase();
    let slug: string | null = null;
    if (c.includes('kaiser')) slug = 'kaiser';
    else if (c.includes('anthem')) slug = 'anthemca';
    else if (c.includes('blue shield') || c.includes('blueshield') || c.includes('bcbs') || c.includes('blue cross')) slug = 'bcbs';
    else if (c.includes('health net') || c.includes('healthnet')) slug = 'healthnet';
    else if (c.includes('molina')) slug = 'molina';
    else if (c.includes('oscar')) slug = 'oscar';
    else if (c.includes('cigna')) slug = 'cigna';
    else if (c.includes('aetna')) slug = 'aetna';
    else if (c.includes('united') || c.includes('uhc')) slug = 'uhc';
    else if (c.includes('humana')) slug = 'humana';
    else if (c.includes('centene')) slug = 'centene';
    else if (c.includes('ambetter')) slug = 'ambetter';
    return slug ? `https://s.catch.co/img/carriers/${slug}.png` : null;
};

const CarrierLogo: React.FC<{ carrier: string; size: number; className?: string }> = ({ carrier, size, className = '' }) => {
    const logoUrl = carrierLogoUrl(carrier);
    if (logoUrl) {
        return (
            <div
                className={`rounded-full bg-cover bg-center bg-no-repeat shrink-0 ${className}`}
                style={{ width: size, height: size, backgroundImage: `url(${logoUrl})` }}
                aria-label={carrier}
            />
        );
    }
    const cs = carrierStyle(carrier);
    return (
        <div
            className={`rounded-full flex items-center justify-center shrink-0 font-bold ${cs.bg} ${cs.text} ${className}`}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
            aria-label={carrier}
        >
            {carrierInitials(carrier)}
        </div>
    );
};

const isHsaEligible = (plan: HealthPlan) =>
    plan.features?.some(f => /HSA/i.test(f)) ?? false;

const formatCopay = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const s = raw.trim();
    if (!s) return null;

    if (/after\s*deductible/i.test(s)) return null;
    if (/coinsurance/i.test(s)) return null;
    if (/no\s*charge/i.test(s)) return null;
    if (/not\s*covered/i.test(s)) return null;

    const dollarCopay = s.match(/\$\s*([\d,]+)\s*copay/i);
    if (dollarCopay) return `$${dollarCopay[1]}`;

    const plainDollar = s.match(/^\$?\s*([\d,]+)\s*$/);
    if (plainDollar) return `$${plainDollar[1]}`;

    return null;
};

const RangeHistogram: React.FC<{
    counts: number[];
    min: number;
    max: number;
    value: number;
    onChange: (v: number) => void;
    format: (v: number) => string;
}> = ({ counts, min, max, value, onChange, format }) => {
    const maxCount = Math.max(...counts) || 1;
    const trackRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const range = max - min;
    const handlePct = range > 0 ? Math.min(1, Math.max(0, (value - min) / range)) : 1;
    const [dragging, setDragging] = useState(false);

    const setFromX = (clientX: number) => {
        const el = trackRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        onChangeRef.current(min + range * pct);
    };

    const beginDrag = (clientX: number) => {
        setDragging(true);
        setFromX(clientX);

        const onMove = (ev: PointerEvent) => {
            ev.preventDefault();
            setFromX(ev.clientX);
        };
        const onUp = () => {
            setDragging(false);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    };

    return (
        <div className="mt-3 select-none">
            <div
                ref={trackRef}
                className="relative h-12 cursor-pointer touch-none"
                onPointerDown={(e) => { e.preventDefault(); beginDrag(e.clientX); }}
            >
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-[2px] h-full pointer-events-none">
                    {counts.map((c, i) => {
                        const pct = (i + 0.5) / counts.length;
                        const isActive = pct <= handlePct;
                        return (
                            <div
                                key={i}
                                className={`flex-1 rounded-sm ${isActive ? 'bg-slate-900' : 'bg-slate-200'} ${dragging ? '' : 'transition-colors'}`}
                                style={{ height: `${(c / maxCount) * 100}%`, minHeight: c > 0 ? '4px' : '2px' }}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="relative mt-1.5">
                <div className="h-px bg-slate-200" />
                <div
                    className="absolute -top-2.5 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${handlePct * 100}%` }}
                >
                    <button
                        type="button"
                        aria-label="拖动调节"
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); beginDrag(e.clientX); }}
                        className={`w-4 h-4 rounded-full bg-white border-2 shadow-sm touch-none ${
                            dragging ? 'border-slate-900 cursor-grabbing scale-110' : 'border-slate-400 cursor-grab hover:border-slate-700'
                        } transition-transform`}
                    />
                    <span className="text-[11px] text-slate-700 mt-1 whitespace-nowrap">{format(value)}</span>
                </div>
            </div>
        </div>
    );
};

const CARRIER_BAND_COLORS: Record<string, string> = {
    kaiser: '#0c5560',
    anthemca: '#1f6dad',
    bcbs: '#1f6dad',
    healthnet: '#005f9e',
    molina: '#1ba398',
    oscar: '#0d4ea7',
    cigna: '#0f5c8a',
    aetna: '#5d2d8d',
    uhc: '#0040a5',
    humana: '#69b134',
};

const carrierBandColor = (carrier: string): string => {
    const c = carrier.toLowerCase();
    if (c.includes('kaiser')) return CARRIER_BAND_COLORS.kaiser;
    if (c.includes('anthem')) return CARRIER_BAND_COLORS.anthemca;
    if (c.includes('blue shield') || c.includes('blue cross') || c.includes('bcbs')) return CARRIER_BAND_COLORS.bcbs;
    if (c.includes('health net') || c.includes('healthnet')) return CARRIER_BAND_COLORS.healthnet;
    if (c.includes('molina')) return CARRIER_BAND_COLORS.molina;
    if (c.includes('oscar')) return CARRIER_BAND_COLORS.oscar;
    if (c.includes('cigna')) return CARRIER_BAND_COLORS.cigna;
    if (c.includes('aetna')) return CARRIER_BAND_COLORS.aetna;
    if (c.includes('united') || c.includes('uhc')) return CARRIER_BAND_COLORS.uhc;
    if (c.includes('humana')) return CARRIER_BAND_COLORS.humana;
    return '#1e293b';
};

const PlanDetailPanel: React.FC<{
    plan: HealthPlan;
    onClose: () => void;
    onEnroll: (plan: HealthPlan) => void;
}> = ({ plan, onClose, onEnroll }) => {
    const [openSection, setOpenSection] = useState<string | null>('common_costs');

    const bandColor = carrierBandColor(plan.carrier);
    const grossPremium = plan.gross_premium ?? (plan.monthly_premium ? Math.round(plan.monthly_premium * 1.5) : null);
    const showSubsidy = grossPremium != null && plan.monthly_premium != null && grossPremium > plan.monthly_premium + 0.5;

    const fmtMoney = (v: number | null | undefined) => v != null ? `$${v.toLocaleString()}` : '—';
    const metalDisplay = plan.features?.includes('Expanded Bronze') ? 'Expanded Bronze' : plan.plan_type;

    const sections: { id: string; icon: React.ReactNode; title: string; desc?: React.ReactNode; rows?: { label: string; value: string }[] }[] = [
        {
            id: 'common_costs',
            icon: <DollarSign size={18} />,
            title: '常见费用',
            rows: [
                { label: '门诊（Primary care）', value: plan.primary_care_copay || '—' },
                { label: '专科（Specialist）', value: plan.specialist_copay || '—' },
                { label: '急诊（Emergency）', value: plan.emergency_room || '—' },
                { label: '处方药（Generic）', value: plan.generic_drugs || '—' },
            ],
        },
        {
            id: 'ehb',
            icon: <ShieldCheck size={18} />,
            title: '基本健康保障',
            desc: '所有 ACA 计划均涵盖 10 项基本健康保障（Essential Health Benefits），包括门诊、急诊、住院、孕产、心理健康、处方药、预防保健等。',
        },
        {
            id: 'doctor',
            icon: <Stethoscope size={18} />,
            title: '医生就诊',
            rows: [
                { label: '门诊（Primary care）', value: plan.primary_care_copay || '—' },
                { label: '专科（Specialist）', value: plan.specialist_copay || '—' },
                { label: '紧急护理（Urgent care）', value: plan.urgent_care || plan.emergency_room || '—' },
            ],
        },
        {
            id: 'treatment',
            icon: <Briefcase size={18} />,
            title: '治疗与服务',
            desc: '具体费用因服务类型而异，详情请查看保单文件（SBC）。',
        },
        {
            id: 'labs',
            icon: <FlaskConical size={18} />,
            title: '化验与影像',
            desc: '具体费用因服务类型而异，详情请查看保单文件（SBC）。',
        },
        {
            id: 'rx',
            icon: <Pill size={18} />,
            title: '处方药',
            rows: [
                { label: '常用药（Generic）', value: plan.generic_drugs || '—' },
            ],
        },
    ];

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-white shadow-[0_-12px_60px_-12px_rgba(15,23,42,0.4)] flex flex-col animate-in slide-in-from-right duration-300"
                role="dialog"
                aria-modal="true"
            >
                <div className="relative h-[68px] shrink-0" style={{ background: bandColor }}>
                    <button
                        onClick={onClose}
                        aria-label="关闭"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <div className="px-6 -mt-7 relative">
                        <div className="w-14 h-14 rounded-full bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center overflow-hidden">
                            <CarrierLogo carrier={plan.carrier} size={48} />
                        </div>
                    </div>

                    <div className="px-6 pt-3">
                        <p className="text-sm font-medium text-slate-700">{plan.carrier}</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900 leading-tight">{plan.plan_name}</h2>
                        {plan.plan_id && <p className="mt-1 text-xs text-slate-400 font-mono">{plan.plan_id}</p>}

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2">
                                <Compass size={16} className="text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{plan.network_type || '—'}</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">网络</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLAN_TYPE_COLORS[plan.plan_type] || '#94a3b8' }} />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{metalDisplay}</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">等级</p>
                                </div>
                            </div>
                            <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 ${plan.hsa_eligible ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60'}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                                    <rect x="2" y="6" width="20" height="14" rx="2" />
                                    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
                                </svg>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${plan.hsa_eligible ? 'text-slate-900' : 'text-slate-400'}`}>HSA</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">{plan.hsa_eligible ? '可用' : '不适用'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 mx-6 rounded-2xl bg-slate-50 px-5 py-4 divide-y divide-slate-200/70">
                        <div className="flex items-center justify-between py-2.5 first:pt-0">
                            <span className="text-sm font-semibold text-slate-900 underline decoration-dotted underline-offset-4">月保费</span>
                            <div className="text-right">
                                {showSubsidy && (
                                    <span className="text-sm text-slate-400 line-through mr-2">${grossPremium}</span>
                                )}
                                <span className="text-sm font-bold text-slate-900">${plan.monthly_premium?.toFixed(0) ?? '—'}/月</span>
                            </div>
                        </div>
                        {plan.deductible_family != null && (
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-sm font-semibold text-slate-900 underline decoration-dotted underline-offset-4">家庭免赔额（医疗）</span>
                                <span className="text-sm font-semibold text-slate-900">{fmtMoney(plan.deductible_family)}/年</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-slate-700">个人免赔额（医疗）</span>
                            <span className="text-sm text-slate-900">{fmtMoney(plan.deductible)}/年</span>
                        </div>
                        {plan.max_out_of_pocket_family != null && (
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-sm font-semibold text-slate-900 underline decoration-dotted underline-offset-4">家庭最高自付</span>
                                <span className="text-sm font-semibold text-slate-900">{fmtMoney(plan.max_out_of_pocket_family)}/年</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2.5 last:pb-0">
                            <span className="text-sm text-slate-700">个人最高自付</span>
                            <span className="text-sm text-slate-900">{fmtMoney(plan.max_out_of_pocket)}/年</span>
                        </div>
                    </div>

                    <div className="mx-6 mt-6">
                        <span className="inline-block px-3.5 py-1.5 bg-slate-200 rounded-full text-xs font-medium text-slate-700">免赔后</span>
                    </div>

                    <div className="mx-6 mt-3 divide-y divide-slate-200/70 border-y border-slate-200/70">
                        {sections.map(s => {
                            const isOpen = openSection === s.id;
                            return (
                                <div key={s.id}>
                                    <button
                                        onClick={() => setOpenSection(isOpen ? null : s.id)}
                                        className="w-full flex items-center gap-3 px-1 py-4 text-left hover:bg-slate-50/60 transition-colors"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="text-slate-500 shrink-0">{s.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-slate-900">{s.title}</p>
                                            {!isOpen && s.desc && (
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.desc}</p>
                                            )}
                                        </div>
                                        <span className="text-slate-400 shrink-0">
                                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div className="px-1 pb-4 -mt-1 ml-8 text-sm text-slate-700 space-y-2">
                                            {s.desc && <p className="text-slate-600 leading-relaxed">{s.desc}</p>}
                                            {s.rows && s.rows.map(r => (
                                                <div key={r.label} className="flex justify-between gap-4">
                                                    <span className="text-slate-600">{r.label}</span>
                                                    <span className="font-medium text-slate-900 text-right">{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {plan.sbc_url && (
                        <a
                            href={plan.sbc_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mx-6 mt-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <FileText size={14} />
                            查看保单文件 (SBC)
                        </a>
                    )}
                </div>

                <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:right-6">
                    <Button
                        onClick={() => onEnroll(plan)}
                        size="lg"
                        className="w-full sm:w-auto rounded-full bg-slate-900 px-6 text-white shadow-lg hover:bg-slate-800"
                    >
                        投保此计划
                    </Button>
                </div>

                {/* PDF link in top-right corner of header for screenshot parity */}
                {plan.sbc_url && (
                    <a
                        href={plan.sbc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-[78px] right-6 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    >
                        <FileText size={13} />
                        PDF
                    </a>
                )}
            </aside>
        </>
    );
};

const HealthQuoteResults: React.FC<{
    plans: HealthPlan[];
    onBack: () => void;
    highlightedPlans?: string[];
    selectedPlan: HealthPlan | null;
    onSelectPlan: (plan: HealthPlan | null) => void;
    onEnroll?: (plan: HealthPlan) => void;
}> = ({ plans, onBack, highlightedPlans = [], selectedPlan, onSelectPlan, onEnroll }) => {
    const allPremiums = plans.map(p => p.monthly_premium ?? 0).filter(v => v > 0);
    const allDeductibles = plans.map(p => p.deductible ?? 0).filter(v => v >= 0);
    const minPremium = allPremiums.length ? Math.min(...allPremiums) : 0;
    const maxPremium = allPremiums.length ? Math.max(...allPremiums) : 0;
    const minDeductible = allDeductibles.length ? Math.min(...allDeductibles) : 0;
    const maxDeductible = allDeductibles.length ? Math.max(...allDeductibles) : 0;

    const [premiumCap, setPremiumCap] = useState(maxPremium);
    const [deductibleCap, setDeductibleCap] = useState(maxDeductible);
    const [metalFilter, setMetalFilter] = useState<string[]>([]);
    const [networkFilter, setNetworkFilter] = useState<string[]>([]);
    const [carrierFilter, setCarrierFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('premium_asc');
    const [showFilters, setShowFilters] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(min-width: 1024px)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => {
            if (!e.matches) setShowFilters(false);
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => { setPremiumCap(maxPremium); }, [maxPremium]);
    useEffect(() => { setDeductibleCap(maxDeductible); }, [maxDeductible]);

    const uniqueCarriers = useMemo(
        () => Array.from(new Set(plans.map(p => p.carrier).filter(Boolean))),
        [plans]
    );
    const METALS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const NETWORKS = ['HMO', 'PPO', 'EPO', 'POS'];

    const computeHistogram = (values: number[], lo: number, hi: number, bins = 18) => {
        const counts = Array(bins).fill(0);
        const r = hi - lo || 1;
        for (const v of values) {
            const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / r) * bins)));
            counts[idx]++;
        }
        return counts;
    };

    const premiumHist = useMemo(() => computeHistogram(allPremiums, minPremium, maxPremium), [plans]);
    const deductibleHist = useMemo(() => computeHistogram(allDeductibles, minDeductible, maxDeductible), [plans]);

    const filteredPlans = useMemo(() => {
        const f = plans.filter(p => {
            if (typeof p.monthly_premium === 'number' && p.monthly_premium > premiumCap + 0.5) return false;
            if (typeof p.deductible === 'number' && p.deductible > deductibleCap + 0.5) return false;
            if (metalFilter.length && !metalFilter.includes(p.plan_type)) return false;
            if (networkFilter.length && !networkFilter.includes(p.network_type)) return false;
            if (carrierFilter.length && !carrierFilter.includes(p.carrier)) return false;
            return true;
        });
        f.sort((a, b) => {
            switch (sortBy) {
                case 'premium_asc': return (a.monthly_premium ?? Infinity) - (b.monthly_premium ?? Infinity);
                case 'premium_desc': return (b.monthly_premium ?? -Infinity) - (a.monthly_premium ?? -Infinity);
                case 'deductible_asc': return (a.deductible ?? Infinity) - (b.deductible ?? Infinity);
                case 'deductible_desc': return (b.deductible ?? -Infinity) - (a.deductible ?? -Infinity);
                default: return 0;
            }
        });
        return f;
    }, [plans, premiumCap, deductibleCap, metalFilter, networkFilter, carrierFilter, sortBy]);

    const lowestPremiumPlan = useMemo(() => {
        let best: HealthPlan | null = null;
        for (const p of filteredPlans) {
            if (typeof p.monthly_premium !== 'number') continue;
            if (!best || p.monthly_premium < (best.monthly_premium ?? Infinity)) best = p;
        }
        return best;
    }, [filteredPlans]);

    const toggle = (set: string[], value: string, setter: (v: string[]) => void) => {
        setter(set.includes(value) ? set.filter(v => v !== value) : [...set, value]);
    };

    const activeFilterCount =
        (premiumCap < maxPremium ? 1 : 0) +
        (deductibleCap < maxDeductible ? 1 : 0) +
        metalFilter.length + networkFilter.length + carrierFilter.length;

    const clearAll = () => {
        setPremiumCap(maxPremium);
        setDeductibleCap(maxDeductible);
        setMetalFilter([]);
        setNetworkFilter([]);
        setCarrierFilter([]);
        setSortBy('premium_asc');
    };

    const potentialSavings = Math.round(maxPremium - minPremium);

    return (
        <div className="flex flex-1 overflow-hidden bg-white relative">
            {/* Mobile backdrop */}
            {showFilters && (
                <div
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden fixed inset-0 z-30 bg-black/30"
                    aria-hidden="true"
                />
            )}
            {/* Sidebar */}
            <aside
                className={`bg-white overflow-y-auto transition-all duration-200
                    max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[280px] max-lg:px-6 max-lg:py-6 max-lg:shadow-xl
                    ${showFilters ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
                    lg:relative lg:shrink-0 lg:border-r lg:border-slate-200
                    ${showFilters
                        ? 'lg:w-[260px] lg:px-6 lg:py-6 lg:opacity-100 lg:pointer-events-auto'
                        : 'lg:w-0 lg:px-0 lg:py-0 lg:opacity-0 lg:pointer-events-none lg:border-r-0'}`}
            >
                <button
                    onClick={clearAll}
                    disabled={activeFilterCount === 0}
                    className="text-sm text-slate-400 hover:text-slate-700 disabled:opacity-50 disabled:hover:text-slate-400 mb-6 transition-colors"
                >
                    清除筛选
                </button>

                <section className="mb-7">
                    <h3 className="text-sm font-semibold text-slate-900">月保费</h3>
                    <p className="text-xs text-slate-500 mt-1">${minPremium.toFixed(0)} – ${maxPremium.toFixed(0)} / 月</p>
                    <RangeHistogram
                        counts={premiumHist}
                        min={minPremium}
                        max={maxPremium}
                        value={premiumCap}
                        onChange={setPremiumCap}
                        format={v => `$${Math.round(v)}`}
                    />
                </section>

                <section className="mb-7">
                    <h3 className="text-sm font-semibold text-slate-900">免赔额</h3>
                    <p className="text-xs text-slate-500 mt-1">${minDeductible.toLocaleString()} – ${maxDeductible.toLocaleString()} / 年</p>
                    <RangeHistogram
                        counts={deductibleHist}
                        min={minDeductible}
                        max={maxDeductible}
                        value={deductibleCap}
                        onChange={setDeductibleCap}
                        format={v => `$${Math.round(v).toLocaleString()}`}
                    />
                </section>

                <section className="mb-7">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">等级</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                        {METALS.map(m => {
                            const active = metalFilter.includes(m);
                            return (
                                <button
                                    key={m}
                                    onClick={() => toggle(metalFilter, m, setMetalFilter)}
                                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                                        active ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: PLAN_TYPE_COLORS[m] }} />
                                    <span className="text-[10px] text-slate-700">{m}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mb-7">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">网络</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {NETWORKS.map(n => {
                            const active = networkFilter.includes(n);
                            return (
                                <button
                                    key={n}
                                    onClick={() => toggle(networkFilter, n, setNetworkFilter)}
                                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                                        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {uniqueCarriers.length > 0 && (
                    <section className="mb-7">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">保险公司</h3>
                        <div className="flex flex-nowrap gap-2 overflow-x-auto -mx-1 px-1 [&::-webkit-scrollbar]:hidden">
                            {uniqueCarriers.map(c => {
                                const active = carrierFilter.includes(c);
                                return (
                                    <button
                                        key={c}
                                        onClick={() => toggle(carrierFilter, c, setCarrierFilter)}
                                        title={c}
                                        className={`shrink-0 rounded-full transition-all ${active ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                                    >
                                        <CarrierLogo carrier={c} size={32} />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-7 lg:px-10">
                <div className="max-w-[860px] mx-auto">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">保险方案</h1>
                            <p className="text-sm text-slate-500 mt-1.5">
                                共 <span className="font-medium text-slate-700">{filteredPlans.length} 个方案</span>
                                {activeFilterCount > 0 && <span className="text-slate-400">（已筛选）</span>}
                            </p>
                        </div>
                        <button
                            onClick={onBack}
                            className="text-sm text-slate-500 hover:text-slate-900 underline-offset-4 hover:underline shrink-0"
                        >
                            重新报价
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            aria-pressed={showFilters}
                            aria-label={showFilters ? '隐藏筛选' : '显示筛选'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                showFilters ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="13" y2="6" />
                                <line x1="17" y1="6" x2="20" y2="6" />
                                <line x1="4" y1="12" x2="9" y2="12" />
                                <line x1="13" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="18" x2="15" y2="18" />
                                <line x1="19" y1="18" x2="20" y2="18" />
                                <circle cx="15" cy="6" r="2" />
                                <circle cx="11" cy="12" r="2" />
                                <circle cx="17" cy="18" r="2" />
                            </svg>
                            <span>{activeFilterCount}</span>
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-slate-500">排序</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="text-sm font-medium bg-transparent border-0 outline-none cursor-pointer"
                            >
                                <option value="premium_asc">最低保费</option>
                                <option value="premium_desc">最高保费</option>
                                <option value="deductible_asc">最低免赔额</option>
                                <option value="deductible_desc">最高免赔额</option>
                            </select>
                        </div>
                    </div>

                    {filteredPlans.length > 0 && potentialSavings > 0 && (
                        <div className="mt-5 px-5 py-4 bg-emerald-100 rounded-2xl flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-900 font-bold text-sm shrink-0">$</div>
                            <div className="text-sm">
                                <p className="font-semibold text-slate-900">每月最多省下 <span className="text-emerald-900">${potentialSavings}</span></p>
                                <p className="text-slate-700 mt-0.5">我们会为您匹配所有可用的<span className="underline">税收抵免</span></p>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 flex flex-col gap-3 pb-8">
                        {filteredPlans.map((plan, idx) => {
                            const isSelected = selectedPlan === plan;
                            const isHighlighted = highlightedPlans.includes(plan.plan_name);
                            const isLowest = plan === lowestPremiumPlan;
                            const hsa = isHsaEligible(plan);
                            const originalPrice = plan.monthly_premium ? Math.round(plan.monthly_premium * 1.5) : null;
                            return (
                                <div
                                    key={`${plan.plan_name}-${idx}`}
                                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                                        isSelected ? 'border-slate-900 shadow-md' : isHighlighted ? 'border-amber-300' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="px-5 py-4 cursor-pointer" onClick={() => onSelectPlan(isSelected ? null : plan)}>
                                        <div className="flex items-start gap-3">
                                            <CarrierLogo carrier={plan.carrier} size={40} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <h3 className="text-base font-semibold text-slate-900 leading-snug">{plan.plan_name}</h3>
                                                    <span className="text-xs text-slate-500 truncate">{plan.carrier}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    {plan.plan_type && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 text-[11px] rounded-full">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLAN_TYPE_COLORS[plan.plan_type] || '#94a3b8' }} />
                                                            {plan.plan_type}
                                                        </span>
                                                    )}
                                                    {plan.network_type && (
                                                        <span className="px-2 py-0.5 border border-slate-200 text-[11px] rounded-full text-slate-700">
                                                            {plan.network_type}
                                                        </span>
                                                    )}
                                                    {hsa && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 text-[11px] rounded-full text-slate-700">
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                                                            HSA 适用
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-3">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm min-w-0">
                                                <p className="text-slate-700">
                                                    <span className="font-bold text-slate-900">${plan.deductible?.toLocaleString() ?? '-'}</span>
                                                    <span className="text-slate-500"> 总免赔额</span>
                                                </p>
                                                {formatCopay(plan.primary_care_copay) && (
                                                    <p className="text-slate-700">
                                                        <span className="font-medium text-slate-900">{formatCopay(plan.primary_care_copay)}</span>
                                                        <span className="text-slate-500"> 门诊费</span>
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm shrink-0">
                                                {originalPrice && (
                                                    <span className="text-slate-400 line-through mr-1.5">${originalPrice}</span>
                                                )}
                                                <span className="font-bold text-slate-900">${plan.monthly_premium?.toFixed(0) ?? '-'}</span>
                                                <span className="text-slate-700">/月</span>
                                            </p>
                                        </div>
                                    </div>

                                    {isLowest && (
                                        <div className="px-5 py-2 bg-emerald-50 text-emerald-800 text-xs font-medium">最低保费</div>
                                    )}

                                    {isSelected && (
                                        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                            <Button
                                                size="sm"
                                                className="rounded-full px-5"
                                                onClick={(e) => { e.stopPropagation(); onEnroll?.(plan); }}
                                            >
                                                投保此计划
                                            </Button>
                                            <span className="text-xs text-slate-500">
                                                最高自付 ${plan.max_out_of_pocket?.toLocaleString() ?? '-'} · 门诊 {plan.primary_care_copay || '-'} · 急诊 {plan.emergency_room || '-'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredPlans.length === 0 && (
                            <div className="py-16 text-center text-slate-500 text-sm">
                                没有匹配的方案，请调整筛选条件。
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedPlan && onEnroll && (
                <PlanDetailPanel
                    plan={selectedPlan}
                    onClose={() => onSelectPlan(null)}
                    onEnroll={onEnroll}
                />
            )}
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
    '中国',
    '美国',
    '加拿大',
    '英国',
    '澳大利亚',
    '日本',
    '韩国',
    '德国',
    '法国',
    '其他国家'
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
        firstName: '', middleName: '', lastName: '',
        dob: '', gender: '', maritalStatus: '',
        ssn: '',
        phone: '', email: '',
        preferredLang: '中文',
        address: '', apt: '', city: '', state: '', zip: '',
        mailingSame: true,
        mailAddress: '', mailApt: '', mailCity: '', mailState: '', mailZip: '',
        taxStatus: '',
        annualIncome: '', incomeType: 'employment',
        qualifyingEvent: '',
    });
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; preview: string }[]>([]);
    const idInputRef = useRef<HTMLInputElement>(null);
    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) { alert('文件大小不能超过 10MB'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUploadedFiles(prev => [...prev, { name: file.name, preview: ev.target?.result as string }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };
    const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    const isValid = form.firstName && form.lastName && form.dob && form.gender && form.phone && form.address && form.city && form.zip && form.taxStatus && form.annualIncome;

    const labelClass = "block text-xs mb-0.5 text-muted-foreground";
    const optLabel = (text: string) => <label className={labelClass}>{text} <span className="text-muted-foreground/50">(可选)</span></label>;
    const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

    return (
        <Card className="animate-fade-in mt-4">
            <CardContent className="pt-4 space-y-5">
                <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                    {plan.plan_name} ({plan.carrier}) — ${plan.monthly_premium?.toFixed(2)}/月
                </div>

                {/* 1. Personal Info */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">个人信息</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className={labelClass}>名 *</label>
                            <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                        </div>
                        <div>
                            {optLabel('中间名')}
                            <Input value={form.middleName} onChange={e => set('middleName', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>姓 *</label>
                            <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className={labelClass}>出生日期 *</label>
                            <Input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>性别 *</label>
                            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={selectClass}>
                                <option value="">请选择</option>
                                <option value="Female">女</option>
                                <option value="Male">男</option>
                                <option value="TransFtoM">跨性别: 女转男</option>
                                <option value="TransMtoF">跨性别: 男转女</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>婚姻状况 *</label>
                            <select value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} className={selectClass}>
                                <option value="">请选择</option>
                                <option value="Single">单身</option>
                                <option value="Married">已婚</option>
                                <option value="Divorced">离异</option>
                                <option value="Widowed">丧偶</option>
                                <option value="DomesticPartner">注册同居伴侣</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Contact */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">联系方式</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className={labelClass}>手机号码 *</label>
                            <Input type="tel" placeholder="(xxx) xxx-xxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </div>
                        <div>
                            {optLabel('邮箱')}
                            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                        </div>
                        <div>
                            {optLabel('首选语言')}
                            <select value={form.preferredLang} onChange={e => set('preferredLang', e.target.value)} className={selectClass}>
                                <option value="中文">中文</option>
                                <option value="English">英语</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. Address */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">居住地址</h4>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-3">
                                <label className={labelClass}>街道地址 *</label>
                                <Input value={form.address} onChange={e => set('address', e.target.value)} />
                            </div>
                            <div>
                                {optLabel('公寓/单元号')}
                                <Input value={form.apt} onChange={e => set('apt', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                                <label className={labelClass}>城市 *</label>
                                <Input value={form.city} onChange={e => set('city', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>州</label>
                                <Input value={form.state} disabled className="bg-muted" />
                            </div>
                            <div>
                                <label className={labelClass}>邮编 *</label>
                                <Input value={form.zip} onChange={e => set('zip', e.target.value)} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={!!form.mailingSame} onChange={e => setForm(prev => ({ ...prev, mailingSame: e.target.checked }))} />
                            邮寄地址与居住地址相同
                        </label>
                        {!form.mailingSame && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="sm:col-span-3">
                                        <label className={labelClass}>邮寄街道地址</label>
                                        <Input value={form.mailAddress} onChange={e => set('mailAddress', e.target.value)} />
                                    </div>
                                    <div>
                                        {optLabel('公寓/单元号')}
                                        <Input value={form.mailApt} onChange={e => set('mailApt', e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div><label className={labelClass}>城市</label><Input value={form.mailCity} onChange={e => set('mailCity', e.target.value)} /></div>
                                    <div><label className={labelClass}>州</label><Input value={form.mailState} onChange={e => set('mailState', e.target.value)} /></div>
                                    <div><label className={labelClass}>邮编</label><Input value={form.mailZip} onChange={e => set('mailZip', e.target.value)} /></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 4. SSN */}
                <div>
                    {optLabel('社会安全号码')}
                    <Input type="text" placeholder="XXX-XX-XXXX" value={form.ssn} onChange={e => set('ssn', e.target.value)} className="max-w-xs" />
                </div>

                {/* 5. Tax Info */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">报税信息</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>报税状态 *</label>
                            <select value={form.taxStatus} onChange={e => set('taxStatus', e.target.value)} className={selectClass}>
                                <option value="">请选择</option>
                                <option value="Single">单身报税</option>
                                <option value="MarriedJointly">已婚联合报税</option>
                                <option value="HeadOfHousehold">户主报税</option>
                                <option value="MarriedSeparately">已婚分开报税</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 6. Income */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">收入信息</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>年收入总额 (税前) *</label>
                            <Input type="text" placeholder="例如: 60000" value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>收入类型</label>
                            <select value={form.incomeType} onChange={e => set('incomeType', e.target.value)} className={selectClass}>
                                <option value="employment">工资/薪水</option>
                                <option value="selfEmployment">自雇/个体经营</option>
                                <option value="investment">投资收入</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 7. Special Enrollment */}
                <div>
                    {optLabel('特殊投保事件')}
                    <select value={form.qualifyingEvent} onChange={e => set('qualifyingEvent', e.target.value)} className={`${selectClass} max-w-md`}>
                        <option value="">无 / 开放投保期</option>
                        <option value="lostCoverage">失去原有保险</option>
                        <option value="moved">搬迁至新地区</option>
                        <option value="married">结婚</option>
                        <option value="newBaby">新生儿/领养</option>
                        <option value="lostMedicaid">失去政府医疗补助资格</option>
                        <option value="other">其他</option>
                    </select>
                </div>

                {/* 8. Identity Verification */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">身份验证</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        请上传 A 类证件中的 <strong>1份</strong>，或 B 类证件中的 <strong>2份</strong> 来验证身份。
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="border rounded-lg p-3">
                            <h5 className="text-xs font-semibold mb-2 text-primary">A 类 — 上传1份</h5>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>· 驾驶执照</li>
                                <li>· 政府颁发的身份证件</li>
                                <li>· 美国护照</li>
                                <li>· 外国护照</li>
                                <li>· 领事馆证件 (带照片)</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg p-3 border-t-2 border-t-cyan-400">
                            <h5 className="text-xs font-semibold mb-2 text-cyan-600">B 类 — 上传2份</h5>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>· 社会安全卡</li>
                                <li>· 公共福利机构通知</li>
                                <li>· 美国出生证明</li>
                                <li>· 雇主ID卡</li>
                                <li>· 结婚证</li>
                            </ul>
                        </div>
                    </div>

                    <input
                        ref={idInputRef}
                        type="file"
                        accept="image/*,.pdf,.jpg,.jpeg,.png,.tiff,.gif"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <div
                        onClick={() => idInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-primary hover:bg-blue-50/30 transition"
                    >
                        <div className="text-2xl mb-1">📤</div>
                        <p className="text-sm text-muted-foreground">点击或拖拽上传证件照片</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">支持图片、PDF、TIFF 文件，最大 10MB</p>
                    </div>
                    {uploadedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                                    {file.preview.startsWith('data:image') ? (
                                        <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">PDF</div>
                                    )}
                                    <span className="text-sm flex-1 truncate">{file.name}</span>
                                    <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 text-xs shrink-0">删除</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onBack}>
                        返回选择
                    </Button>
                    <Button className="flex-1" disabled={!isValid}
                        onClick={() => onSubmit(`申请人: ${form.firstName} ${form.lastName}, ${form.phone}, ${form.email || '无邮箱'}`)}>
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
    const [noTobacco, setNoTobacco] = useState(true);
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
            uses_tobacco: !noTobacco,
        });
    };

    const fieldClass = "h-12 rounded-xl border border-[#161616] bg-white px-4 text-lg outline-none transition focus:ring-2 focus:ring-[#111115]/10";
    const memberInputClass = "h-10 rounded-xl border border-slate-300 bg-[#f8f8f8] px-3 text-sm outline-none placeholder:text-sm focus:ring-2 focus:ring-[#111115]/10";
    const sexButtonClass = (active: boolean) =>
        `h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
            active ? 'border-[#111115] bg-[#111115] text-white' : 'border-slate-300 bg-white text-[#111115] hover:bg-slate-50'
        }`;
    const errClass = "text-xs text-red-500 mt-1";

    return (
        <Card className="animate-fade-in mx-auto mt-8 w-full max-w-[680px] rounded-[24px] border-none bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
            <CardContent className="px-7 py-8 sm:px-10 sm:py-10">
                <div className="mx-auto max-w-[620px]">
                    <section>
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold leading-tight tracking-normal">您住在哪里？</h2>
                            <p className="mt-1 text-sm text-[#858585]">您所在地区会影响可选择的健康保险计划。</p>
                        </div>

                        <div className="max-w-[450px]">
                            <label className="mb-2 block text-sm font-medium">邮编</label>
                            <input
                                type="text"
                                maxLength={5}
                                placeholder="例如：92602"
                                value={zip}
                                onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
                                className={`${fieldClass} w-full ${errors.zip ? 'border-red-500' : ''}`}
                            />
                            {errors.zip && <p className={errClass}>{errors.zip}</p>}
                        </div>
                    </section>

                    <section className="mt-16">
                        <h2 className="text-2xl font-bold leading-tight tracking-normal">谁需要保障？</h2>
                        <p className="mt-1 text-sm text-[#858585]">填写需要保险的家庭成员。</p>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-slate-200 px-4 py-2">
                                <div className="text-sm font-medium">本人</div>
                                <input
                                    type="number"
                                    placeholder="年龄"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    className={`${memberInputClass} w-20 text-center ${errors.age ? 'border-red-500' : ''}`}
                                />
                                <button type="button" onClick={() => setSex('M')} className={sexButtonClass(sex === 'M')}>男</button>
                                <button type="button" onClick={() => setSex('F')} className={sexButtonClass(sex === 'F')}>女</button>
                            </div>

                            {additionalMembers.map((m, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-slate-200 px-4 py-2 last:border-b-0">
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <button
                                            type="button"
                                            onClick={() => removeMember(idx)}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-500"
                                            aria-label="删除家庭成员"
                                        >
                                            <Trash size={13} />
                                        </button>
                                        家庭成员 {idx + 1}
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="年龄"
                                        value={m.age}
                                        onChange={e => updateMember(idx, 'age', e.target.value)}
                                        className={`${memberInputClass} w-20 text-center ${errors[`member_age_${idx}`] ? 'border-red-500' : ''}`}
                                    />
                                    <button type="button" onClick={() => updateMember(idx, 'sex', 'M')} className={sexButtonClass(m.sex === 'M')}>男</button>
                                    <button type="button" onClick={() => updateMember(idx, 'sex', 'F')} className={sexButtonClass(m.sex === 'F')}>女</button>
                                </div>
                            ))}
                        </div>
                        {(errors.age || errors.sex || Object.keys(errors).some(k => k.startsWith('member_'))) && (
                            <p className={errClass}>请填写每位成员的有效年龄和性别。</p>
                        )}

                        <div className="mt-4 mb-6 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={addMember}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-100 px-5 text-sm font-semibold text-[#111115] hover:bg-slate-200"
                            >
                                <Plus size={15} /> 添加家庭成员
                            </button>
                        </div>
                    </section>

                    <section className="mt-8">
                        <label className="mb-2 block text-sm font-medium">家庭年收入（美元）</label>
                        <input
                            type="text"
                            placeholder="例如：60000"
                            value={income}
                            onChange={e => setIncome(e.target.value)}
                            className={`${fieldClass} w-full max-w-[450px] ${errors.income ? 'border-red-500' : ''}`}
                        />
                        {errors.income && <p className={errClass}>{errors.income}</p>}
                    </section>

                    <section className="mt-8">
                        <label className="inline-flex cursor-pointer select-none items-center gap-3">
                            <input
                                type="checkbox"
                                checked={noTobacco}
                                onChange={e => setNoTobacco(e.target.checked)}
                                className="h-5 w-5 cursor-pointer rounded border-2 border-[#161616] accent-[#111115]"
                            />
                            <span className="text-sm font-medium text-[#111115]">不吸烟</span>
                            <span className="text-xs text-[#858585]">（烟草使用者保费可能更高）</span>
                        </label>
                    </section>

                    <p className="mt-8 text-xs leading-5 text-slate-400">
                        提交后，我们将根据您填写的信息为您获取健康保险报价。
                    </p>

                    <div className="mt-10 flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            className="h-10 rounded-full bg-[#111115] px-7 text-sm text-white hover:bg-[#2a2a30]"
                        >
                            下一步
                        </Button>
                    </div>
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
    const [residence, setResidence] = useState({ country: '中国', addr1: '', addr2: '', city: '', state: '', zip: '' });
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
                                <label className="block text-sm mb-1 text-foreground font-medium">名和中间名</label>
                                <Input type="text" value={primaryName.first} onChange={e => setPrimaryName({...primaryName, first: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-foreground font-medium">姓</label>
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
                            <Input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="月/年" />
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

    const isLifeInsurance = selectedType === '人寿保险';
    const isHealthInsurance = selectedType === '健康保险';

    const getInitialMessage = (): Message => {
        if (isHealthInsurance) {
            return { id: '1', sender: 'bot', text: '欢迎使用鲜橙健康保险报价！请填写以下信息，我们将为您实时获取健康保险报价：', interactiveWidget: 'health_form' };
        }
        if (selectedType === '旅行保险') {
            return { id: '1', sender: 'bot', text: '为了给您提供准确的报价，请问您的国籍和目前的居住国是哪里？', interactiveWidget: 'country_selector' };
        }
        if (isLifeInsurance) {
            return { id: '1', sender: 'bot', text: '为了给您提供准确的报价，请填写以下基本信息：', interactiveWidget: 'life_details' };
        }
        return { id: '1', sender: 'bot', text: '首先，请问您所在地区或邮编是多少？' };
    };

    const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);

    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [chatStage, setChatStage] = useState(1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [travelData, setTravelData] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<QuotePlan | null>(null);
    const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
    const [showHealthResults, setShowHealthResults] = useState(false);
    const [enrollingPlan, setEnrollingPlan] = useState<HealthPlan | null>(null);
    const [activeQuoteId, setActiveQuoteId] = useState<number | null>(null);
    const [lastQuoteData, setLastQuoteData] = useState<any>(null);
    const [quoteChatMessages, setQuoteChatMessages] = useState<Message[]>([]);
    const [highlightedPlans, setHighlightedPlans] = useState<string[]>([]);
    const [selectedViewPlan, setSelectedViewPlan] = useState<HealthPlan | null>(null);

    const lastPromptedPlanKeyRef = useRef<string | null>(null);
    useEffect(() => {
        if (!selectedViewPlan || !showHealthResults || !activeQuoteId) return;
        const p = selectedViewPlan;
        const key = `${p.plan_name}|${p.carrier}`;
        if (lastPromptedPlanKeyRef.current === key) return;
        lastPromptedPlanKeyRef.current = key;
        pushBotMessage({
            text: `您选择了【${p.plan_name}】（${p.carrier}）。想了解什么？`,
            options: ['这个保险的详细信息', '这个保险适合我吗'],
        });
    }, [selectedViewPlan]);

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

        setTimeout(() => {
            setIsBotTyping(false);
            let newBotMsg: Message | null = null;

            // ====== HEALTH INSURANCE FLOW ======
            if (isHealthInsurance) {
                if (chatStage === 1) { // After health form submit
                    newBotMsg = {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: `信息已收到！正在为您获取健康保险报价...`
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

        setTimeout(() => {
            setIsBotTyping(false);

            let generatedQuotes: QuotePlan[] = [];

            if (flowType === 'travel') {
                generatedQuotes = [
                    {
                        id: 'plan_1',
                        name: '爱国者基础计划',
                        underwriter: '天狼星保险',
                        price: '$45',
                        period: '14天',
                        policyMax: '$50,000',
                        deductible: '$250',
                        features: ['突发疾病承保', '网络内医院直付', '新冠医疗有限承保']
                    },
                    {
                        id: 'plan_2',
                        name: '美洲地图全面计划',
                        tag: '最畅销',
                        underwriter: '伦敦劳合社',
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
        setIsLoadingQuote(true);

        const placeholderId = `quoting_${Date.now()}`;
        setMessages(prev => [...prev, {
            id: placeholderId,
            sender: 'bot' as const,
            text: '正在实时获取报价数据，请稍候...',
        }]);

        try {
            const res = await fetch(`${API_BASE}/api/quote_v2`, {
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
                    uses_tobacco: !!data.uses_tobacco,
                }),
            });

            if (!res.ok) throw new Error(`报价请求失败 (${res.status})`);
            const quoteData = await res.json();

            if (quoteData.quote_status === 'quoted' && quoteData.has_quote) {
                const rawPlans: HealthPlan[] = quoteData.quote_data?.plans || [];
                setHealthPlans(rawPlans);
                setActiveQuoteId(quoteData.quote_id);
                localStorage.setItem('jp_health_quote_id', JSON.stringify({ id: quoteData.quote_id, expires: Date.now() + 24 * 60 * 60 * 1000 }));

                setIsBotTyping(false);
                setIsLoadingQuote(false);
                setMessages(prev => [
                    ...prev.filter(m => m.id !== placeholderId),
                    {
                        id: Date.now().toString(),
                        sender: 'bot' as const,
                        text: `已找到 ${rawPlans.length} 个健康保险方案。`,
                    },
                ]);
                setShowHealthResults(true);
                return;
            }

            setIsBotTyping(false);
            setIsLoadingQuote(false);
            setMessages(prev => [
                ...prev.filter(m => m.id !== placeholderId),
                {
                    id: Date.now().toString(),
                    sender: 'bot' as const,
                    text: `报价获取失败: ${quoteData.quote_data?.error || quoteData.status_message || '未知错误'}`,
                    options: ['重试', '重新报价'],
                },
            ]);
        } catch (err) {
            setIsBotTyping(false);
            setIsLoadingQuote(false);
            setMessages(prev => [
                ...prev.filter(m => m.id !== placeholderId),
                {
                    id: Date.now().toString(),
                    sender: 'bot' as const,
                    text: `抱歉，报价请求失败，请稍后重试。错误: ${err}`,
                    options: ['重试', '重新报价'],
                },
            ]);
        }
    };

    const handlePurchase = (plan: QuotePlan) => {
        setIsBotTyping(true);

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

    const handleQuoteChat = async (textOverride?: string): Promise<{ reply: string } | null> => {
        const text = (textOverride ?? '').trim();
        if (!text || isBotTyping || !activeQuoteId) return null;

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
            return { reply: data.reply };
        } catch {
            setIsBotTyping(false);
            setHighlightedPlans([]);
            const fallback = '抱歉，暂时无法回复，请稍后再试。';
            setQuoteChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: fallback,
            }]);
            return { reply: fallback };
        }
    };

    const handleSend = async (textOverride?: string, widgetData?: any, imageBase64?: string): Promise<{ reply: string } | null> => {
        const textToSend = textOverride || '';
        if ((!textToSend.trim() && !imageBase64) || isBotTyping) return null;

        // Handle retry
        if (textToSend === '重试' && lastQuoteData) {
            setMessages(prev => prev.filter(m => !m.options));
            triggerHealthQuote(lastQuoteData);
            return null;
        }
        if (textToSend === '重新报价') {
            setMessages([getInitialMessage()]);
            setChatStage(1);
            setLastQuoteData(null);
            return null;
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
                return { reply: data.reply };
            } catch {
                setIsBotTyping(false);
                const fallback = '抱歉，暂时无法回复，请稍后再试。';
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'bot' as const,
                    text: fallback,
                }]);
                return { reply: fallback };
            }
        }

        simulateBotResponse(textToSend.trim() || '上传了图片', widgetData);
        return null;
    };

    const busHandlerRef = useRef<(text: string) => Promise<{ reply: string } | null>>(async () => null);
    busHandlerRef.current = async (text: string) => {
        if (showHealthResults && activeQuoteId) {
            return await handleQuoteChat(text);
        }
        return await handleSend(text);
    };

    useEffect(() => {
        registerChatHandler((text: string) => busHandlerRef.current(text));
        return () => registerChatHandler(null);
    }, []);

    const handleCountryWidgetSubmit = () => {
        if (!citizenship || !residence) return;
        handleSend(`国籍：${citizenship}，居住地：${residence}`);
    };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-full w-full">

            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {isLoadingQuote ? (
                    <div className="flex-1 overflow-hidden bg-gradient-to-b from-orange-50/50 via-orange-50/20 to-white flex items-center justify-center px-5 py-10">
                        <div className="relative w-full max-w-[480px]">
                            <div className="absolute inset-0 -z-10 rounded-[32px] bg-orange-50/60 blur-2xl scale-[1.04]" />
                            <div className="rounded-[28px] bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)] ring-1 ring-orange-100/80 px-8 py-12 text-center">
                                <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center">
                                    <Sparkles size={40} className="text-orange-500" strokeWidth={1.6} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">正在加载保险方案…</h2>
                                <div className="mx-auto my-6 h-1 w-[260px] max-w-full overflow-hidden rounded-full bg-orange-100">
                                    <div className="h-full w-1/3 rounded-full bg-orange-500 quote-loader-bar" />
                                </div>
                                <p className="text-sm leading-6 text-slate-500">
                                    正在根据您提供的信息<br />为您匹配最合适的保险方案
                                </p>
                            </div>
                        </div>
                    </div>
                ) : showHealthResults && healthPlans.length > 0 ? (
                    <HealthQuoteResults
                        plans={healthPlans}
                        highlightedPlans={highlightedPlans}
                        selectedPlan={selectedViewPlan}
                        onSelectPlan={(plan) => { setSelectedViewPlan(plan); setHighlightedPlans([]); }}
                        onBack={() => { setShowHealthResults(false); setHealthPlans([]); setActiveQuoteId(null); setQuoteChatMessages([]); setSelectedViewPlan(null); localStorage.removeItem('jp_health_quote_id'); }}
                        onEnroll={(p) => {
                            setShowHealthResults(false);
                            setChatStage(10);
                            const planSummary = `${p.plan_name} (${p.carrier}) - ${p.plan_type} ${p.network_type}\n月保费: $${p.monthly_premium?.toFixed(2)} | 免赔额: $${p.deductible?.toLocaleString()} | 最高自付: $${p.max_out_of_pocket?.toLocaleString()}`;
                            setMessages([
                                { id: 'enroll-1', sender: 'user', text: `我想投保【${p.plan_name}】` },
                                { id: 'enroll-2', sender: 'bot', text: `您选择了以下计划：\n\n${planSummary}\n\n为了完成投保，请提供以下信息：`, interactiveWidget: 'health_enroll' },
                            ]);
                            setEnrollingPlan(p);
                        }}
                    />
                ) : (
                <div className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-5">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full max-w-[768px] mx-auto flex-col ${msg.sender === 'bot' ? 'items-start' : 'items-end'}`}>
                            <div className={`flex flex-col gap-4 break-words text-[#0d0d0d] text-[15px] leading-[1.7] ${msg.sender === 'bot' ? 'max-w-full' : 'max-w-[85%] bg-[#f4f4f4] px-5 py-4 rounded-3xl'}`}>
                                <div className={msg.interactiveWidget && msg.sender === 'bot' ? 'hidden lg:block' : ''}>
                                    {msg.text}
                                    {msg.imageUrl && (
                                        <div className="mt-5">
                                            <img src={msg.imageUrl} alt="已上传图片" className="max-w-full max-h-[400px] rounded-lg border border-input" />
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
                                        const tobacco = data.uses_tobacco ? '吸烟' : '不吸烟';
                                        const summary = `邮编: ${data.zip}, 年龄: ${data.age}, 性别: ${data.sex === 'Male' ? '男' : '女'}, 收入: $${data.income}, 家庭人数: ${data.household_size}, ${tobacco}`;
                                        handleSend(summary);
                                        triggerHealthQuote(data);
                                    }} />
                                )}

                                {/* === HEALTH ENROLL WIDGET === */}
                                {msg.interactiveWidget === 'health_enroll' && enrollingPlan && (
                                    <HealthEnrollWidget plan={enrollingPlan} onBack={() => {
                                        setShowHealthResults(true);
                                    }} onSubmit={(text) => {
                                        setMessages(prev => [
                                            ...prev.map(m => ({ ...m, interactiveWidget: undefined as any })),
                                            { id: Date.now().toString(), sender: 'user' as const, text },
                                        ]);
                                        setIsBotTyping(true);
                                        setTimeout(() => {
                                            setIsBotTyping(false);
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

            </div>

        </div>
    );
};

export default QuotePage;
