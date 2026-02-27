import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAlerts, resolveAlert } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineExclamation } from 'react-icons/hi';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unresolved');

    useEffect(() => { fetchAlerts(); }, [filter]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter === 'unresolved') params.resolved = false;
            else if (filter === 'resolved') params.resolved = true;
            const { data } = await getAlerts(params);
            setAlerts(data.data);
        } catch { toast.error('Failed to load alerts'); }
        finally { setLoading(false); }
    };

    const handleResolve = async (alertId) => {
        try {
            await resolveAlert(alertId);
            toast.success('Alert resolved');
            fetchAlerts();
        } catch { toast.error('Failed to resolve'); }
    };

    const severityColor = (s) => s === 'High' ? '#ef4444' : s === 'Medium' ? '#f59e0b' : '#06b6d4';

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">🚨 Critical Alerts</h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Monitor and resolve patient alerts in real-time</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1.5 rounded-2xl w-fit bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-inner">
                {['unresolved', 'resolved', 'all'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`py-2 px-6 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-md shadow-[var(--primary)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl loading-shimmer" />)}</div>
            ) : alerts.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-16 text-center border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg rounded-3xl">
                    <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-[var(--bg-tertiary)] border-4 border-[var(--bg-secondary)] shadow-inner">
                        <HiOutlineExclamation size={48} className="mx-auto text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">No alerts</h3>
                    <p className="text-[var(--text-muted)] font-medium max-w-md mx-auto">All clear! No {filter} alerts found at the moment.</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <motion.div
                            key={alert._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, ease: "easeOut" }}
                            className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-5 border border-[var(--border)] bg-[var(--bg-secondary)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-3xl relative overflow-hidden group"
                        >
                            <div className="absolute left-0 inset-y-0 w-1.5 transition-all group-hover:w-2" style={{ backgroundColor: severityColor(alert.severity) }} />
                            <div className="flex-1 pl-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'}`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded border border-[var(--border)]">
                                        {alert.type || 'symptom'}
                                    </span>
                                </div>
                                <p className="text-base font-bold text-[var(--text-primary)]">
                                    {alert.patient?.fullName || 'Unknown Patient'}
                                </p>
                                <p className="text-sm mt-1.5 font-medium text-[var(--text-secondary)]">
                                    {alert.message}
                                </p>
                                <p className="text-xs mt-2 font-semibold text-[var(--text-muted)] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                                    {new Date(alert.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {!alert.resolved && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleResolve(alert._id)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
                                >
                                    <HiOutlineCheck size={18} /> Resolve
                                </motion.button>
                            )}
                            {alert.resolved && (
                                <span className="text-sm text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-1 border border-emerald-500/20">
                                    ✅ Resolved {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleDateString()}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertsPage;
