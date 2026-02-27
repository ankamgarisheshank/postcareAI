import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDashboardStats } from '../services/patientService';
import { HiOutlineUsers, HiOutlineHeart, HiOutlineExclamation, HiOutlineCalendar, HiOutlineArrowRight, HiOutlineTrendingUp } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statCards = [
    { key: 'totalPatients', label: 'Total Patients', icon: HiOutlineUsers, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { key: 'activeCases', label: 'Active Cases', icon: HiOutlineHeart, gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { key: 'highRiskAlerts', label: 'High Risk Alerts', icon: HiOutlineExclamation, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { key: 'todaysFollowUps', label: "Today's Follow-ups", icon: HiOutlineCalendar, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashboardPage = () => {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(({ data }) => setDashData(data.data))
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-4 gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer" style={{ height: 130, borderRadius: 20 }} />)}
            </div>
            <div className="loading-shimmer" style={{ height: 320, borderRadius: 20 }} />
        </div>
    );

    const stats = dashData?.stats || {};
    const recoveryTrend = (dashData?.recoveryTrend || []).map(d => ({
        date: d._id, pain: Math.round(d.avgPain * 10) / 10, logs: d.totalLogs,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
    }));

    const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Poppins' };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Dashboard Overview</h1>
                <p className="text-sm font-medium text-muted mt-1">Real-time monitoring and analytics of your active patients</p>
            </div>

            {/* Stat Cards */}
            <motion.div variants={container} initial="hidden" animate="show"
                className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {statCards.map(card => (
                    <motion.div key={card.key} variants={item}
                        className="stat-card" style={{ background: card.gradient }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-icon"><card.icon size={28} className="text-white" /></div>
                                <div className="stat-trend"><HiOutlineTrendingUp size={14} /><span>+12%</span></div>
                            </div>
                            <div className="mt-2">
                                <p className="stat-value">{stats[card.key] ?? 0}</p>
                                <p className="stat-label">{card.label}</p>
                            </div>
                        </div>
                        <div className="stat-blur" />
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <motion.div variants={item} initial="hidden" animate="show" className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary">Recovery Analytics</h3>
                            <p className="text-xs text-muted mt-1 font-medium">Pain tracking vs Adherence</p>
                        </div>
                        <span className="badge badge-primary">Last 7 days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={recoveryTrend}>
                            <defs>
                                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" name="Avg Pain" stroke="#ef4444" fill="url(#painGradient)" strokeWidth={2} />
                            <Area type="monotone" dataKey="adherence" name="Adherence %" stroke="#10b981" fill="url(#adherenceGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={item} initial="hidden" animate="show" className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary">Patient Status Distribution</h3>
                            <p className="text-xs text-muted mt-1 font-medium">Overview of current recovery phases</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={(dashData?.statusBreakdown || []).map(s => ({ status: s._id || 'Unknown', count: s.count }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" name="Patients" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Recent Alerts */}
                <motion.div variants={item} initial="hidden" animate="show" className="card flex flex-col">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <div style={{ padding: 8, background: 'rgba(239,68,68,0.1)', borderRadius: 8, display: 'flex' }}>
                                <HiOutlineExclamation style={{ color: '#ef4444' }} size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-primary">Critical Alerts</h3>
                        </div>
                        <Link to="/alerts" className="link-primary text-sm flex items-center gap-1">View All <HiOutlineArrowRight size={16} /></Link>
                    </div>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                        {(dashData?.recentAlerts || []).length === 0 ? (
                            <div className="text-center py-8">
                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>🎉</span>
                                <p className="text-muted font-medium">All clear! No pending critical alerts.</p>
                            </div>
                        ) : dashData.recentAlerts.map(alert => (
                            <div key={alert._id} className="alert-card">
                                <div className={`alert-dot ${alert.severity === 'High' ? 'alert-dot-high' : alert.severity === 'Medium' ? 'alert-dot-medium' : 'alert-dot-low'}`} />
                                <div className="min-w-0" style={{ flex: 1 }}>
                                    <p className="text-sm font-bold truncate text-primary">{alert.patient?.fullName || 'Unknown Patient'}</p>
                                    <p className="text-xs text-muted mt-1 line-clamp-2">{alert.message}</p>
                                </div>
                                <span className={`badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Patients */}
                <motion.div variants={item} initial="hidden" animate="show" className="card flex flex-col">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <div style={{ padding: 8, background: 'rgba(99,102,241,0.1)', borderRadius: 8, display: 'flex' }}>
                                <HiOutlineUsers style={{ color: 'var(--primary)' }} size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-primary">Newly Added Patients</h3>
                        </div>
                        <Link to="/patients" className="link-primary text-sm flex items-center gap-1">View Directory <HiOutlineArrowRight size={16} /></Link>
                    </div>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                        {(dashData?.recentPatients || []).length === 0 ? (
                            <p className="text-center py-8 text-muted font-medium">
                                No patients added yet. <Link to="/patients/add" className="link-primary">Add your first patient</Link>
                            </p>
                        ) : dashData.recentPatients.map(patient => (
                            <Link key={patient._id} to={`/patients/${patient._id}`} className="alert-card" style={{ cursor: 'pointer' }}>
                                <div className="patient-avatar shrink-0">
                                    <span>{patient.fullName?.charAt(0) || '?'}</span>
                                </div>
                                <div className="min-w-0" style={{ flex: 1 }}>
                                    <p className="text-sm font-bold truncate text-primary">{patient.fullName}</p>
                                    <p className="text-xs truncate text-muted font-medium mt-1">{patient.diagnosis || 'No diagnosis recorded'}</p>
                                </div>
                                <span className={`badge ${patient.status === 'Active' ? 'badge-success' : patient.status === 'Critical' ? 'badge-danger' : patient.status === 'Recovered' ? 'badge-info' : 'badge-warning'}`}>{patient.status}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardPage;
