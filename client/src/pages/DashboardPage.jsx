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
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Dashboard Overview
                </h1>
                <p className="text-sm font-medium text-[var(--text-muted)]">
                    Real-time monitoring and analytics of your active patients
                </p>
            </div>

            {/* Stat Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {statCards.map((card) => (
                    <motion.div
                        key={card.key}
                        variants={item}
                        className={`relative overflow-hidden cursor-pointer rounded-2xl shadow-xl shadow-[color-mix(in_srgb,_${card.gradient}_20%,_transparent)] transition-all hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl`}
                        style={{ background: card.gradient }}
                    >
                        <div className="relative z-10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                    <card.icon size={28} className="text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-white/80 bg-black/10 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
                                    <HiOutlineTrendingUp size={14} />
                                    <span>+12%</span>
                                </div>
                            </div>
                            <div className="mt-2 text-white">
                                <p className="text-4xl font-black tabular-nums tracking-tight">
                                    {stats[card.key] ?? 0}
                                </p>
                                <p className="text-sm font-medium text-white/80 mt-1 uppercase tracking-wider">{card.label}</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
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
                    className="glass-card p-6 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg shadow-black/5 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                Recovery Analytics
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">Pain tracking vs Adherence</p>
                        </div>
                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--primary)]/20">Last 7 days</span>
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
                    className="glass-card p-6 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg shadow-black/5 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                Patient Status Distribution
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">Overview of current recovery phases</p>
                        </div>
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
                    className="glass-card p-6 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg shadow-black/5 rounded-3xl flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <HiOutlineExclamation className="text-red-500" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                Critical Alerts
                            </h3>
                        </div>
                        <Link to="/alerts" className="text-sm font-semibold flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                            View All <HiOutlineArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {(dashData?.recentAlerts || []).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-8">
                                <span className="text-4xl mb-3">🎉</span>
                                <p className="text-[var(--text-muted)] font-medium text-center">
                                    All clear! No pending critical alerts.
                                </p>
                            </div>
                        ) : (
                            dashData.recentAlerts.map((alert) => (
                                <div
                                    key={alert._id}
                                    className="flex items-start gap-4 p-4 rounded-2xl transition-all border border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 border-2 border-[var(--bg-secondary)] shadow-sm ${alert.severity === 'High' ? 'bg-red-500 shadow-red-500/50' : alert.severity === 'Medium' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-blue-500 shadow-blue-500/50'
                                        }`} />
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-sm font-bold truncate text-[var(--text-primary)]">
                                            {alert.patient?.fullName || 'Unknown Patient'}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                            {alert.message}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
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
                    className="glass-card p-6 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg shadow-black/5 rounded-3xl flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                                <HiOutlineUsers className="text-[var(--primary)]" size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                Newly Added Patients
                            </h3>
                        </div>
                        <Link to="/patients" className="text-sm font-semibold flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
                            View Directory <HiOutlineArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {(dashData?.recentPatients || []).length === 0 ? (
                            <p className="text-center py-8 text-[var(--text-muted)] font-medium">
                                No patients added yet. <Link to="/patients/add" className="text-[var(--primary)] hover:underline ml-1">Add your first patient</Link>
                            </p>
                        ) : (
                            dashData.recentPatients.map((patient) => (
                                <Link
                                    key={patient._id}
                                    to={`/patients/${patient._id}`}
                                    className="flex items-center gap-4 p-4 rounded-2xl transition-all border border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] hover:shadow-md hover:-translate-y-0.5 group"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:shadow-[var(--primary)]/30 transition-shadow">
                                        <span className="text-white text-base font-bold">
                                            {patient.fullName?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                            {patient.fullName}
                                        </p>
                                        <p className="text-xs truncate text-[var(--text-muted)] font-medium mt-0.5">
                                            {patient.diagnosis || 'No diagnosis recorded'}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${patient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : patient.status === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            patient.status === 'Recovered' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
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
