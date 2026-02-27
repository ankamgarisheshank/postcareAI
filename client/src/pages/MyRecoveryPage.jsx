import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineHeart, HiOutlineTrendingUp, HiOutlineCalendar,
    HiOutlineBell, HiOutlineThumbUp, HiOutlineThumbDown,
    HiOutlineMinusCircle, HiOutlineBeaker,
} from 'react-icons/hi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const MyRecoveryPage = () => {
    const { user } = useAuth();
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchMyData(); }, []);
    const fetchMyData = async () => {
        try {
            if (user?.linkedPatientId) {
                const { data } = await api.get(`/patients/${user.linkedPatientId}`);
                setPatientData(data.data);
            } else {
                const { data } = await api.get('/patients', { params: { search: user?.phone, limit: 1 } });
                if (data.data?.length > 0) {
                    const detail = await api.get(`/patients/${data.data[0]._id}`);
                    setPatientData(detail.data.data);
                }
            }
        } catch (err) { console.error('Failed to load patient data:', err); }
        finally { setLoading(false); }
    };

    const tooltipStyle = { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, fontFamily: 'Inter', fontSize: 13 };

    if (loading) return (
        <div className="space-y-5">
            <div className="loading-shimmer" style={{ height: 100, borderRadius: 16 }} />
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer" style={{ height: 100, borderRadius: 16 }} />)}
            </div>
        </div>
    );

    if (!patientData) return (
        <div className="space-y-6">
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>My Recovery</h1>
            <div className="empty-state">
                <div className="empty-state-icon"><HiOutlineHeart size={28} style={{ color: 'var(--text-muted)' }} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No Recovery Data Yet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                    Your doctor has not linked your account yet. Please ask your doctor to add you.
                </p>
            </div>
        </div>
    );

    const recoveryLogs = patientData.recoveryLogs || patientData.dailyLogs || [];
    const medications = patientData.medications || patientData.prescriptions || [];
    const alerts = patientData.alerts || [];
    const latestLog = recoveryLogs[0];

    const recoveryData = recoveryLogs.slice(0, 14).reverse().map(l => ({
        date: new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        pain: l.painLevel,
    }));

    const statCards = [
        { label: 'Recovery Score', value: `${patientData.recoveryScore || 0}%`, icon: HiOutlineTrendingUp, iconStyle: 'accent' },
        { label: 'Latest Pain', value: latestLog ? `${latestLog.painLevel}/10` : 'N/A', icon: HiOutlineHeart, iconStyle: 'danger' },
        { label: 'Active Meds', value: medications.filter(m => m.isActive !== false).length, icon: HiOutlineCalendar, iconStyle: 'success' },
        { label: 'Pending Alerts', value: alerts.filter(a => !a.resolved && !a.isRead).length, icon: HiOutlineBell, iconStyle: 'warning' },
    ];

    const moodIcon = (m) => {
        const mood = (m || '').toLowerCase();
        return mood === 'good' ? <HiOutlineThumbUp /> : mood === 'bad' || mood === 'critical' ? <HiOutlineThumbDown /> : <HiOutlineMinusCircle />;
    };
    const moodBadge = (m) => {
        const mood = (m || '').toLowerCase();
        return mood === 'good' ? 'badge-success' : mood === 'bad' || mood === 'critical' ? 'badge-danger' : 'badge-warning';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>My Recovery</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Hello, {patientData.fullName || patientData.name}. Here's your recovery overview.</p>
            </div>

            {/* Patient Banner */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px 24px' }}>
                <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
                    <div className="patient-avatar-lg">{(patientData.fullName || patientData.name || '?').charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{patientData.fullName || patientData.name}</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{patientData.age} yrs • {patientData.gender} • {patientData.surgeryType || 'N/A'}</p>
                        <div className="flex gap-2 mt-2">
                            <span className={`badge ${patientData.status === 'Active' ? 'badge-success' : patientData.status === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                                {patientData.status || 'Active'}
                            </span>
                            {patientData.riskLevel && <span className={`badge ${patientData.riskLevel === 'High' ? 'badge-danger' : patientData.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{patientData.riskLevel} Risk</span>}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={container} initial="hidden" animate="show"
                className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {statCards.map(card => (
                    <motion.div key={card.label} variants={item} className="stat-card">
                        <div className={`stat-icon-box ${card.iconStyle}`}>
                            <card.icon size={22} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-value" style={{ fontSize: 24 }}>{card.value}</p>
                            <p className="stat-label">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Chart */}
            {recoveryData.length > 0 && (
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Pain Trend</h3>
                            <p className="chart-subtitle">Your pain levels over time</p>
                        </div>
                        <span className="badge badge-accent">Last {recoveryData.length} days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={recoveryData}>
                            <defs>
                                <linearGradient id="painR" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#111" stopOpacity={0.08} />
                                    <stop offset="95%" stopColor="#111" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" name="Pain" stroke="#111" fill="url(#painR)" strokeWidth={2.5} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Two columns */}
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
                {/* Medications */}
                <div className="card">
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>My Medications</h3>
                    <div className="space-y-3" style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {medications.length === 0 ? (
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No medications prescribed yet.</p>
                        ) : medications.map((med) => (
                            <div key={med._id} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d8a00', flexShrink: 0 }}>
                                    <HiOutlineBeaker size={20} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} className="truncate">{med.drugName || med.medicineName}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.dosage} • {med.frequency || 'Daily'}</p>
                                </div>
                                {med.isActive !== false && <span className="badge badge-success">Active</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="card">
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>Recent Check-ins</h3>
                    <div className="space-y-3" style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {recoveryLogs.length === 0 ? (
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No daily logs yet.</p>
                        ) : recoveryLogs.slice(0, 7).map((log) => (
                            <div key={log._id} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                    background: (log.mood || '').toLowerCase() === 'good' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                    color: (log.mood || '').toLowerCase() === 'good' ? 'var(--success)' : 'var(--warning)',
                                }}>
                                    {moodIcon(log.mood)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                                        {new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pain: {log.painLevel}/10 {log.symptoms?.length > 0 && ` • ${log.symptoms.join(', ')}`}</p>
                                </div>
                                <span className={`badge ${moodBadge(log.mood)}`}>{log.mood || 'okay'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="card">
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>My Alerts</h3>
                    <div className="space-y-3">
                        {alerts.slice(0, 5).map((alert) => {
                            const sev = (alert.severity || '').toLowerCase();
                            const sevColor = sev === 'high' ? '#ef4444' : sev === 'medium' ? '#f59e0b' : '#3b82f6';
                            const sevBadge = sev === 'high' ? 'badge-danger' : sev === 'medium' ? 'badge-warning' : 'badge-info';
                            return (
                                <div key={alert._id} className="card card-sm" style={{ borderLeft: `4px solid ${sevColor}` }}>
                                    <div className="flex justify-between items-start">
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{alert.title || alert.message}</p>
                                            {alert.title && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{alert.message}</p>}
                                        </div>
                                        <span className={`badge ${sevBadge}`}>{alert.severity}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                        {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        {alert.resolved && ' • Resolved'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRecoveryPage;
