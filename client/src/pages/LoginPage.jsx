import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
});

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const identifierValue = watch('identifier', '');
    const isPhone = identifierValue && !identifierValue.includes('@') && /^\d/.test(identifierValue);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Auto-prepend +91 for phone numbers
            let identifier = data.identifier.trim();
            if (!identifier.includes('@') && /^\d/.test(identifier)) {
                identifier = identifier.startsWith('+91') ? identifier : `+91${identifier.replace(/^0+/, '')}`;
            }
            await login(identifier, data.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <Toaster position="top-right" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                style={{ width: '100%', maxWidth: '28rem' }}>

                {/* Logo */}
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }} className="text-center mb-8">
                    <div className="auth-logo">
                        <div className="auth-logo-glow" />
                        <span>P</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">PostCare AI</h1>
                    <p className="auth-subtitle">Autonomous Patient Follow-up Agent</p>
                </motion.div>

                {/* Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="auth-card">
                    <div className="top-accent" />
                    <h2 className="text-2xl font-bold mb-2 text-primary tracking-tight">Welcome Back</h2>
                    <p className="text-sm mb-8 text-muted font-medium">Sign in with your email or phone number</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email or Phone */}
                        <div className="input-group">
                            <label className="block text-sm font-semibold mb-2 text-secondary">Email or Phone</label>
                            {isPhone ? (
                                <div className="phone-prefix-group">
                                    <span className="phone-prefix">+91</span>
                                    <input {...register('identifier')} type="tel" placeholder="9876543210"
                                        className="input-field h-48 phone-input" />
                                </div>
                            ) : (
                                <div className="relative">
                                    <HiOutlineMail className="input-icon" size={20} />
                                    <input {...register('identifier')} type="text" placeholder="doctor@hospital.com or 9876543210"
                                        className="input-field has-icon h-48" />
                                </div>
                            )}
                            {errors.identifier && <p className="form-error"><span className="form-error-dot" /> {errors.identifier.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="input-group">
                            <label className="block text-sm font-semibold mb-2 text-secondary flex justify-between">
                                <span>Password</span>
                                <a href="#" className="text-xs text-c-primary font-medium" style={{ textDecoration: 'none' }}>Forgot?</a>
                            </label>
                            <div className="relative">
                                <HiOutlineLockClosed className="input-icon" size={20} />
                                <input {...register('password')} type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password" placeholder="••••••••"
                                    className="input-field has-icon has-icon-right h-48"
                                    style={{ letterSpacing: showPassword ? 'normal' : '0.1em' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                                </button>
                            </div>
                            {errors.password && <p className="form-error"><span className="form-error-dot" /> {errors.password.message}</p>}
                        </div>

                        {/* Submit */}
                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="btn btn-primary w-full mt-8" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: 12 }}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="spinner spinner-sm spinner-white" />
                                    Authenticating...
                                </span>
                            ) : 'Sign In'}
                        </motion.button>
                    </form>

                    <div className="text-center mt-8 space-y-2">
                        <p className="text-sm text-muted font-medium">
                            Doctor? <Link to="/register" className="link-primary">Register as Doctor</Link>
                        </p>
                        <p className="text-sm text-muted font-medium">
                            Patient? <Link to="/register/patient" className="link-primary">Register as Patient</Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
