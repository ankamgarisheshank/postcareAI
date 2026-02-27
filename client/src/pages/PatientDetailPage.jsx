import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatient, uploadPrescription, sendEmergency, deletePatient } from '../services/patientService';
import { addMedication, bulkAddMedications, deleteMedication } from '../services/patientService';
import { addRecoveryLog } from '../services/patientService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineUpload, HiOutlinePlus, HiOutlineTrash, HiOutlineExclamation, HiOutlinePencil } from 'react-icons/hi';

const PatientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showMedForm, setShowMedForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [medForm, setMedForm] = useState({
        medicineName: '', dosage: '', foodInstruction: 'After Food',
        frequency: { morning: false, afternoon: false, evening: false },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    useEffect(() => { fetchPatient(); }, [id]);

    const fetchPatient = async () => {
        try { const { data } = await getPatient(id); setPatient(data.data); }
        catch { toast.error('Patient not found'); navigate('/patients'); }
        finally { setLoading(false); }
    };

    const handlePrescriptionUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData(); formData.append('prescription', file);
            const { data } = await uploadPrescription(id, formData);
            toast.success(`Parsed ${data.data.parsedMedications?.length || 0} medications`);
            if (data.data.parsedMedications?.length > 0) {
                await bulkAddMedications({ patientId: id, medications: data.data.parsedMedications });
                toast.success('Medications added!');
            }
            fetchPatient();
        } catch { toast.error('Upload failed'); }
        finally { setUploading(false); }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            await addMedication({ ...medForm, patient: id });
            toast.success('Medication added');
            setShowMedForm(false);
            setMedForm({ medicineName: '', dosage: '', foodInstruction: 'After Food', frequency: { morning: false, afternoon: false, evening: false }, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
            fetchPatient();
        } catch { toast.error('Failed to add medication'); }
    };

    const handleDeleteMed = async (medId) => {
        try { await deleteMedication(medId); toast.success('Deleted'); fetchPatient(); }
        catch { toast.error('Failed'); }
    };

    const handleEmergency = async () => {
        if (!confirm('Send emergency alert?')) return;
        try { await sendEmergency(id, { message: 'Emergency triggered by doctor' }); toast.success('Emergency alert sent!'); fetchPatient(); }
        catch { toast.error('Failed to send emergency'); }
    };

    if (loading) return <div className="flex items-center justify-center" style={{ height: 260 }}><div className="spinner" /></div>;
    if (!patient) return null;

    const tabs = ['overview', 'medications', 'nutrition', 'recovery', 'alerts'];
    const recoveryData = (patient.recoveryLogs || []).slice(0, 14).reverse().map(l => ({
        date: new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        pain: l.painLevel, adherence: l.medicineAdherence ? 100 : 0,
    }));
    const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Poppins' };

    const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'Critical' ? 'badge-danger' : s === 'Recovered' ? 'badge-info' : 'badge-warning';
    const riskBadge = (r) => r === 'High' ? 'badge-danger' : r === 'Medium' ? 'badge-warning' : 'badge-success';
    const moodIcon = (m) => m === 'Good' ? '😊' : m === 'Critical' ? '😫' : '😐';
    const moodBadge = (m) => m === 'Good' ? 'badge-success' : m === 'Critical' ? 'badge-danger' : 'badge-warning';
    const severityBadge = (s) => s === 'High' ? 'badge-danger' : s === 'Medium' ? 'badge-warning' : 'badge-info';
    const severityColor = (s) => s === 'High' ? '#ef4444' : s === 'Medium' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="card" style={{ padding: '24px 32px' }}>
                <div className="card-glow card-glow-primary" />
                <div className="flex gap-6" style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <div className="flex items-center gap-5">
                        <div className="patient-avatar-lg">{patient.fullName?.charAt(0)}</div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-primary">{patient.fullName}</h1>
                            <p className="text-sm font-semibold text-muted mt-1">{patient.age} yrs • {patient.gender} • {patient.phone}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`badge ${statusBadge(patient.status)}`}>{patient.status}</span>
                                <span className={`badge ${riskBadge(patient.riskLevel)}`}>{patient.riskLevel} Risk</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                        <Link to={`/patients/edit/${id}`}>
                            <button className="btn btn-ghost btn-sm"><HiOutlinePencil size={18} /> Edit Patient</button>
                        </Link>
                        <button onClick={handleEmergency} className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <HiOutlineExclamation size={18} /> Emergency Alert
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                {tabs.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>{t}</button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'overview' && (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                        <div className="card space-y-5">
                            <h3 className="text-xl font-bold text-primary pb-2 border-b">Full Medical Information</h3>
                            <div className="space-y-4">
                                {[
                                    ['Phone', patient.phone],
                                    ['Address', patient.address],
                                    ['Diagnosis', patient.diagnosis],
                                    ['Surgery Type', patient.surgeryType],
                                    ['Operation Date', patient.operationDate ? new Date(patient.operationDate).toLocaleDateString() : null],
                                    ['Admission', patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : null],
                                    ['Discharge', patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString() : null],
                                    ['Treatment', patient.treatmentSummary],
                                ].map(([l, v]) => (
                                    <div key={l} className="info-row">
                                        <span className="info-label">{l}</span>
                                        <span className="info-value">{v || 'Not Available'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card flex flex-col items-center justify-center" style={{ minHeight: 320 }}>
                            <h3 className="text-xl font-bold text-primary mb-6" style={{ alignSelf: 'flex-start' }}>Recovery Score</h3>
                            <div style={{ position: 'relative', width: 160, height: 160 }}>
                                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
                                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="var(--primary)" strokeWidth="3"
                                        strokeDasharray={`${patient.recoveryScore || 0}, 100`} strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="text-4xl font-black text-c-primary">{patient.recoveryScore || 0}%</span>
                                </div>
                            </div>
                            <p className="text-muted font-medium text-sm mt-4 text-center" style={{ maxWidth: 200 }}>
                                Calculated autonomously using daily AI health checkups
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="space-y-6">
                        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            <label className="btn btn-primary cursor-pointer" style={{ position: 'relative' }}>
                                <HiOutlineUpload size={18} /> {uploading ? 'Analyzing...' : 'Upload Prescription (AI OCR)'}
                                <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </label>
                            <button onClick={() => setShowMedForm(!showMedForm)} className="btn btn-ghost">
                                <HiOutlinePlus size={18} /> Add Manually
                            </button>
                        </div>

                        {showMedForm && (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAddMedication} className="card">
                                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-1">Medicine Name <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input value={medForm.medicineName} onChange={e => setMedForm(f => ({ ...f, medicineName: e.target.value }))} placeholder="e.g. Paracetamol" className="input-field h-44" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-1">Dosage <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" className="input-field h-44" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-1">Instruction</label>
                                        <select value={medForm.foodInstruction} onChange={e => setMedForm(f => ({ ...f, foodInstruction: e.target.value }))} className="input-field h-44">
                                            {['Before Food', 'After Food', 'With Food', 'Any Time'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-2">Schedule</label>
                                        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
                                            {['morning', 'afternoon', 'evening'].map(t => (
                                                <label key={t} className="flex items-center gap-2 text-sm font-medium text-secondary cursor-pointer" style={{ textTransform: 'capitalize' }}>
                                                    <input type="checkbox" checked={medForm.frequency[t]}
                                                        onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, [t]: e.target.checked } }))}
                                                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                                                    {t}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-1">Start Date</label>
                                        <input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))} className="input-field h-44" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted block mb-1">End Date</label>
                                        <input type="date" value={medForm.endDate} onChange={e => setMedForm(f => ({ ...f, endDate: e.target.value }))} className="input-field h-44" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowMedForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                                    <button type="submit" className="btn btn-success btn-sm">Save Medication</button>
                                </div>
                            </motion.form>
                        )}

                        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                            {(patient.medications || []).length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>💊</div>
                                    <h3 className="text-lg font-bold text-primary">No Medications Assigned</h3>
                                    <p className="text-sm text-muted mt-1 font-medium">Add a prescription or manually create a medication schedule.</p>
                                </div>
                            ) : patient.medications.map((med, index) => (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                    key={med._id} className="patient-card">
                                    <div className="card-top-line" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>💊</div>
                                            <div>
                                                <h4 className="font-extrabold text-base text-primary tracking-tight">{med.medicineName}</h4>
                                                <div className="flex gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
                                                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>{med.dosage}</span>
                                                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{med.foodInstruction}</span>
                                                </div>
                                                <div className="flex gap-1.5 mt-2">
                                                    {['morning', 'afternoon', 'evening'].map(time => (
                                                        med.frequency?.[time] && (
                                                            <span key={time} className="text-[9px] uppercase font-black px-2 py-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                                                                {time}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end" style={{ marginTop: 'auto' }}>
                                        <div className="flex gap-1">
                                            {['morning', 'afternoon', 'evening'].map(time => (
                                                med.frequency?.[time] && <span key={time} className="badge badge-primary" style={{ fontSize: '0.5625rem' }}>{time}</span>
                                            ))}
                                        </div>
                                        <button onClick={() => handleDeleteMed(med._id)} className="btn-icon btn-icon-delete"><HiOutlineTrash size={18} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'nutrition' && (
                    <div className="space-y-4">
                        {!patient.nutritionSchedule ? (
                            <div className="glass-card p-12 text-center border border-[var(--border)] rounded-3xl">
                                <p className="text-[var(--text-muted)] font-medium">No nutrition schedule assigned yet.</p>
                            </div>
                        ) : (
                            <div className="glass-card p-6 space-y-6 border border-[var(--border)] rounded-3xl">
                                {(patient.nutritionSchedule.restrictions?.length > 0 || patient.nutritionSchedule.specialInstructions) && (
                                    <div className="space-y-2">
                                        {patient.nutritionSchedule.restrictions?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Restrictions</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {patient.nutritionSchedule.restrictions.map((r, i) => (
                                                        <span key={i} className="badge badge-warning">{r}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {patient.nutritionSchedule.specialInstructions && (
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1 text-[var(--text-muted)]">Special Instructions</h4>
                                                <p className="text-sm text-[var(--text-secondary)]">{patient.nutritionSchedule.specialInstructions}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner'].map((meal) => {
                                    const items = patient.nutritionSchedule[meal];
                                    if (!items || items.length === 0) return null;
                                    const totalCal = items.reduce((sum, i) => sum + (i.calories || 0), 0);
                                    return (
                                        <div key={meal} className="border rounded-xl p-4 border-[var(--border)]">
                                            <h4 className="font-semibold capitalize mb-3 text-[var(--text-primary)]">{meal.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                            <div className="space-y-2">
                                                {items.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="text-[var(--text-secondary)]">{item.name} {item.quantity && `(${item.quantity})`}</span>
                                                        <span className="text-[var(--text-muted)]">{item.calories || 0} cal</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between text-sm font-medium pt-2 mt-2 border-t border-[var(--border)] text-[var(--primary)]">
                                                    <span>Total</span><span>{totalCal} cal</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'recovery' && (
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-xl font-bold text-primary mb-6">Pain Trend Analysis</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={recoveryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Line type="monotone" dataKey="pain" stroke="var(--primary)" strokeWidth={4}
                                        dot={{ r: 6, fill: 'var(--bg-secondary)', stroke: 'var(--primary)', strokeWidth: 3 }}
                                        activeDot={{ r: 8, fill: 'var(--primary)' }} name="Pain Level" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <h3 className="text-lg font-bold text-primary">Daily Recovery Logs</h3>
                        <div className="space-y-4">
                            {(patient.recoveryLogs || []).slice(0, 10).map((log, i) => (
                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    key={log._id} className="card" style={{ padding: 20 }}>
                                    <div className="flex justify-between gap-4" style={{ flexWrap: 'wrap' }}>
                                        <div className="flex items-center gap-3">
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                                                background: log.mood === 'Good' ? 'rgba(16,185,129,0.1)' : log.mood === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                border: `1px solid ${log.mood === 'Good' ? 'rgba(16,185,129,0.2)' : log.mood === 'Critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`
                                            }}>
                                                {moodIcon(log.mood)}
                                            </div>
                                            <div>
                                                <span className="font-bold text-base text-primary">{new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                <div className="mt-1"><span className={`badge ${moodBadge(log.mood)}`}>{log.mood} Mood</span></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border)', padding: '4px 12px' }}>
                                                Pain: <strong style={{ color: 'var(--primary)' }}>{log.painLevel}</strong>/10
                                            </span>
                                            <span className={`badge ${log.medicineAdherence ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 12px' }}>
                                                {log.medicineAdherence ? '✅ Taken' : '❌ Missed'}
                                            </span>
                                        </div>
                                    </div>
                                    {log.symptoms?.length > 0 && <p className="text-xs text-secondary mb-1">Symptoms: {log.symptoms.join(', ')}</p>}
                                    {log.vitalSigns && (log.vitalSigns.temperature || log.vitalSigns.bloodPressure || log.vitalSigns.heartRate || log.vitalSigns.oxygenLevel) && (
                                        <p className="text-xs text-muted mb-1">
                                            Vitals: {[log.vitalSigns.temperature && `${log.vitalSigns.temperature}°C`, log.vitalSigns.bloodPressure, log.vitalSigns.heartRate && `${log.vitalSigns.heartRate} bpm`, log.vitalSigns.oxygenLevel && `${log.vitalSigns.oxygenLevel}% SpO2`].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                    {log.message && (
                                        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                            <p className="text-sm font-medium text-secondary" style={{ fontStyle: 'italic' }}>"{log.message}"</p>
                                        </div>
                                    )}
                                    {log.notes && <p className="text-xs mt-1 italic text-muted">{log.notes}</p>}
                                </motion.div>
                            ))}
                            {(patient.recoveryLogs || []).length === 0 && (
                                <p className="text-center py-8 text-muted font-medium card">No recovery logs recorded yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {(patient.alerts || []).length === 0 ? (
                            <div className="empty-state">
                                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: 16 }}>🎉</span>
                                <h3 className="text-xl font-bold text-primary">No Active Alerts</h3>
                                <p className="text-sm font-medium text-muted mt-1">Patient is recovering smoothly</p>
                            </div>
                        ) : patient.alerts.map((alert, i) => (
                            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                key={alert._id} className="card" style={{ borderLeft: `4px solid ${severityColor(alert.severity)}`, padding: 20 }}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`badge ${severityBadge(alert.severity)}`}>{alert.severity} Priority</span>
                                    <span className="text-xs font-semibold text-muted">{new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                <p className="text-base font-bold text-primary mt-3">{alert.message}</p>
                                {alert.resolved ? (
                                    <span className="badge badge-success mt-4" style={{ padding: '6px 12px' }}>
                                        ✅ Resolved on {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                ) : (
                                    <span className="badge badge-warning mt-4" style={{ padding: '6px 12px' }}>
                                        ⏳ Pending Resolution
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PatientDetailPage;
