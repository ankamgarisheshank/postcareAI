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
            <div className="glass-card p-6 sm:p-8 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-xl shadow-black/5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--primary)]/10 to-transparent blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-[var(--primary)]/30 border border-white/20">
                            {patient.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                {patient.fullName}
                            </h1>
                            <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">
                                {patient.age} yrs • {patient.gender} • {patient.phone}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${patient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : patient.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : patient.status === 'Recovered' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {patient.status}
                                </span>
                                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${patient.riskLevel === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : patient.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                    {patient.riskLevel} Risk
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Link to={`/patients/edit/${id}`}>
                            <button className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] hover:shadow-sm">
                                <HiOutlinePencil size={18} /> Edit Patient
                            </button>
                        </Link>
                        <button onClick={handleEmergency} className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-md hover:shadow-red-500/20">
                            <HiOutlineExclamation size={18} /> Emergency Alert
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 rounded-2xl w-full sm:w-fit bg-[var(--glass-bg)] border border-[var(--border)] shadow-sm overflow-x-auto custom-scrollbar">
                {tabs.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex-1 sm:flex-none py-2.5 px-6 rounded-xl text-sm font-bold capitalize transition-all duration-300 min-w-max ${activeTab === t ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-md shadow-[var(--primary)]/30 scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 space-y-5 border border-[var(--glass-border)] rounded-3xl">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
                                Medical Information
                            </h3>
                            <div className="space-y-4">
                                {[['Diagnosis', patient.diagnosis], ['Surgery', patient.surgeryType], ['Treatment', patient.treatmentSummary], ['Admission', patient.admissionDate && new Date(patient.admissionDate).toLocaleDateString()], ['Discharge', patient.dischargeDate && new Date(patient.dischargeDate).toLocaleDateString()]].map(([l, v]) => (
                                    <div key={l} className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="text-[var(--text-muted)] font-medium text-sm mb-0.5 sm:mb-0">{l}</span>
                                        <span className="font-bold text-[var(--text-secondary)] text-sm sm:text-right">{v || 'Not Available'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-card p-6 border border-[var(--glass-border)] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--primary)]/5 rounded-full blur-2xl pointer-events-none" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 self-start absolute top-6 left-6">
                                Recovery Score
                            </h3>
                            <div className="flex flex-col items-center justify-center mt-8">
                                <div className="relative w-40 h-40 group cursor-default">
                                    <svg className="w-full h-full -rotate-90 filter drop-shadow-md" viewBox="0 0 36 36">
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" className="stroke-[var(--bg-tertiary)]" strokeWidth="3" />
                                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" className="stroke-[var(--primary)] group-hover:stroke-[var(--accent)] transition-all duration-700" strokeWidth="3" strokeDasharray={`${patient.recoveryScore || 0}, 100`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-[var(--primary)] tracking-tighter drop-shadow-sm group-hover:scale-110 transition-transform">
                                            {patient.recoveryScore || 0}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[var(--text-muted)] font-medium text-sm mt-4 text-center max-w-[200px]">
                                    Calculated autonomously using daily AI health checkups
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 flex-wrap">
                            <label className="btn-3d btn-3d-primary px-5 py-3 text-sm cursor-pointer shadow-lg shadow-[var(--primary)]/20 rounded-xl">
                                <HiOutlineUpload className="inline mr-2" size={18} />{uploading ? 'Analyzing Prescription (AI)...' : 'Upload Prescription (AI OCR)'}
                                <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} className="hidden" />
                            </label>
                            <button onClick={() => setShowMedForm(!showMedForm)} className="px-5 py-3 rounded-xl text-sm font-bold flex items-center transition-all bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] hover:shadow-sm">
                                <HiOutlinePlus className="inline mr-2" size={18} />Add Manually
                            </button>
                        </div>

                        {showMedForm && (
                            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddMedication} className="glass-card p-6 border border-[var(--border)] rounded-2xl overflow-hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[var(--text-muted)]">Medicine Name <span className="text-red-500">*</span></label>
                                        <input value={medForm.medicineName} onChange={e => setMedForm(f => ({ ...f, medicineName: e.target.value }))} placeholder="e.g. Paracetamol" className="input-glow h-11 border-[var(--border)] focus:ring-[var(--primary)]/20" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[var(--text-muted)]">Dosage <span className="text-red-500">*</span></label>
                                        <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" className="input-glow h-11 border-[var(--border)] focus:ring-[var(--primary)]/20" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[var(--text-muted)]">Instruction</label>
                                        <select value={medForm.foodInstruction} onChange={e => setMedForm(f => ({ ...f, foodInstruction: e.target.value }))} className="input-glow h-11 border-[var(--border)] focus:ring-[var(--primary)]/20">
                                            {['Before Food', 'After Food', 'With Food', 'Any Time'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-center">
                                        <label className="text-xs font-semibold text-[var(--text-muted)] mb-2">Schedule</label>
                                        <div className="flex gap-4 items-center flex-wrap">
                                            {['morning', 'afternoon', 'evening'].map(t => (
                                                <label key={t} className="flex items-center gap-2 text-sm font-medium capitalize text-[var(--text-secondary)] cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input type="checkbox" checked={medForm.frequency[t]} onChange={e => setMedForm(f => ({ ...f, frequency: { ...f.frequency, [t]: e.target.checked } }))} className="peer sr-only" />
                                                        <div className="w-5 h-5 rounded border-2 border-[var(--border)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    </div>
                                                    {t}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[var(--text-muted)]">Start Date</label>
                                        <input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))} className="input-glow h-11 border-[var(--border)] focus:ring-[var(--primary)]/20" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-[var(--text-muted)]">End Date</label>
                                        <input type="date" value={medForm.endDate} onChange={e => setMedForm(f => ({ ...f, endDate: e.target.value }))} className="input-glow h-11 border-[var(--border)] focus:ring-[var(--primary)]/20" />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowMedForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">Save Medication</button>
                                </div>
                            </motion.form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {(patient.medications || []).length === 0 ? (
                                <div className="md:col-span-2 text-center py-16 glass-card border border-[var(--border)] rounded-3xl">
                                    <div className="text-5xl mb-4">💊</div>
                                    <p className="text-lg font-bold text-[var(--text-primary)]">No Medications Assigned</p>
                                    <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">Add a prescription or manually create a medication schedule.</p>
                                </div>
                            ) : patient.medications.map((med, index) => (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={med._id} className="relative glass-card p-5 border border-[var(--border)] rounded-2xl flex flex-col justify-between group overflow-hidden bg-[var(--bg-secondary)] hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/20 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-xl shadow-inner">
                                                💊
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-base text-[var(--text-primary)] tracking-tight">{med.medicineName}</h4>
                                                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5">
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]">{med.dosage}</span>
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]">{med.foodInstruction}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-auto">
                                        <div className="flex gap-1.5">
                                            {['morning', 'afternoon', 'evening'].map(time => (
                                                med.frequency?.[time] && (
                                                    <span key={time} className="text-[9px] uppercase font-black px-2 py-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                                                        {time}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                        <button onClick={() => handleDeleteMed(med._id)} className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-red-500 hover:text-white p-2 hover:bg-red-500 rounded-lg shadow-sm border border-transparent hover:border-red-600">
                                            <HiOutlineTrash size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'recovery' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 border border-[var(--glass-border)] rounded-3xl">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Pain Trend Analysis</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={recoveryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                                        labelStyle={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="pain" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--glass-bg)', stroke: 'var(--primary)', strokeWidth: 3 }} activeDot={{ r: 8, fill: 'var(--primary)' }} name="Pain Level" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] px-2">Daily Recovery Logs</h3>
                        <div className="space-y-4">
                            {(patient.recoveryLogs || []).slice(0, 10).map((log, i) => (
                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={log._id} className="glass-card p-5 border border-[var(--border)] rounded-2xl bg-[var(--bg-secondary)] hover:shadow-md transition-shadow">
                                    <div className="flex flex-wrap sm:flex-nowrap justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${log.mood === 'Good' ? 'bg-emerald-500/10 border border-emerald-500/20' : log.mood === 'Critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                                {log.mood === 'Good' ? '😊' : log.mood === 'Critical' ? '😫' : '😐'}
                                            </div>
                                            <div>
                                                <span className="font-bold text-base text-[var(--text-primary)]">{new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded border ${log.mood === 'Good' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : log.mood === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>{log.mood} Mood</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-lg border border-[var(--border)] text-center">
                                                Pain: <span className="text-[var(--primary)] text-sm">{log.painLevel}</span>/10
                                            </span>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${log.medicineAdherence ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {log.medicineAdherence ? '✅ Taken' : '❌ Missed'}
                                            </span>
                                        </div>
                                    </div>
                                    {log.message && <div className="mt-2 bg-[var(--bg-tertiary)]/50 p-3 rounded-xl border border-[var(--border)]/50">
                                        <p className="text-sm font-medium text-[var(--text-secondary)] italic">"{log.message}"</p>
                                    </div>}
                                </motion.div>
                            ))}
                            {(patient.recoveryLogs || []).length === 0 && (
                                <p className="text-center py-8 text-[var(--text-muted)] font-medium bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">No recovery logs recorded yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {(patient.alerts || []).length === 0 ? (
                            <div className="text-center py-16 glass-card border border-[var(--glass-border)] rounded-3xl">
                                <span className="text-6xl filter drop-shadow-lg mb-4 block">🎉</span>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">No Active Alerts</h3>
                                <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Patient is recovering smoothly</p>
                            </div>
                        ) : patient.alerts.map((alert, i) => (
                            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={alert._id} className={`glass-card p-5 border-l-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-[var(--bg-secondary)] relative overflow-hidden group ${alert.severity === 'High' ? 'border-red-500' : alert.severity === 'Medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none opacity-20 ${alert.severity === 'High' ? 'bg-red-500' : alert.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border shadow-inner ${alert.severity === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'}`}>
                                        {alert.severity} Priority
                                    </span>
                                    <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-md border border-[var(--border)]">{new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                                <p className="text-base font-bold text-[var(--text-primary)] mt-3 relative z-10">{alert.message}</p>
                                {alert.resolved ? (
                                    <span className="text-xs font-bold text-emerald-500 mt-4 inline-flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                        ✅ Resolved on {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-amber-500 mt-4 inline-flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
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
