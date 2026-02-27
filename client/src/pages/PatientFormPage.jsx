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
        <div className={`space-y-1 ${area ? 'sm:col-span-2' : ''}`}>
            <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                {label} {req && <span className="text-red-500">*</span>}
            </label>
            {opts ? (
                <select {...register(name)} className="input-glow h-12 border-[var(--border)] focus:ring-[var(--primary)]/20 cursor-pointer text-base">
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : area ? (
                <textarea {...register(name)} rows={4} className="input-glow border-[var(--border)] focus:ring-[var(--primary)]/20 resize-none py-3 text-base" placeholder={`Enter ${label.toLowerCase()}...`} />
            ) : (
                <input {...register(name)} type={type} className="input-glow h-12 border-[var(--border)] focus:ring-[var(--primary)]/20 text-base" placeholder={`Enter ${label.toLowerCase()}...`} />
            )}
            {errors[name] && <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500" /> {errors[name].message}</p>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/patients')} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all">
                    ←
                </button>
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {isEdit ? 'Edit Patient Profile' : 'Register New Patient'}
                </h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-xl rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                    <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)] relative z-10 flex items-center gap-2">
                        <span className="text-2xl">👤</span> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 relative z-10">
                        <Field name="fullName" label="Full Name" req />
                        <Field name="age" label="Age" type="number" req />
                        <Field name="gender" label="Gender" opts={['Male', 'Female', 'Other']} req />
                        <Field name="phone" label="Phone (WhatsApp)" req />
                        <Field name="address" label="Address" area />
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 sm:p-8 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-xl rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                    <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)] relative z-10 flex items-center gap-2">
                        <span className="text-2xl">🏥</span> Medical Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 relative z-10">
                        <Field name="admissionDate" label="Admission Date" type="date" />
                        <Field name="dischargeDate" label="Discharge Date" type="date" />
                        <Field name="surgeryType" label="Surgery Type" />
                        <Field name="operationDate" label="Operation Date" type="date" />
                        <Field name="status" label="Status" opts={['Active', 'Discharged', 'Critical', 'Recovered']} />
                        <Field name="riskLevel" label="Risk Level" opts={['Low', 'Medium', 'High']} />
                        <Field name="diagnosis" label="Diagnosis" area />
                        <Field name="treatmentSummary" label="Treatment Summary" area />
                    </div>
                </motion.div>
                <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                    <button type="button" onClick={() => navigate('/patients')} className="px-8 py-3.5 rounded-xl text-[15px] font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all order-2 sm:order-1">
                        Cancel
                    </button>
                    <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[var(--primary)]/30 hover:shadow-[var(--primary)]/50 transition-all disabled:opacity-70 order-1 sm:order-2 flex justify-center items-center gap-2">
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isEdit ? 'Updating Profile...' : 'Adding Patient...'}
                            </>
                        ) : (
                            isEdit ? 'Update Patient Profile' : 'Register Patient'
                        )}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default PatientFormPage;
