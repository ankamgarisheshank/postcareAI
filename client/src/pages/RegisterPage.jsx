import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineAcademicCap } from 'react-icons/hi';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    specialization: z.string().optional(),
    hospital: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const RegisterPage = () => {
    const { registerDoctor } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...formData } = data;
            await registerDoctor(formData);
            toast.success('Account created!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally { setIsLoading(false); }
    };

    const inputFields = [
        { name: 'fullName', label: 'Full Name', icon: HiOutlineUser, placeholder: 'Dr. John Smith', required: true },
        { name: 'email', label: 'Email Address', icon: HiOutlineMail, placeholder: 'doctor@hospital.com', required: true, type: 'email' },
        { name: 'phone', label: 'Phone Number', icon: HiOutlinePhone, placeholder: '+91 9876543210', required: true },
        { name: 'specialization', label: 'Specialization', icon: HiOutlineAcademicCap, placeholder: 'Cardiology, Orthopedics...' },
        { name: 'hospital', label: 'Hospital', icon: HiOutlineOfficeBuilding, placeholder: 'City General Hospital' },
    ];

    return (
        <div className="auth-bg">
            <Toaster position="top-right" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 480 }}>

                <div className="text-center mb-8">
                    <div className="auth-logo">
                        <div className="auth-logo-glow" />
                        <span>P</span>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Create Account
                    </h1>
                    <p className="auth-subtitle">Join PostCare AI as a Doctor</p>
                </div>

                <div className="auth-card">
                    <div className="top-accent" />
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {inputFields.map((field) => (
                            <div key={field.name} className="input-group">
                                <label>
                                    {field.label} {field.required && <span className="req">*</span>}
                                </label>
                                <div className="relative">
                                    <field.icon className="input-icon" size={20} />
                                    <input {...register(field.name)} type={field.type || 'text'} placeholder={field.placeholder}
                                        className="input-field has-icon" style={{ height: 46 }} />
                                </div>
                                {errors[field.name] && <p className="form-error"><span className="form-error-dot" /> {errors[field.name].message}</p>}
                            </div>
                        ))}

                        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="input-group">
                                <label>Password <span className="req">*</span></label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="input-icon" size={18} />
                                    <input {...register('password')} type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password" placeholder="Min 6 chars"
                                        className="input-field has-icon has-icon-right" style={{ height: 46 }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="form-error"><span className="form-error-dot" /> {errors.password.message}</p>}
                            </div>
                            <div className="input-group">
                                <label>Confirm <span className="req">*</span></label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="input-icon" size={18} />
                                    <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password" placeholder="Repeat"
                                        className="input-field has-icon" style={{ height: 46 }} />
                                </div>
                                {errors.confirmPassword && <p className="form-error"><span className="form-error-dot" /> {errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            className="btn btn-primary w-full btn-lg" style={{ marginTop: 20 }}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--black)' }} />
                                    Creating...
                                </span>
                            ) : 'Register as Doctor'}
                        </motion.button>
                    </form>

                    <p className="text-center mt-6" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Already have an account? <Link to="/login" className="link-primary">Sign In</Link>
                    </p>
                    <p className="text-center mt-2" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Are you a patient? <Link to="/register/patient" className="link-primary">Register as Patient</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
