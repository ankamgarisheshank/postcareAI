import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDashboardStats } from '../services/patientService';
import {
    HiOutlineUsers, HiOutlineHeart, HiOutlineExclamation,
    HiOutlineCalendar, HiOutlineArrowRight, HiOutlineTrendingUp,
    HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const statCards = [
    { key: 'totalPatients', label: 'Total Patients', icon: HiOutlineUsers, iconStyle: 'accent' },
    { key: 'activeCases', label: 'Active Cases', icon: HiOutlineHeart, iconStyle: 'dark' },
    { key: 'highRiskAlerts', label: 'High Risk Alerts', icon: HiOutlineExclamation, iconStyle: 'danger' },
    { key: 'todaysFollowUps', label: "Today's Follow-ups", icon: HiOutlineCalendar, iconStyle: 'success' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

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
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer" style={{ height: 100, borderRadius: 16 }} />)}
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="loading-shimmer" style={{ height: 340, borderRadius: 16 }} />
                <div className="loading-shimmer" style={{ height: 340, borderRadius: 16 }} />
            </div>
        </div>
    );

    const stats = dashData?.stats || {};
    const recoveryTrend = (dashData?.recoveryTrend || []).map(d => ({
        date: d._id, pain: Math.round(d.avgPain * 10) / 10, logs: d.totalLogs,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
    }));

    const tooltipStyle = {
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 10,
        fontFamily: 'Inter',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    Health Records<br />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        Dashboard
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: 10,
                            background: 'var(--accent)', color: 'var(--black)', fontSize: 18, fontWeight: 900,
                        }}>*</span>
                    </span>
                </h1>
            </div>

            {/* Stat Cards */}
            <motion.div variants={container} initial="hidden" animate="show"
                className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {statCards.map(card => (
                    <motion.div key={card.key} variants={item} className="stat-card">
                        <div className={`stat-icon-box ${card.iconStyle}`}>
                            <card.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-value">{stats[card.key] ?? 0}</p>
                            <p className="stat-label">{card.label}</p>
                        </div>
                        <span className="stat-trend up">
                            <HiOutlineTrendingUp size={13} /> +12%
                        </span>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Analytics Chart */}
                <motion.div variants={item} initial="hidden" animate="show" className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Recovery Analytics</h3>
                            <p className="chart-subtitle">Pain tracking vs Adherence — Last 7 days</p>
                        </div>
                        <span className="badge badge-accent">Weekly</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={recoveryTrend}>
                            <defs>
                                <linearGradient id="painG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#111" stopOpacity={0.08} />
                                    <stop offset="95%" stopColor="#111" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="adhG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#C8FF00" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" name="Avg Pain" stroke="#111" fill="url(#painG)" strokeWidth={2.5} dot={false} />
                            <Area type="monotone" dataKey="adherence" name="Adherence %" stroke="#C8FF00" fill="url(#adhG)" strokeWidth={2.5} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    {/* Chart Legend Chips */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                        {['Tracker', 'MedicalAnalytics', 'FitnessMetrics', 'PatientInsights'].map((l, i) => (
                            <span key={l} style={{
                                padding: '6px 16px', borderRadius: 100,
                                fontSize: 12, fontWeight: 600,
                                background: i === 0 ? 'var(--black)' : 'var(--bg)',
                                color: i === 0 ? '#fff' : 'var(--text-secondary)',
                                border: i === 0 ? 'none' : '1px solid var(--border)',
                                cursor: 'pointer',
                            }}>{l}</span>
                        ))}
                    </div>
                </motion.div>

                {/* Status Distribution */}
                <motion.div variants={item} initial="hidden" animate="show" className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Patient Status</h3>
                            <p className="chart-subtitle">Current recovery phase distribution</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(dashData?.statusBreakdown || []).map(s => ({ status: s._id || 'Unknown', count: s.count }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" name="Patients" fill="#111" radius={[6, 6, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Critical Alerts */}
                <motion.div variants={item} initial="hidden" animate="show" className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between mb-5 pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div style={{ padding: 10, background: 'rgba(239,68,68,0.08)', borderRadius: 12, display: 'flex' }}>
                                <HiOutlineExclamation style={{ color: '#ef4444' }} size={20} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Critical Alerts</h3>
                        </div>
                        <Link to="/alerts" className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                            View All <HiOutlineArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                        {(dashData?.recentAlerts || []).length === 0 ? (
                            <div className="text-center py-8">
                                <HiOutlineCheckCircle size={36} style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
                                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>All clear! No pending alerts.</p>
                            </div>
                        ) : dashData.recentAlerts.map(alert => (
                            <div key={alert._id} className="alert-card">
                                <div className={`alert-dot ${(alert.severity || '').toLowerCase() === 'high' ? 'alert-dot-high' : (alert.severity || '').toLowerCase() === 'medium' ? 'alert-dot-medium' : 'alert-dot-low'}`} />
                                <div className="min-w-0" style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} className="truncate">{alert.patient?.fullName || 'Unknown'}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="line-clamp-2">{alert.message}</p>
                                </div>
                                <span className={`badge ${(alert.severity || '').toLowerCase() === 'high' ? 'badge-danger' : (alert.severity || '').toLowerCase() === 'medium' ? 'badge-warning' : 'badge-info'}`}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Patients */}
                <motion.div variants={item} initial="hidden" animate="show" className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between mb-5 pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div style={{ padding: 10, background: 'var(--accent-bg)', borderRadius: 12, display: 'flex' }}>
                                <HiOutlineUsers style={{ color: '#6d8a00' }} size={20} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Newly Added Patients</h3>
                        </div>
                        <Link to="/patients" className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                            View All <HiOutlineArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                        {(dashData?.recentPatients || []).length === 0 ? (
                            <p className="text-center py-8" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                No patients added yet. <Link to="/patients/add" className="link-primary">Add your first patient</Link>
                            </p>
                        ) : dashData.recentPatients.map(patient => (
                            <Link key={patient._id} to={`/patients/${patient._id}`} className="alert-card" style={{ textDecoration: 'none' }}>
                                <div className="patient-avatar">
                                    {patient.fullName?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0" style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} className="truncate">{patient.fullName}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">{patient.diagnosis || 'No diagnosis'}</p>
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
