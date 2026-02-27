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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🚨 Alerts</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monitor patient alerts in real-time</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-tertiary)' }}>
                {['unresolved', 'resolved', 'all'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`py-2 px-5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'gradient-primary text-white' : ''}`}
                        style={filter !== f ? { color: 'var(--text-muted)' } : {}}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl loading-shimmer" />)}</div>
            ) : alerts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
                    <HiOutlineExclamation size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No alerts</h3>
                    <p style={{ color: 'var(--text-muted)' }}>All clear! No {filter} alerts found.</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <motion.div
                            key={alert._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            style={{ borderLeft: `4px solid ${severityColor(alert.severity)}` }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                                        {alert.severity}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                        {alert.type || 'symptom'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {alert.patient?.fullName || 'Unknown Patient'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {alert.message}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(alert.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {!alert.resolved && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleResolve(alert._id)}
                                    className="btn-3d btn-3d-success px-4 py-2 text-sm flex items-center gap-1.5"
                                >
                                    <HiOutlineCheck size={16} /> Resolve
                                </motion.button>
                            )}
                            {alert.resolved && (
                                <span className="text-xs text-green-500 font-medium">
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
