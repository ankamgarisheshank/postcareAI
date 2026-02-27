import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlinePhone, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser, HiOutlineMail } from 'react-icons/hi';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const PatientRegisterPage = () => {
    const { registerPatient } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...formData } = data;
            if (!formData.email) delete formData.email;
            await registerPatient(formData);
            toast.success('Account created successfully!');
            navigate('/my-recovery');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally { setIsLoading(false); }
    };

    const inputFields = [
        { name: 'name', label: 'Full Name', icon: HiOutlineUser, placeholder: 'John Doe', required: true },
        { name: 'phone', label: 'Phone Number', icon: HiOutlinePhone, placeholder: '+91 9876543210', required: true },
        { name: 'email', label: 'Email (optional)', icon: HiOutlineMail, placeholder: 'patient@email.com', type: 'email' },
    ];

    return (
        <div className="auth-bg">
            <Toaster position="top-right" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ width: '100%', maxWidth: '28rem' }}>

                {/* Logo */}
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }} className="text-center mb-8">
                    <div className="auth-logo" style={{ width: 64, height: 64 }}>
                        <div className="auth-logo-glow" />
                        <span style={{ fontSize: '1.75rem' }}>P</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-1">Patient Registration</h1>
                    <p className="auth-subtitle">Track your recovery with PostCare AI</p>
                </motion.div>

                {/* Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="auth-card">
                    <div className="top-accent" />
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {inputFields.map((field) => (
                            <div key={field.name} className="input-group">
                                <label className="block text-sm font-semibold mb-1 text-secondary">
                                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>
                                <div className="relative">
                                    <field.icon className="input-icon" size={20} />
                                    <input {...register(field.name)} type={field.type || 'text'} placeholder={field.placeholder}
                                        className="input-field has-icon h-44" />
                                </div>
                                {errors[field.name] && <p className="form-error"><span className="form-error-dot" /> {errors[field.name].message}</p>}
                            </div>
                        ))}

                        {/* Password row */}
                        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-secondary">Password <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="relative input-group">
                                    <HiOutlineLockClosed className="input-icon" size={18} />
                                    <input {...register('password')} type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password" placeholder="Min 4 characters"
                                        className="input-field has-icon h-44" style={{ paddingRight: 40 }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="form-error"><span className="form-error-dot" /> {errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-secondary">Confirm <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className="relative input-group">
                                    <HiOutlineLockClosed className="input-icon" size={18} />
                                    <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password" placeholder="Repeat password"
                                        className="input-field has-icon h-44" />
                                </div>
                                {errors.confirmPassword && <p className="form-error"><span className="form-error-dot" /> {errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="btn btn-primary w-full" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: 12, marginTop: 24 }}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="spinner spinner-sm spinner-white" /> Creating account...
                                </span>
                            ) : 'Register as Patient'}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm mt-6 text-muted font-medium">
                        Already have an account?{' '}<Link to="/login" className="link-primary">Sign In</Link>
                    </p>
                    <p className="text-center text-sm mt-2 text-muted font-medium">
                        Are you a doctor?{' '}<Link to="/register" className="link-primary">Register as Doctor</Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PatientRegisterPage;
