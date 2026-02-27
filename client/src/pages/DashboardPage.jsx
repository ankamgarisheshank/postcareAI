import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { getDashboardStats } from '../services/patientService';
import {
    HiOutlineUsers, HiOutlineHeart, HiOutlineExclamation,
    HiOutlineCalendar, HiOutlineArrowRight, HiOutlineTrendingUp,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const statCards = [
    {
        key: 'totalPatients',
        label: 'Total Patients',
        icon: HiOutlineUsers,
        gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        glowClass: 'neon-glow',
    },
    {
        key: 'activeCases',
        label: 'Active Cases',
        icon: HiOutlineHeart,
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        glowClass: 'neon-glow-accent',
    },
    {
        key: 'highRiskAlerts',
        label: 'High Risk Alerts',
        icon: HiOutlineExclamation,
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        glowClass: 'neon-glow-danger',
    },
    {
        key: 'todaysFollowUps',
        label: "Today's Follow-ups",
        icon: HiOutlineCalendar,
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        glowClass: 'neon-glow-success',
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const DashboardPage = () => {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const { data } = await getDashboardStats();
            setDashData(data.data);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 rounded-2xl loading-shimmer" />
                    ))}
                </div>
                <div className="h-80 rounded-2xl loading-shimmer" />
            </div>
        );
    }

    const stats = dashData?.stats || {};
    const recoveryTrend = (dashData?.recoveryTrend || []).map((d) => ({
        date: d._id,
        pain: Math.round(d.avgPain * 10) / 10,
        logs: d.totalLogs,
        adherence: d.totalLogs > 0 ? Math.round((d.adherenceCount / d.totalLogs) * 100) : 0,
    }));

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Dashboard
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Overview of your patient management
                </p>
            </div>

            {/* Stat Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
                {statCards.map((card) => (
                    <motion.div
                        key={card.key}
                        variants={item}
                        className={`stat-card ${card.glowClass} cursor-pointer`}
                        style={{ background: card.gradient }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <card.icon size={28} className="text-white/80" />
                                <HiOutlineTrendingUp size={16} className="text-white/60" />
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {stats[card.key] ?? 0}
                            </p>
                            <p className="text-sm text-white/70 mt-1 font-medium">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recovery Analytics */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Recovery Analytics
                        </h3>
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
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    fontFamily: 'Poppins',
                                }}
                            />
                            <Area type="monotone" dataKey="pain" name="Avg Pain" stroke="#ef4444" fill="url(#painGradient)" strokeWidth={2} />
                            <Area type="monotone" dataKey="adherence" name="Adherence %" stroke="#10b981" fill="url(#adherenceGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Status Breakdown */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Patient Status
                        </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={(dashData?.statusBreakdown || []).map((s) => ({
                                status: s._id || 'Unknown',
                                count: s.count,
                            }))}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    fontFamily: 'Poppins',
                                }}
                            />
                            <Bar dataKey="count" name="Patients" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Alerts */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            🚨 Recent Alerts
                        </h3>
                        <Link to="/alerts" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                            View All <HiOutlineArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {(dashData?.recentAlerts || []).length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                No active alerts 🎉
                            </p>
                        ) : (
                            dashData.recentAlerts.map((alert) => (
                                <div
                                    key={alert._id}
                                    className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${alert.severity === 'High' ? 'bg-red-500' : alert.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {alert.patient?.fullName || 'Unknown Patient'}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                            {alert.message}
                                        </p>
                                    </div>
                                    <span className={`badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-info'
                                        }`}>
                                        {alert.severity}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Recent Patients */}
                <motion.div
                    variants={item}
                    initial="hidden"
                    animate="show"
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Recent Patients
                        </h3>
                        <Link to="/patients" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                            View All <HiOutlineArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {(dashData?.recentPatients || []).length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                No patients yet. <Link to="/patients/add" style={{ color: 'var(--primary)' }}>Add one</Link>
                            </p>
                        ) : (
                            dashData.recentPatients.map((patient) => (
                                <Link
                                    key={patient._id}
                                    to={`/patients/${patient._id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl transition-colors table-row block"
                                    style={{ background: 'var(--bg-tertiary)' }}
                                >
                                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm font-semibold">
                                            {patient.fullName?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {patient.fullName}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                            {patient.diagnosis || 'No diagnosis'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${patient.status === 'Active' ? 'badge-success' : patient.status === 'Critical' ? 'badge-danger' :
                                                patient.status === 'Recovered' ? 'badge-info' : 'badge-warning'
                                            }`}>
                                            {patient.status}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardPage;
