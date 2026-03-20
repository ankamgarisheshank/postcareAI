import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPatient, updatePatient, getPatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineUser, HiOutlineOfficeBuilding } from 'react-icons/hi';

const schema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    age: z.coerce.number().min(0).max(150).optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    admissionDate: z.string().optional(),
    dischargeDate: z.string().optional(),
    surgeryType: z.string().optional(),
    diagnosis: z.string().optional(),
    riskLevel: z.string().optional(),
    recoveryScore: z.coerce.number().min(0).max(100).optional(),
});

const PatientFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [familyMembers, setFamilyMembers] = useState([]);
    const isEdit = !!id;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

    useEffect(() => {
        if (isEdit) {
            getPatient(id).then(({ data }) => {
                const p = data.data;
                reset({
                    ...p,
                    admissionDate: p.admissionDate ? p.admissionDate.slice(0, 10) : '',
                    dischargeDate: p.dischargeDate ? p.dischargeDate.slice(0, 10) : '',
                });
                if (p.familyMembers?.length) setFamilyMembers(p.familyMembers);
            }).catch(() => toast.error('Failed to load patient'));
        }
    }, [id]);

    const addFamilyMember = () => setFamilyMembers(prev => [...prev, { name: '', relation: '', phone: '' }]);
    const removeFamilyMember = (idx) => setFamilyMembers(prev => prev.filter((_, i) => i !== idx));
    const updateFamilyMember = (idx, field, value) => setFamilyMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));

    const onSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const validFamily = familyMembers.filter(m => m.name && m.phone);
            const payload = { ...formData, familyMembers: validFamily };
            if (isEdit) { await updatePatient(id, payload); toast.success('Patient updated'); }
            else { await createPatient(payload); toast.success('Patient created'); }
            navigate('/patients');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setIsLoading(false); }
    };

    const Field = ({ name, label, type = 'text', req, options }) => (
        <div className="input-group">
            <label>{label} {req && <span className="req">*</span>}</label>
            {options ? (
                <select {...register(name)} className="input-field" style={{ height: 46 }}>
                    <option value="">Select {label}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : (
                <input {...register(name)} type={type} className="input-field" style={{ height: 46 }} />
            )}
            {errors[name] && <p className="form-error"><span className="form-error-dot" /> {errors[name].message}</p>}
        </div>
    );

    return (
        <div className="space-y-6" style={{ maxWidth: 800, margin: '0 auto' }}>
            <Toaster position="top-right" />
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    {isEdit ? 'Edit Patient' : 'Register New Patient'}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {isEdit ? 'Update patient information below' : 'Enter the patient details to register them in the system'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
                    <h3 className="flex items-center gap-2 mb-5" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                        <HiOutlineUser size={20} style={{ color: 'var(--text-muted)' }} /> Basic Information
                    </h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <Field name="fullName" label="Full Name" req />
                        <Field name="age" label="Age" type="number" />
                        <Field name="gender" label="Gender" options={['Male', 'Female', 'Other']} />
                        <Field name="phone" label="Phone" />
                        <Field name="address" label="Address" />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card">
                    <h3 className="flex items-center gap-2 mb-5" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                        <HiOutlineOfficeBuilding size={20} style={{ color: 'var(--text-muted)' }} /> Medical Information
                    </h3>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <Field name="admissionDate" label="Admission Date" type="date" />
                        <Field name="dischargeDate" label="Discharge Date" type="date" />
                        <Field name="surgeryType" label="Surgery Type" />
                        <Field name="diagnosis" label="Diagnosis" />
                        <Field name="riskLevel" label="Risk Level" options={['Low', 'Medium', 'High']} />
                        <div className="input-group">
                            <label>Recovery % (0–100)</label>
                            <input {...register('recoveryScore')} type="number" min="0" max="100" placeholder="e.g. 70"
                                className="input-field" style={{ height: 46 }} />
                            {errors.recoveryScore && <p className="form-error"><span className="form-error-dot" /> {errors.recoveryScore.message}</p>}
                        </div>
                    </div>
                </motion.div>

                {/* Family Members */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="flex items-center gap-2" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                            <HiOutlineUser size={20} style={{ color: 'var(--text-muted)' }} /> Family / Emergency Contacts
                        </h3>
                        <button type="button" onClick={addFamilyMember} className="btn btn-outline btn-sm btn-pill">
                            + Add Member
                        </button>
                    </div>
                    {familyMembers.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                            No family members added. Click "Add Member" to add emergency contacts.
                        </p>
                    ) : familyMembers.map((fm, idx) => (
                        <div key={idx} className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
                            <div className="input-group">
                                <label>Name</label>
                                <input value={fm.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)}
                                    placeholder="Full name" className="input-field" style={{ height: 44 }} />
                            </div>
                            <div className="input-group">
                                <label>Relation</label>
                                <select value={fm.relation} onChange={e => updateFamilyMember(idx, 'relation', e.target.value)}
                                    className="input-field" style={{ height: 44 }}>
                                    <option value="">Select</option>
                                    {['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Phone</label>
                                <input value={fm.phone} onChange={e => updateFamilyMember(idx, 'phone', e.target.value)}
                                    placeholder="+91 9876543210" className="input-field" style={{ height: 44 }} />
                            </div>
                            <button type="button" onClick={() => removeFamilyMember(idx)}
                                style={{ padding: 8, borderRadius: 8, background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', height: 44, display: 'flex', alignItems: 'center' }}>
                                ✕
                            </button>
                        </div>
                    ))}
                </motion.div>

                <div className="flex gap-3">
                    <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        className="btn btn-primary btn-lg btn-pill" style={{ minWidth: 180 }}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="spinner spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--black)' }} />
                                Saving...
                            </span>
                        ) : isEdit ? 'Update Patient' : 'Register Patient'}
                    </motion.button>
                    <button type="button" onClick={() => navigate('/patients')} className="btn btn-outline btn-lg btn-pill">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientFormPage;
