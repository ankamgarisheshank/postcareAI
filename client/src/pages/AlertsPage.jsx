import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAlerts, resolveAlert } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineExclamation, HiOutlineBell, HiOutlineCheckCircle } from 'react-icons/hi';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unresolved');

    useEffect(() => { fetchAlerts(); }, [filter]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const { data } = await getAlerts(filter !== 'all' ? filter : undefined);
            setAlerts(data.data || []);
        } catch { toast.error('Failed to load alerts'); }
        finally { setLoading(false); }
    };

    const handleResolve = async (id) => {
        try { await resolveAlert(id); toast.success('Alert resolved'); fetchAlerts(); }
        catch { toast.error('Failed to resolve'); }
    };

    const severityColor = (s) => { const sv = (s || '').toLowerCase(); return sv === 'high' ? '#ef4444' : sv === 'medium' ? '#f59e0b' : '#999'; };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                        Critical Alerts
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Monitor and resolve patient alerts in real-time</p>
                </div>
                <div className="tabs-container">
                    {['unresolved', 'resolved', 'all'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="loading-shimmer" style={{ height: 100, borderRadius: 16 }} />)}
                </div>
            ) : alerts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><HiOutlineCheckCircle size={28} style={{ color: 'var(--success)' }} /></div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No Alerts</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>All clear — no {filter} alerts found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert, i) => (
                        <motion.div key={alert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="card" style={{ borderLeft: `4px solid ${severityColor(alert.severity)}`, padding: 20 }}>
                            <div className="flex justify-between items-start mb-2" style={{ gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <span className={`badge ${(alert.severity || '').toLowerCase() === 'high' ? 'badge-danger' : (alert.severity || '').toLowerCase() === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>{alert.severity}</span>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 8 }}>{alert.patient?.fullName || 'Unknown Patient'}</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{alert.message}</p>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            {!alert.resolved && (
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => handleResolve(alert._id)}
                                    className="btn btn-sm btn-primary btn-pill" style={{ marginTop: 8 }}>
                                    <HiOutlineCheck size={16} /> Resolve
                                </motion.button>
                            )}
                            {alert.resolved && (
                                <span className="badge badge-success" style={{ marginTop: 8, padding: '6px 14px' }}>
                                    <HiOutlineCheckCircle size={14} style={{ marginRight: 4 }} /> Resolved {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleDateString()}
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
