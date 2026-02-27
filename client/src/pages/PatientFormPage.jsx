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
        <div className={area ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {label} {req && <span className="text-red-400">*</span>}
            </label>
            {opts ? (
                <select {...register(name)} className="input-glow cursor-pointer">
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : area ? (
                <textarea {...register(name)} rows={3} className="input-glow resize-none" placeholder={label} />
            ) : (
                <input {...register(name)} type={type} className="input-glow" placeholder={label} />
            )}
            {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name].message}</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {isEdit ? 'Edit Patient' : 'Add New Patient'}
            </h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>👤 Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field name="fullName" label="Full Name" req />
                        <Field name="age" label="Age" type="number" req />
                        <Field name="gender" label="Gender" opts={['Male', 'Female', 'Other']} req />
                        <Field name="phone" label="Phone (WhatsApp)" req />
                        <Field name="address" label="Address" />
                        <Field name="admissionDate" label="Admission Date" type="date" />
                        <Field name="dischargeDate" label="Discharge Date" type="date" />
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>🏥 Medical Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field name="surgeryType" label="Surgery Type" />
                        <Field name="operationDate" label="Operation Date" type="date" />
                        <Field name="diagnosis" label="Diagnosis" />
                        <Field name="treatmentSummary" label="Treatment Summary" area />
                        <Field name="status" label="Status" opts={['Active', 'Discharged', 'Critical', 'Recovered']} />
                        <Field name="riskLevel" label="Risk Level" opts={['Low', 'Medium', 'High']} />
                    </div>
                </motion.div>
                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => navigate('/patients')} className="btn-3d px-6 py-3" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
                    <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-3d btn-3d-primary px-8 py-3 disabled:opacity-60">
                        {isLoading ? 'Saving...' : isEdit ? 'Update Patient' : 'Add Patient'}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default PatientFormPage;
