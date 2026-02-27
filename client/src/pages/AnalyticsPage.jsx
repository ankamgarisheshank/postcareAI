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
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl loading-shimmer" />)}
        </div>
    );

    const recoveryTrend = (data?.recoveryTrend || []).map(d => ({
        date: d._id, pain: Math.round(d.avgPain * 10) / 10,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
        logs: d.totalLogs,
    }));

    const statusData = (data?.statusBreakdown || []).map(s => ({ name: s._id || 'Unknown', value: s.count }));

    const riskData = ['Low', 'Medium', 'High'].map(level => ({
        name: level, value: patients.filter(p => p.riskLevel === level).length,
    }));

    const recoveryDist = [
        { name: '0-25%', value: patients.filter(p => (p.recoveryScore || 0) <= 25).length },
        { name: '26-50%', value: patients.filter(p => (p.recoveryScore || 0) > 25 && (p.recoveryScore || 0) <= 50).length },
        { name: '51-75%', value: patients.filter(p => (p.recoveryScore || 0) > 50 && (p.recoveryScore || 0) <= 75).length },
        { name: '76-100%', value: patients.filter(p => (p.recoveryScore || 0) > 75).length },
    ];

    const Card = ({ title, children, className = '' }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card p-6 ${className}`}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {children}
        </motion.div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>📊 Analytics</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Recovery tracking & patient analytics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Recovery', value: `${patients.length > 0 ? Math.round(patients.reduce((s, p) => s + (p.recoveryScore || 0), 0) / patients.length) : 0}%`, color: '#6366f1' },
                    { label: 'Active Patients', value: patients.filter(p => p.status === 'Active').length, color: '#10b981' },
                    { label: 'Critical Cases', value: patients.filter(p => p.status === 'Critical').length, color: '#ef4444' },
                    { label: 'Recovered', value: patients.filter(p => p.status === 'Recovered').length, color: '#06b6d4' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 text-center">
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12 }} />
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
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12 }} />
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
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12 }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Patients">
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#ef4444" />
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
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12 }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Patients" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default AnalyticsPage;
