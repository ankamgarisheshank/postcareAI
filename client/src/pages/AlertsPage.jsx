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
        try { await resolveAlert(alertId); toast.success('Alert resolved'); fetchAlerts(); }
        catch { toast.error('Failed to resolve'); }
    };

    const severityColor = (s) => { const sv = (s || '').toLowerCase(); return sv === 'high' ? '#ef4444' : sv === 'medium' ? '#f59e0b' : '#A3A3A3'; };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">🚨 Critical Alerts</h1>
                <p className="text-sm font-medium text-muted mt-1">Monitor and resolve patient alerts in real-time</p>
            </div>

            {/* Filter Tabs */}
            <div className="tabs-container" style={{ width: 'fit-content' }}>
                {['unresolved', 'resolved', 'all'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Alert List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="loading-shimmer" style={{ height: 96, borderRadius: 16 }} />)}</div>
            ) : alerts.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="empty-state">
                    <div className="empty-state-icon"><HiOutlineExclamation size={48} style={{ color: 'var(--text-muted)' }} /></div>
                    <h3 className="text-2xl font-bold mb-3 text-primary">No alerts</h3>
                    <p className="text-muted font-medium" style={{ maxWidth: 400, margin: '0 auto' }}>All clear! No {filter} alerts found at the moment.</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <motion.div key={alert._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }} className="card flex gap-5" style={{ padding: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Left color bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, borderRadius: '24px 0 0 24px', backgroundColor: severityColor(alert.severity) }} />

                            <div style={{ flex: 1, paddingLeft: 8 }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`badge ${(alert.severity || '').toLowerCase() === 'high' ? 'badge-danger' : (alert.severity || '').toLowerCase() === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                                        {alert.severity}
                                    </span>
                                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                                        {alert.type || 'symptom'}
                                    </span>
                                </div>
                                <p className="text-base font-bold text-primary">{alert.patient?.fullName || 'Unknown Patient'}</p>
                                <p className="text-sm mt-1 font-medium text-secondary">{alert.message}</p>
                                <p className="text-xs mt-2 font-semibold text-muted flex items-center gap-1">
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
                                    {new Date(alert.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {!alert.resolved && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleResolve(alert._id)}
                                    className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', fontWeight: 700 }}>
                                    <HiOutlineCheck size={18} /> Resolve
                                </motion.button>
                            )}
                            {alert.resolved && (
                                <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
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
