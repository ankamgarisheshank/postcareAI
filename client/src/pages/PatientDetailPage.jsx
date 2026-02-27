import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatient, uploadPrescription, sendEmergency, deletePatient, createCallSchedule, getCallSchedules, cancelCallSchedule, testCall } from '../services/patientService';
import { addMedication, bulkAddMedications, deleteMedication } from '../services/patientService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import {
    HiOutlineUpload, HiOutlinePlus, HiOutlineTrash, HiOutlineExclamation,
    HiOutlinePencil, HiOutlineThumbUp, HiOutlineThumbDown, HiOutlineMinusCircle,
    HiOutlineBeaker, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle,
    HiOutlinePhone, HiOutlineCalendar,
} from 'react-icons/hi';

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
    const [schedules, setSchedules] = useState([]);
    const [scheduleForm, setScheduleForm] = useState({
        scheduledAt: '',
        message: '',
    });
    const [scheduling, setScheduling] = useState(false);
    const [testCalling, setTestCalling] = useState(false);

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

    const fetchSchedules = async () => {
        try {
            const { data } = await getCallSchedules({ patientId: id });
            setSchedules(data.data || []);
        } catch { }
    };

    useEffect(() => { if (activeTab === 'schedule') fetchSchedules(); }, [activeTab, id]);

    const handleScheduleCall = async (e) => {
        e.preventDefault();
        if (!scheduleForm.scheduledAt || !scheduleForm.message.trim()) {
            toast.error('Please set date/time and message');
            return;
        }
        setScheduling(true);
        try {
            await createCallSchedule({
                patientId: id,
                scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
                message: scheduleForm.message.trim(),
            });
            toast.success('Call scheduled! VAPI will call the patient at the set time.');
            setScheduleForm({ scheduledAt: '', message: '' });
            fetchSchedules();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to schedule');
        } finally { setScheduling(false); }
    };

    const handleCancelSchedule = async (scheduleId) => {
        if (!confirm('Cancel this scheduled call?')) return;
        try {
            await cancelCallSchedule(scheduleId);
            toast.success('Schedule cancelled');
            fetchSchedules();
        } catch { toast.error('Failed to cancel'); }
    };

    const handleTestCall = async () => {
        if (!patient.phone) { toast.error('Patient has no phone number'); return; }
        setTestCalling(true);
        try {
            const { data } = await testCall(id, 'This is a test call from PostCare AI. Your doctor is verifying the voice assistant works.');
            toast.success(data.message || 'Call initiated!');
        } catch (err) {
            const msg = err.response?.data?.message || 'Test call failed';
            const hint = err.response?.data?.hint;
            toast.error(hint ? `${msg} — ${hint}` : msg, { duration: 6000 });
        } finally { setTestCalling(false); }
    };

    if (loading) return <div className="flex items-center justify-center" style={{ height: 260 }}><div className="spinner" /></div>;
    if (!patient) return null;

    const tabs = ['overview', 'medications', 'nutrition', 'recovery', 'alerts', 'schedule'];
    const recoveryData = (patient.recoveryLogs || []).slice(0, 14).reverse().map(l => ({
        date: new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        pain: l.painLevel, adherence: l.medicineAdherence ? 100 : 0,
    }));
    const tooltipStyle = { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, fontFamily: 'Inter', fontSize: 13 };

    const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'Critical' ? 'badge-danger' : s === 'Recovered' ? 'badge-info' : 'badge-warning';
    const riskBadge = (r) => r === 'High' ? 'badge-danger' : r === 'Medium' ? 'badge-warning' : 'badge-success';
    const moodIcon = (m) => m === 'Good' ? <HiOutlineThumbUp /> : m === 'Critical' ? <HiOutlineThumbDown /> : <HiOutlineMinusCircle />;
    const moodBadge = (m) => m === 'Good' ? 'badge-success' : m === 'Critical' ? 'badge-danger' : 'badge-warning';
    const severityBadge = (s) => { const sv = (s || '').toLowerCase(); return sv === 'high' ? 'badge-danger' : sv === 'medium' ? 'badge-warning' : 'badge-info'; };
    const severityColor = (s) => { const sv = (s || '').toLowerCase(); return sv === 'high' ? '#ef4444' : sv === 'medium' ? '#f59e0b' : '#3b82f6'; };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="card" style={{ padding: '24px 28px' }}>
                <div className="flex gap-5" style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-4">
                        <div className="patient-avatar-lg">{patient.fullName?.charAt(0)}</div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{patient.fullName}</h1>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{patient.age} yrs • {patient.gender} • {patient.phone}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`badge ${statusBadge(patient.status)}`}>{patient.status}</span>
                                <span className={`badge ${riskBadge(patient.riskLevel)}`}>{patient.riskLevel} Risk</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        <Link to={`/patients/edit/${id}`}><button className="btn btn-outline btn-sm"><HiOutlinePencil size={16} /> Edit</button></Link>
                        <button onClick={handleEmergency} className="btn btn-danger btn-sm"><HiOutlineExclamation size={16} /> Emergency</button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                {tabs.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>{t}</button>)}
            </div>

            {/* Tab Content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'overview' && (
                    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                        {/* Medical Info */}
                        <div className="card space-y-4">
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Medical Information</h3>
                            {[
                                ['Phone', patient.phone], ['Address', patient.address],
                                ['Diagnosis', patient.diagnosis], ['Surgery Type', patient.surgeryType],
                                ['Admission', patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : null],
                                ['Discharge', patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString() : null],
                                ['Treatment', patient.treatmentSummary],
                            ].map(([l, v]) => (
                                <div key={l} className="flex justify-between items-start" style={{ gap: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', minWidth: 100 }}>{l}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{v || '—'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Recovery Score */}
                        <div className="card flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', alignSelf: 'flex-start', marginBottom: 24 }}>Recovery Score</h3>
                            <div style={{ position: 'relative', width: 150, height: 150 }}>
                                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="#f0f0f0" strokeWidth="3" />
                                    <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="#C8FF00" strokeWidth="3"
                                        strokeDasharray={`${patient.recoveryScore || 0}, 100`} strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>{patient.recoveryScore || 0}%</span>
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center', maxWidth: 200, fontWeight: 500 }}>
                                Calculated from daily AI health checkups
                            </p>
                        </div>

                        {/* Family / Emergency Contacts */}
                        {patient.familyMembers?.length > 0 && (
                            <div className="card space-y-4" style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Family / Emergency Contacts</h3>
                                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                    {patient.familyMembers.map((fm, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#6d8a00', flexShrink: 0 }}>
                                                {fm.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fm.name}</p>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fm.relation || 'Family'} • {fm.phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="space-y-5">
                        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                            <label className="btn btn-primary btn-pill" style={{ position: 'relative', cursor: 'pointer' }}>
                                <HiOutlineUpload size={18} /> {uploading ? 'Analyzing...' : 'Upload Prescription'}
                                <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </label>
                            <button onClick={() => setShowMedForm(!showMedForm)} className="btn btn-outline btn-pill">
                                <HiOutlinePlus size={18} /> Add Manually
                            </button>
                        </div>

                        {showMedForm && (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAddMedication} className="card">
                                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    <div className="input-group">
                                        <label>Medicine Name <span className="req">*</span></label>
                                        <input value={medForm.medicineName} onChange={e => setMedForm(f => ({ ...f, medicineName: e.target.value }))} placeholder="e.g. Paracetamol" className="input-field" style={{ height: 44 }} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Dosage <span className="req">*</span></label>
                                        <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" className="input-field" style={{ height: 44 }} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Instruction</label>
                                        <select value={medForm.foodInstruction} onChange={e => setMedForm(f => ({ ...f, foodInstruction: e.target.value }))} className="input-field" style={{ height: 44 }}>
                                            {['Before Food', 'After Food', 'With Food', 'Any Time'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Start Date</label>
                                        <input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))} className="input-field" style={{ height: 44 }} />
                                    </div>
                                    <div className="input-group">
                                        <label>End Date</label>
                                        <input type="date" value={medForm.endDate} onChange={e => setMedForm(f => ({ ...f, endDate: e.target.value }))} className="input-field" style={{ height: 44 }} />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={medForm.frequency.morning} onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, morning: e.target.checked } }))} /> Morning
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={medForm.frequency.afternoon} onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, afternoon: e.target.checked } }))} /> Afternoon
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={medForm.frequency.evening} onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, evening: e.target.checked } }))} /> Evening
                                    </label>
                                </div>
                                <div className="flex gap-3 mt-5">
                                    <button type="submit" className="btn btn-primary btn-pill">Save Medication</button>
                                    <button type="button" onClick={() => setShowMedForm(false)} className="btn btn-ghost">Cancel</button>
                                </div>
                            </motion.form>
                        )}

                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {(patient.medications || []).length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                    <div className="empty-state-icon"><HiOutlineBeaker size={28} style={{ color: 'var(--text-muted)' }} /></div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No Medications</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Upload a prescription or add manually</p>
                                </div>
                            ) : patient.medications.map((med, i) => (
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    key={med._id} className="card card-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-3 items-center">
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d8a00' }}>
                                                <HiOutlineBeaker size={22} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{med.drugName || med.medicineName}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="badge badge-neutral">{med.dosage}</span>
                                                    <span className="badge badge-neutral">{med.instructions || med.foodInstruction}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteMed(med._id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)', padding: 6 }}>
                                            <HiOutlineTrash size={16} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {med.scheduleTimes ? med.scheduleTimes.map(t => (
                                            <span key={t} className="badge badge-accent">
                                                {t === 'morning' ? '🌅 Morning' : t === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                                            </span>
                                        )) : (<>
                                            {med.frequency?.morning && <span className="badge badge-accent">Morning</span>}
                                            {med.frequency?.afternoon && <span className="badge badge-accent">Afternoon</span>}
                                            {med.frequency?.evening && <span className="badge badge-accent">Evening</span>}
                                        </>)}
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        {med.startDate && new Date(med.startDate).toLocaleDateString()} → {med.endDate && new Date(med.endDate).toLocaleDateString()}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'nutrition' && (() => {
                    const ns = patient.nutritionSchedule;
                    const mealSlots = [
                        { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
                        { key: 'morningSnack', label: 'Morning Snack', emoji: '🍎' },
                        { key: 'lunch', label: 'Lunch', emoji: '☀️' },
                        { key: 'eveningSnack', label: 'Evening Snack', emoji: '🍪' },
                        { key: 'dinner', label: 'Dinner', emoji: '🌙' },
                    ];
                    const hasMeals = ns && mealSlots.some(s => ns[s.key]?.length > 0);
                    return (
                        <div className="card">
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Nutrition Schedule</h3>
                            {!hasMeals ? (
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No nutrition schedule assigned yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {mealSlots.map(slot => {
                                        const items = ns[slot.key] || [];
                                        if (items.length === 0) return null;
                                        const totalCal = items.reduce((s, it) => s + (it.calories || 0), 0);
                                        return (
                                            <div key={slot.key} className="p-4" style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                                        {slot.emoji}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{slot.label}</p>
                                                    </div>
                                                    {totalCal > 0 && <span className="badge badge-accent" style={{ fontSize: 11 }}>{totalCal} cal</span>}
                                                </div>
                                                <div className="space-y-2">
                                                    {items.map((item, j) => (
                                                        <div key={j} className="flex items-center gap-3" style={{ padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                                                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{item.name}</span>
                                                            {item.quantity && <span className="badge badge-neutral" style={{ fontSize: 11 }}>{item.quantity}</span>}
                                                            {item.calories > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.calories} cal</span>}
                                                            {item.notes && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{item.notes}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {ns.restrictions?.length > 0 && (
                                        <div className="p-3" style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)' }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ Dietary Restrictions</p>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ns.restrictions.join(', ')}</p>
                                        </div>
                                    )}
                                    {ns.specialInstructions && (
                                        <div className="p-3" style={{ background: 'rgba(59,130,246,0.05)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)' }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>📝 Special Instructions</p>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ns.specialInstructions}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {activeTab === 'recovery' && (
                    <div className="space-y-5">
                        {/* Chart */}
                        {recoveryData.length > 0 && (
                            <div className="chart-card">
                                <div className="chart-header">
                                    <div>
                                        <h3 className="chart-title">Recovery Trend</h3>
                                        <p className="chart-subtitle">Pain levels over time</p>
                                    </div>
                                    <span className="badge badge-accent">Last {recoveryData.length} days</span>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={recoveryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Line type="monotone" dataKey="pain" name="Pain" stroke="#111" strokeWidth={2.5} dot={{ r: 4, fill: '#111' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Recovery Logs */}
                        <div className="space-y-3">
                            {(patient.recoveryLogs || []).map((log, i) => (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    key={log._id} className="card card-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: (log.mood || '').toLowerCase() === 'good' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: (log.mood || '').toLowerCase() === 'good' ? 'var(--success)' : 'var(--warning)' }}>
                                                {moodIcon(log.mood)}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                                                    {new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="mt-1"><span className={`badge ${moodBadge(log.mood)}`}>{log.mood} Mood</span></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="badge badge-neutral" style={{ padding: '4px 12px' }}>
                                                Pain: <strong style={{ color: 'var(--text)' }}>{log.painLevel}</strong>/10
                                            </span>
                                            <span className={`badge ${log.medicineAdherence ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 12px' }}>
                                                {log.medicineAdherence ? <><HiOutlineCheckCircle size={13} style={{ marginRight: 3 }} /> Taken</> : <><HiOutlineXCircle size={13} style={{ marginRight: 3 }} /> Missed</>}
                                            </span>
                                        </div>
                                    </div>
                                    {log.symptoms?.length > 0 && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Symptoms: {log.symptoms.join(', ')}</p>}
                                    {log.vitalSigns && (log.vitalSigns.temperature || log.vitalSigns.bloodPressure || log.vitalSigns.heartRate || log.vitalSigns.oxygenLevel) && (
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                            Vitals: {[log.vitalSigns.temperature && `${log.vitalSigns.temperature}°C`, log.vitalSigns.bloodPressure, log.vitalSigns.heartRate && `${log.vitalSigns.heartRate} bpm`, log.vitalSigns.oxygenLevel && `${log.vitalSigns.oxygenLevel}% SpO2`].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                    {log.message && (
                                        <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{log.message}"</p>
                                        </div>
                                    )}
                                    {log.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{log.notes}</p>}
                                </motion.div>
                            ))}
                            {(patient.recoveryLogs || []).length === 0 && (
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '32px 0', textAlign: 'center' }}>No recovery logs recorded yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-5">
                        {!patient.phone && (
                            <div className="card" style={{ borderLeft: '4px solid var(--warning)', background: 'rgba(245,158,11,0.08)' }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>No phone number on file</p>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Add the patient's phone number in Edit to schedule voice calls.</p>
                            </div>
                        )}
                        <div className="card">
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <HiOutlinePhone size={20} style={{ color: 'var(--accent)' }} /> Schedule VAPI Voice Call
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                                Set a time for the AI assistant (Robin) to call <strong>{patient.fullName || patient.name}</strong> at <strong>{patient.phone}</strong>. The message you enter will be spoken by the assistant (e.g. medication reminder).
                            </p>
                            <form onSubmit={handleScheduleCall} className="space-y-4">
                                <div className="input-group">
                                    <label><HiOutlineCalendar size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduleForm.scheduledAt}
                                        onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                        className="input-field"
                                        style={{ height: 46 }}
                                        min={new Date().toISOString().slice(0, 16)}
                                        required
                                        disabled={!patient.phone}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Message (spoken by AI)</label>
                                    <textarea
                                        value={scheduleForm.message}
                                        onChange={e => setScheduleForm(f => ({ ...f, message: e.target.value }))}
                                        placeholder="e.g. Take your diabetes tablet at 8 PM. Remember to have it after dinner."
                                        className="input-field"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                        required
                                        disabled={!patient.phone}
                                    />
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>This becomes {'{{metadata.message}}'} in your VAPI assistant prompt.</p>
                                </div>
                                <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                                    <button type="submit" disabled={scheduling || !patient.phone} className="btn btn-primary btn-pill">
                                        {scheduling ? <><div className="spinner spinner-sm" style={{ marginRight: 8, display: 'inline-block' }} /> Scheduling...</> : <><HiOutlinePhone size={18} /> Schedule Call</>}
                                    </button>
                                    <button type="button" onClick={handleTestCall} disabled={testCalling || !patient.phone} className="btn btn-outline btn-pill">
                                        {testCalling ? <><div className="spinner spinner-sm" style={{ marginRight: 8, display: 'inline-block' }} /> Calling...</> : <>📞 Test Call Now</>}
                                    </button>
                                </div>
                            </form>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Test Call — immediately rings the patient. Use it to verify VAPI is configured correctly.</p>
                        </div>
                        <div className="card">
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>Upcoming & Past Calls</h3>
                            {schedules.length === 0 ? (
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>No scheduled calls yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {schedules.map(s => (
                                        <div key={s._id} className="flex items-center justify-between p-3" style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{new Date(s.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.message}</p>
                                                <span className={`badge ${s.status === 'pending' ? 'badge-warning' : s.status === 'completed' ? 'badge-success' : s.status === 'failed' ? 'badge-danger' : 'badge-neutral'}`} style={{ marginTop: 6 }}>{s.status}</span>
                                                {s.status === 'failed' && s.errorMessage && (
                                                    <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6, fontWeight: 500 }}>Why: {s.errorMessage}</p>
                                                )}
                                            </div>
                                            {s.status === 'pending' && (
                                                <button onClick={() => handleCancelSchedule(s._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', flexShrink: 0 }}>Cancel</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {(patient.alerts || []).length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><HiOutlineCheckCircle size={28} style={{ color: 'var(--success)' }} /></div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No Active Alerts</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Patient is recovering smoothly</p>
                            </div>
                        ) : patient.alerts.map((alert, i) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                key={alert._id} className="card" style={{ borderLeft: `4px solid ${severityColor(alert.severity)}`, padding: 20 }}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`badge ${severityBadge(alert.severity)}`}>{alert.severity} Priority</span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 10 }}>{alert.message}</p>
                                {alert.resolved ? (
                                    <span className="badge badge-success mt-4" style={{ padding: '6px 12px' }}>
                                        <HiOutlineCheckCircle size={14} style={{ marginRight: 4 }} /> Resolved on {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                ) : (
                                    <span className="badge badge-warning mt-4" style={{ padding: '6px 12px' }}>
                                        <HiOutlineClock size={14} style={{ marginRight: 4 }} /> Pending Resolution
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
