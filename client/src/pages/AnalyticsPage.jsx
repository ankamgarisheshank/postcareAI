import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDashboardStats, getPatients } from '../services/patientService';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineFire, HiOutlineBeaker, HiOutlineClipboardList, HiOutlineExclamationCircle, HiOutlineTrendingUp } from 'react-icons/hi';

const COLORS = ['#111', '#C8FF00', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardStats().then(r => r.data?.data),
            getPatients().then(r => r.data?.data || []),
        ]).then(([d, p]) => { setData(d); setPatients(p); })
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-5">
            <div className="loading-shimmer" style={{ height: 60, borderRadius: 16 }} />
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer" style={{ height: 300, borderRadius: 16 }} />)}
            </div>
        </div>
    );

    const recoveryTrend = (data?.recoveryTrend || []).map(d => ({
        date: d._id, pain: Math.round(d.avgPain * 10) / 10,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
    }));
    const statusData = (data?.statusBreakdown || []).map(s => ({ name: s._id || 'Unknown', value: s.count }));
    const riskData = patients.reduce((acc, p) => { const r = p.riskLevel || 'Low'; const f = acc.find(x => x.name === r); f ? f.value++ : acc.push({ name: r, value: 1 }); return acc; }, []);
    const recoveryDist = [
        { range: '0-20%', count: patients.filter(p => (p.recoveryScore || 0) <= 20).length },
        { range: '21-40%', count: patients.filter(p => (p.recoveryScore || 0) > 20 && p.recoveryScore <= 40).length },
        { range: '41-60%', count: patients.filter(p => (p.recoveryScore || 0) > 40 && p.recoveryScore <= 60).length },
        { range: '61-80%', count: patients.filter(p => (p.recoveryScore || 0) > 60 && p.recoveryScore <= 80).length },
        { range: '81-100%', count: patients.filter(p => (p.recoveryScore || 0) > 80).length },
    ];

    const tooltipStyle = { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, fontFamily: 'Inter', fontSize: 13 };

    const Card = ({ title, icon: Icon, children }) => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="chart-card">
            <div className="chart-header">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={20} style={{ color: 'var(--text-muted)' }} />}
                    <h3 className="chart-title">{title}</h3>
                </div>
            </div>
            {children}
        </motion.div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>AI Analytics</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Recovery tracking & autonomous patient analytics</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {[
                    { label: 'Avg Pain', value: recoveryTrend.length > 0 ? (recoveryTrend.reduce((a, b) => a + b.pain, 0) / recoveryTrend.length).toFixed(1) : '0' },
                    { label: 'Total Patients', value: patients.length },
                    { label: 'High Risk', value: riskData.find(r => r.name === 'High')?.value || 0 },
                    { label: 'Avg Recovery', value: patients.length ? Math.round(patients.reduce((a, b) => a + (b.recoveryScore || 0), 0) / patients.length) + '%' : '0%' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <Card title="Pain Trend (Last 7 Days)" icon={HiOutlineFire}>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={recoveryTrend}>
                            <defs>
                                <linearGradient id="pG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#111" stopOpacity={0.08} />
                                    <stop offset="95%" stopColor="#111" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" name="Pain Level" stroke="#111" fill="url(#pG)" strokeWidth={2.5} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="Medicine Adherence Rate" icon={HiOutlineBeaker}>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={recoveryTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="adherence" name="Adherence %" fill="#C8FF00" radius={[6, 6, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="Patient Status Distribution" icon={HiOutlineClipboardList}>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="Risk Level Distribution" icon={HiOutlineExclamationCircle}>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={riskData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#555', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" name="Patients" fill="#111" radius={[0, 6, 6, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card title="Recovery Score Distribution" icon={HiOutlineTrendingUp}>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={recoveryDist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" name="Patients" fill="#C8FF00" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default AnalyticsPage;
