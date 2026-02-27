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
        try {
            const { data } = await getPatient(id);
            setPatient(data.data);
        } catch { toast.error('Patient not found'); navigate('/patients'); }
        finally { setLoading(false); }
    };

    const handlePrescriptionUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('prescription', file);
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

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} /></div>;
    if (!patient) return null;

    const tabs = ['overview', 'medications', 'recovery', 'alerts'];
    const recoveryData = (patient.recoveryLogs || []).slice(0, 14).reverse().map(l => ({
        date: new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        pain: l.painLevel, adherence: l.medicineAdherence ? 100 : 0,
    }));

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-white">
                            {patient.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{patient.fullName}</h1>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{patient.age} yrs • {patient.gender} • {patient.phone}</p>
                            <div className="flex gap-2 mt-1">
                                <span className={`badge ${patient.status === 'Active' ? 'badge-success' : patient.status === 'Critical' ? 'badge-danger' : 'badge-info'}`}>{patient.status}</span>
                                <span className={`badge ${patient.riskLevel === 'High' ? 'badge-danger' : patient.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{patient.riskLevel} Risk</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link to={`/patients/edit/${id}`}><button className="btn-3d px-4 py-2 text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}><HiOutlinePencil className="inline mr-1" size={14} />Edit</button></Link>
                        <button onClick={handleEmergency} className="btn-3d btn-emergency px-4 py-2 text-sm">
                            <HiOutlineExclamation className="inline mr-1" size={14} />Emergency Alert
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl glass-nav" style={{ background: 'rgba(0,0,0,0.2)' }}>
                {tabs.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${activeTab === t ? 'gradient-primary text-white shadow-lg scale-[1.02]' : 'hover:bg-white/5'}`}
                        style={activeTab !== t ? { color: 'var(--text-muted)' } : {}}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Medical Info</h3>
                            {[['Diagnosis', patient.diagnosis], ['Surgery', patient.surgeryType], ['Treatment', patient.treatmentSummary], ['Admission', patient.admissionDate && new Date(patient.admissionDate).toLocaleDateString()], ['Discharge', patient.dischargeDate && new Date(patient.dischargeDate).toLocaleDateString()]].map(([l, v]) => (
                                <div key={l} className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>{l}</span><span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{v || 'N/A'}</span></div>
                            ))}
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recovery Score</h3>
                            <div className="flex items-center justify-center">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${patient.recoveryScore || 0}, 100`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{patient.recoveryScore || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap">
                            <label className="btn-3d btn-3d-primary px-4 py-2 text-sm cursor-pointer">
                                <HiOutlineUpload className="inline mr-1" size={14} />{uploading ? 'Parsing...' : 'Upload Prescription'}
                                <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} className="hidden" />
                            </label>
                            <button onClick={() => setShowMedForm(!showMedForm)} className="btn-3d px-4 py-2 text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <HiOutlinePlus className="inline mr-1" size={14} />Add Manually
                            </button>
                        </div>

                        {showMedForm && (
                            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddMedication} className="glass-card p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input value={medForm.medicineName} onChange={e => setMedForm(f => ({ ...f, medicineName: e.target.value }))} placeholder="Medicine Name" className="input-glow" required />
                                    <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="Dosage (e.g. 500mg)" className="input-glow" required />
                                    <select value={medForm.foodInstruction} onChange={e => setMedForm(f => ({ ...f, foodInstruction: e.target.value }))} className="input-glow">
                                        {['Before Food', 'After Food', 'With Food', 'Any Time'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                    <div className="flex gap-4 items-center">
                                        {['morning', 'afternoon', 'evening'].map(t => (
                                            <label key={t} className="flex items-center gap-1.5 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                                                <input type="checkbox" checked={medForm.frequency[t]} onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, [t]: e.target.checked } }))} className="accent-indigo-500" />{t}
                                            </label>
                                        ))}
                                    </div>
                                    <input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))} className="input-glow" />
                                    <input type="date" value={medForm.endDate} onChange={e => setMedForm(f => ({ ...f, endDate: e.target.value }))} className="input-glow" />
                                </div>
                                <button type="submit" className="btn-3d btn-3d-success mt-4 px-6 py-2 text-sm">Save Medication</button>
                            </motion.form>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(patient.medications || []).length === 0 ? (
                                <div className="sm:col-span-2 text-center py-12 glass-card">
                                    <p style={{ color: 'var(--text-muted)' }}>No medications assigned yet.</p>
                                </div>
                            ) : patient.medications.map(med => (
                                <div key={med._id} className="glass-card p-4 medicine-card flex items-center justify-between group overflow-hidden">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                            <span className="text-xl">💊</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{med.medicineName}</h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5" style={{ color: 'var(--text-secondary)' }}>{med.dosage}</span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5" style={{ color: 'var(--text-muted)' }}>{med.foodInstruction}</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {['morning', 'afternoon', 'evening'].map(time => (
                                                    med.frequency?.[time] && (
                                                        <span key={time} className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            {time}
                                                        </span>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMed(med._id)} className="translate-x-12 group-hover:translate-x-0 transition-transform text-red-400 hover:text-red-500 p-2 bg-red-500/5 rounded-lg">
                                        <HiOutlineTrash size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'recovery' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Pain Trend</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={recoveryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12 }} />
                                    <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Pain Level" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            {(patient.recoveryLogs || []).slice(0, 10).map(log => (
                                <div key={log._id} className="glass-card p-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(log.date).toLocaleDateString()}</span>
                                        <span className={`badge ${log.mood === 'Good' ? 'badge-success' : log.mood === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>{log.mood}</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pain: {log.painLevel}/10 • {log.medicineAdherence ? '✅ Taken' : '❌ Missed'}</p>
                                    {log.message && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>"{log.message}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-3">
                        {(patient.alerts || []).length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No alerts 🎉</p>
                        ) : patient.alerts.map(alert => (
                            <div key={alert._id} className={`glass-card p-4 border-l-4 ${alert.severity === 'High' ? 'border-red-500' : alert.severity === 'Medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
                                <div className="flex justify-between">
                                    <span className={`badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{alert.severity}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(alert.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm mt-2" style={{ color: 'var(--text-primary)' }}>{alert.message}</p>
                                {alert.resolved && <span className="text-xs text-green-500 mt-1 block">✅ Resolved</span>}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PatientDetailPage;
