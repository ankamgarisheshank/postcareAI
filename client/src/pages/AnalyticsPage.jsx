import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDashboardStats, getPatients } from '../services/patientService';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardStats().then(r => r.data.data),
            getPatients({ limit: 100 }).then(r => r.data.data),
        ]).then(([d, p]) => { setData(d); setPatients(p); })
            .catch(() => toast.error('Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="loading-shimmer" style={{ height: 260, borderRadius: 16 }} />)}
        </div>
    );

    const recoveryTrend = (data?.recoveryTrend || []).map(d => ({
        date: d._id, pain: Math.round(d.avgPain * 10) / 10,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
        logs: d.totalLogs,
    }));
    const statusData = (data?.statusBreakdown || []).map(s => ({ name: s._id || 'Unknown', value: s.count }));
    const riskData = ['Low', 'Medium', 'High'].map(level => ({ name: level, value: patients.filter(p => p.riskLevel === level).length }));
    const recoveryDist = [
        { name: '0-25%', value: patients.filter(p => (p.recoveryScore || 0) <= 25).length },
        { name: '26-50%', value: patients.filter(p => (p.recoveryScore || 0) > 25 && (p.recoveryScore || 0) <= 50).length },
        { name: '51-75%', value: patients.filter(p => (p.recoveryScore || 0) > 50 && (p.recoveryScore || 0) <= 75).length },
        { name: '76-100%', value: patients.filter(p => (p.recoveryScore || 0) > 75).length },
    ];

    const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Poppins' };

    const Card = ({ title, children }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            <h3 className="text-xl font-bold text-primary mb-5 pb-2 border-b">{title}</h3>
            {children}
        </motion.div>
    );

    const summaryCards = [
        { label: 'Avg Recovery', value: `${patients.length > 0 ? Math.round(patients.reduce((s, p) => s + (p.recoveryScore || 0), 0) / patients.length) : 0}%`, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        { label: 'Active Patients', value: patients.filter(p => p.status === 'Active').length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { label: 'Critical Cases', value: patients.filter(p => p.status === 'Critical').length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        { label: 'Recovered', value: patients.filter(p => p.status === 'Recovered').length, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">📊 AI Analytics</h1>
                <p className="text-sm font-medium text-muted mt-1">Recovery tracking & autonomous patient analytics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {summaryCards.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center rounded-2xl shadow-sm" style={{ padding: 24, background: s.bg, border: `1px solid ${s.color}22` }}>
                        <p className="font-black text-4xl tracking-tight" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-sm font-bold text-secondary uppercase tracking-wider mt-2">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <Card title="🔥 Pain Trend (Last 7 Days)">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={recoveryTrend}>
                            <defs>
                                <linearGradient id="painG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" stroke="#ef4444" fill="url(#painG)" strokeWidth={2} name="Avg Pain" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="💊 Medicine Adherence Rate">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={recoveryTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="adherence" fill="#10b981" radius={[6, 6, 0, 0]} name="Adherence %" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="📋 Patient Status Distribution">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="⚠️ Risk Level Distribution">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={riskData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Patients">
                                <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card title="📈 Recovery Score Distribution">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={recoveryDist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Patients" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default AnalyticsPage;
