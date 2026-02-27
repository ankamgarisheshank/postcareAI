import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPatient, updatePatient, getPatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

const schema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    age: z.coerce.number().min(0).max(150),
    gender: z.enum(['Male', 'Female', 'Other']),
    phone: z.string().min(10, 'Phone is required').transform(v => v.startsWith('+91') ? v : `+91${v.replace(/^0+/, '')}`),
    address: z.string().optional(),
    admissionDate: z.string().optional(),
    dischargeDate: z.string().optional(),
    surgeryType: z.string().optional(),
    operationDate: z.string().optional(),
    diagnosis: z.string().optional(),
    treatmentSummary: z.string().optional(),
    recoveryNotes: z.string().optional(),
    status: z.enum(['Active', 'Discharged', 'Critical', 'Recovered']).optional(),
    riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
});

const PatientFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [isLoading, setIsLoading] = useState(false);
    const [familyMembers, setFamilyMembers] = useState([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { gender: 'Male', status: 'Active', riskLevel: 'Low' },
    });

    useEffect(() => {
        if (isEdit) {
            getPatient(id).then(({ data }) => {
                const p = data.data;
                reset({
                    ...p,
                    phone: (p.phone || '').replace(/^\+91/, ''),
                    admissionDate: p.admissionDate ? new Date(p.admissionDate).toISOString().split('T')[0] : '',
                    dischargeDate: p.dischargeDate ? new Date(p.dischargeDate).toISOString().split('T')[0] : '',
                    operationDate: p.operationDate ? new Date(p.operationDate).toISOString().split('T')[0] : '',
                });
                if (p.familyMembers?.length) setFamilyMembers(p.familyMembers.map(f => ({ name: f.name || '', relation: f.relation || '', phone: f.phone || '' })));
            }).catch(() => { toast.error('Failed to load'); navigate('/patients'); });
        }
    }, [id]);

    const addFamilyMember = () => setFamilyMembers(prev => [...prev, { name: '', relation: '', phone: '' }]);
    const removeFamilyMember = (idx) => setFamilyMembers(prev => prev.filter((_, i) => i !== idx));
    const updateFamilyMember = (idx, field, value) => setFamilyMembers(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const validFamily = familyMembers.filter(f => f.name && f.phone);
            const payload = { ...data, familyMembers: validFamily };
            if (isEdit) { await updatePatient(id, payload); toast.success('Updated!'); }
            else { await createPatient(payload); toast.success('Patient added!'); }
            navigate('/patients');
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setIsLoading(false); }
    };

    const Field = ({ name, label, type = 'text', opts, req, area, phone }) => (
        <div style={{ gridColumn: area ? '1 / -1' : undefined }}>
            <label className="block text-sm font-semibold text-secondary" style={{ marginBottom: 6 }}>
                {label} {req && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {opts ? (
                <select {...register(name)} className="input-field h-48" style={{ cursor: 'pointer' }}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : area ? (
                <textarea {...register(name)} rows={4} className="input-field" placeholder={`Enter ${label.toLowerCase()}...`} style={{ resize: 'none' }} />
            ) : phone ? (
                <div className="phone-prefix-group">
                    <span className="phone-prefix">+91</span>
                    <input {...register(name)} type="tel" className="input-field h-48 phone-input" placeholder="9876543210" />
                </div>
            ) : (
                <input {...register(name)} type={type} className="input-field h-48" placeholder={`Enter ${label.toLowerCase()}...`} />
            )}
            {errors[name] && <p className="form-error"><span className="form-error-dot" /> {errors[name].message}</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/patients')} className="btn-icon-back">←</button>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">
                    {isEdit ? 'Edit Patient Profile' : 'Register New Patient'}
                </h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                    <div className="card-glow card-glow-primary" />
                    <h3 className="text-xl font-bold mb-6 text-primary" style={{ position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: '1.25rem', marginRight: 8 }}>👤</span> Basic Information
                    </h3>
                    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', position: 'relative', zIndex: 1 }}>
                        <Field name="fullName" label="Full Name" req />
                        <Field name="age" label="Age" type="number" req />
                        <Field name="gender" label="Gender" opts={['Male', 'Female', 'Other']} req />
                        <Field name="phone" label="Phone (WhatsApp)" req phone />
                        <Field name="address" label="Address" area />
                    </div>
                </motion.div>

                {/* Family / Emergency Contacts */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
                    <div className="card-glow card-glow-primary" />
                    <div className="flex items-center justify-between mb-6" style={{ position: 'relative', zIndex: 1 }}>
                        <h3 className="text-xl font-bold text-primary">
                            <span style={{ fontSize: '1.25rem', marginRight: 8 }}>👨‍👩‍👧</span> Family / Emergency Contacts
                        </h3>
                        <button type="button" onClick={addFamilyMember} className="btn btn-ghost btn-sm">
                            <HiOutlinePlus size={16} /> Add Member
                        </button>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {familyMembers.length === 0 ? (
                            <p className="text-sm text-muted text-center py-4" style={{ fontStyle: 'italic' }}>
                                No family contacts added. Click "Add Member" to add emergency contacts who will be notified if the patient misses medications.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {familyMembers.map((fm, idx) => (
                                    <div key={idx} className="grid gap-4 items-end" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', padding: 12, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted mb-1">Name</label>
                                            <input value={fm.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)} className="input-field h-44" placeholder="e.g. Ramesh Kumar" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted mb-1">Relation</label>
                                            <select value={fm.relation} onChange={e => updateFamilyMember(idx, 'relation', e.target.value)} className="input-field h-44" style={{ cursor: 'pointer' }}>
                                                <option value="">Select...</option>
                                                {['Father', 'Mother', 'Wife', 'Husband', 'Son', 'Daughter', 'Brother', 'Sister', 'Guardian', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-muted mb-1">Phone (WhatsApp)</label>
                                            <div className="phone-prefix-group">
                                                <span className="phone-prefix">+91</span>
                                                <input value={fm.phone.replace(/^\+91/, '')} onChange={e => updateFamilyMember(idx, 'phone', e.target.value.startsWith('+91') ? e.target.value : `+91${e.target.value.replace(/^0+/, '')}`)} type="tel" className="input-field h-44 phone-input" placeholder="9876543210" />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeFamilyMember(idx)} className="btn-icon btn-icon-delete" style={{ marginBottom: 2 }}>
                                            <HiOutlineTrash size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                    <div className="card-glow card-glow-accent" />
                    <h3 className="text-xl font-bold mb-6 text-primary" style={{ position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: '1.25rem', marginRight: 8 }}>🏥</span> Medical Information
                    </h3>
                    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', position: 'relative', zIndex: 1 }}>
                        <Field name="admissionDate" label="Admission Date" type="date" />
                        <Field name="dischargeDate" label="Discharge Date" type="date" />
                        <Field name="surgeryType" label="Surgery Type" />
                        <Field name="operationDate" label="Operation Date" type="date" />
                        <Field name="status" label="Status" opts={['Active', 'Discharged', 'Critical', 'Recovered']} />
                        <Field name="riskLevel" label="Risk Level" opts={['Low', 'Medium', 'High']} />
                        <Field name="diagnosis" label="Diagnosis" area />
                        <Field name="treatmentSummary" label="Treatment Summary" area />
                        <Field name="recoveryNotes" label="Recovery Notes" area />
                    </div>
                </motion.div>

                <div className="flex gap-4 justify-end pt-4" style={{ flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => navigate('/patients')} className="btn btn-ghost">Cancel</button>
                    <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn btn-primary">
                        {isLoading ? (
                            <><div className="spinner spinner-sm spinner-white" /> {isEdit ? 'Updating...' : 'Adding...'}</>
                        ) : isEdit ? 'Update Patient Profile' : 'Register Patient'}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default PatientFormPage;
