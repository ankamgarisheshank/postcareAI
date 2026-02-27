import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineHeart, HiOutlineTrendingUp, HiOutlineCalendar, HiOutlineBell, HiOutlineLocationMarker } from 'react-icons/hi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const MyRecoveryPage = () => {
    const { user } = useAuth();
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyData();
    }, []);

    const fetchMyData = async () => {
        try {
            // For patients linked to a Patient record, fetch their details
            if (user?.linkedPatientId) {
                const { data } = await api.get(`/patients/${user.linkedPatientId}`);
                setPatientData(data.data);
            } else {
                // Try to find patient by phone
                const { data } = await api.get('/patients', { params: { search: user?.phone, limit: 1 } });
                if (data.data?.length > 0) {
                    const detail = await api.get(`/patients/${data.data[0]._id}`);
                    setPatientData(detail.data.data);
                }
            }
        } catch (err) {
            console.error('Failed to load patient data:', err);
        } finally {
            setLoading(false);
        }
    };

    const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Poppins' };

    if (loading) return (
        <div className="space-y-6">
            <div className="loading-shimmer" style={{ height: 120, borderRadius: 20 }} />
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer" style={{ height: 130, borderRadius: 20 }} />)}
            </div>
            <div className="loading-shimmer" style={{ height: 300, borderRadius: 20 }} />
        </div>
    );

    if (!patientData) return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Recovery</h1>
                <p className="text-sm font-medium text-muted mt-1">Welcome, {user?.name || 'Patient'}</p>
            </div>
            <div className="empty-state">
                <div className="empty-state-icon"><HiOutlineHeart size={40} style={{ color: 'var(--text-muted)' }} /></div>
                <h3 className="text-2xl font-bold mb-3 text-primary">No Recovery Data Yet</h3>
                <p className="text-muted font-medium" style={{ maxWidth: 400, margin: '0 auto' }}>
                    Your doctor has not linked your account yet. Please ask your doctor to add you as a patient to start tracking your recovery.
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
        temp: l.temperature || l.vitalSigns?.temperature,
    }));

    const statCards = [
        {
            label: 'Recovery Score',
            value: `${patientData.recoveryScore || 0}%`,
            icon: HiOutlineTrendingUp,
            gradient: 'linear-gradient(135deg, #FFFFFF, #A3A3A3)',
        },
        {
            label: 'Latest Pain',
            value: latestLog ? `${latestLog.painLevel}/10` : 'N/A',
            icon: HiOutlineHeart,
            gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        },
        {
            label: 'Active Medications',
            value: medications.filter(m => m.isActive !== false).length,
            icon: HiOutlineCalendar,
            gradient: 'linear-gradient(135deg, #10b981, #059669)',
        },
        {
            label: 'Pending Alerts',
            value: alerts.filter(a => !a.resolved && !a.isRead).length,
            icon: HiOutlineBell,
            gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        },
    ];

    const moodIcon = (m) => {
        const mood = (m || '').toLowerCase();
        return mood === 'good' ? '😊' : mood === 'bad' || mood === 'critical' ? '😫' : '😐';
    };
    const moodBadge = (m) => {
        const mood = (m || '').toLowerCase();
        return mood === 'good' ? 'badge-success' : mood === 'bad' || mood === 'critical' ? 'badge-danger' : 'badge-warning';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Recovery</h1>
                <p className="text-sm font-medium text-muted mt-1">Hello, {patientData.fullName || patientData.name}. Here's your recovery overview.</p>
            </div>

            {/* Patient Info Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px 28px' }}>
                <div className="flex gap-5 items-center" style={{ flexWrap: 'wrap' }}>
                    <div className="patient-avatar-lg">{(patientData.fullName || patientData.name || '?').charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                        <h2 className="text-xl font-extrabold text-primary">{patientData.fullName || patientData.name}</h2>
                        <p className="text-sm text-muted font-medium mt-1">
                            {patientData.age} yrs &bull; {patientData.gender} &bull; {patientData.surgeryType || 'N/A'}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <span className={`badge ${patientData.status === 'Active' ? 'badge-success' : patientData.status === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                                {patientData.status || patientData.riskStatus || 'Active'}
                            </span>
                            {patientData.riskLevel && (
                                <span className={`badge ${patientData.riskLevel === 'High' ? 'badge-danger' : patientData.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                                    {patientData.riskLevel} Risk
                                </span>
                            )}
                        </div>
                    </div>
                    {patientData.assignedDoctor && (
                        <div className="text-right">
                            <p className="text-xs text-muted font-semibold uppercase tracking-wider">Assigned Doctor</p>
                            <p className="text-sm font-bold text-primary mt-1">{patientData.assignedDoctor}</p>
                            {patientData.doctorPhone && <p className="text-xs text-muted">{patientData.doctorPhone}</p>}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div variants={container} initial="hidden" animate="show"
                className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {statCards.map(card => (
                    <motion.div key={card.label} variants={item} className="stat-card" style={{ background: card.gradient }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-icon"><card.icon size={24} className="text-white" /></div>
                            </div>
                            <div className="mt-2">
                                <p className="stat-value" style={{ fontSize: '1.75rem' }}>{card.value}</p>
                                <p className="stat-label" style={{ fontSize: '0.75rem' }}>{card.label}</p>
                            </div>
                        </div>
                        <div className="stat-blur" />
                    </motion.div>
                ))}
            </motion.div>

            {/* Recovery Chart */}
            {recoveryData.length > 0 && (
                <motion.div variants={item} initial="hidden" animate="show" className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary">Pain Trend</h3>
                            <p className="text-xs text-muted mt-1 font-medium">Your pain levels over time</p>
                        </div>
                        <span className="badge badge-primary">Last {recoveryData.length} days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={recoveryData}>
                            <defs>
                                <linearGradient id="painFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="pain" name="Pain Level" stroke="#ef4444" fill="url(#painFill)" strokeWidth={2.5} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Two-column: Medications + Recent Logs */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                {/* Medications */}
                <motion.div variants={item} initial="hidden" animate="show" className="card flex flex-col">
                    <h3 className="text-xl font-bold text-primary mb-4 pb-3 border-b">My Medications</h3>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                        {medications.length === 0 ? (
                            <p className="text-center py-8 text-muted font-medium">No medications prescribed yet.</p>
                        ) : medications.map((med) => (
                            <div key={med._id} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>💊</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="font-bold text-sm text-primary truncate">{med.drugName || med.medicineName}</p>
                                    <p className="text-xs text-muted">{med.dosage} &bull; {med.frequency || 'Daily'}</p>
                                </div>
                                {med.isActive !== false && <span className="badge badge-success">Active</span>}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Daily Logs */}
                <motion.div variants={item} initial="hidden" animate="show" className="card flex flex-col">
                    <h3 className="text-xl font-bold text-primary mb-4 pb-3 border-b">Recent Check-ins</h3>
                    <div className="space-y-3" style={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                        {recoveryLogs.length === 0 ? (
                            <p className="text-center py-8 text-muted font-medium">No daily logs recorded yet.</p>
                        ) : recoveryLogs.slice(0, 7).map((log) => (
                            <div key={log._id} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                                    background: (log.mood || '').toLowerCase() === 'good' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                }}>
                                    {moodIcon(log.mood)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="font-bold text-sm text-primary">
                                        {new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-muted">Pain: {log.painLevel}/10 {log.symptoms?.length > 0 && ` • ${log.symptoms.join(', ')}`}</p>
                                </div>
                                <span className={`badge ${moodBadge(log.mood)}`}>{log.mood || 'okay'}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <motion.div variants={item} initial="hidden" animate="show" className="card">
                    <h3 className="text-xl font-bold text-primary mb-4 pb-3 border-b">My Alerts</h3>
                    <div className="space-y-3">
                        {alerts.slice(0, 5).map((alert) => {
                            const sev = (alert.severity || '').toLowerCase();
                            const sevColor = sev === 'high' ? '#ef4444' : sev === 'medium' ? '#f59e0b' : '#3b82f6';
                            const sevBadge = sev === 'high' ? 'badge-danger' : sev === 'medium' ? 'badge-warning' : 'badge-info';
                            return (
                                <div key={alert._id} className="card" style={{ borderLeft: `4px solid ${sevColor}`, padding: 16 }}>
                                    <div className="flex justify-between items-start">
                                        <div style={{ flex: 1 }}>
                                            <p className="font-bold text-sm text-primary">{alert.title || alert.message}</p>
                                            {alert.title && <p className="text-xs text-muted mt-1">{alert.message}</p>}
                                        </div>
                                        <span className={`badge ${sevBadge}`}>{alert.severity}</span>
                                    </div>
                                    <p className="text-xs text-muted mt-2">
                                        {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        {alert.resolved && ' • Resolved'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default MyRecoveryPage;
