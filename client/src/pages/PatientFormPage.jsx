import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPatient, updatePatient, getPatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';

const schema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    age: z.coerce.number().min(0).max(150),
    gender: z.enum(['Male', 'Female', 'Other']),
    phone: z.string().min(5, 'Phone is required'),
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
                    admissionDate: p.admissionDate ? new Date(p.admissionDate).toISOString().split('T')[0] : '',
                    dischargeDate: p.dischargeDate ? new Date(p.dischargeDate).toISOString().split('T')[0] : '',
                    operationDate: p.operationDate ? new Date(p.operationDate).toISOString().split('T')[0] : '',
                });
            }).catch(() => { toast.error('Failed to load'); navigate('/patients'); });
        }
    }, [id]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            if (isEdit) { await updatePatient(id, data); toast.success('Updated!'); }
            else { await createPatient(data); toast.success('Patient added!'); }
            navigate('/patients');
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setIsLoading(false); }
    };

    const Field = ({ name, label, type = 'text', opts, req, area }) => (
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
                        <Field name="phone" label="Phone (WhatsApp)" req />
                        <Field name="address" label="Address" area />
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
