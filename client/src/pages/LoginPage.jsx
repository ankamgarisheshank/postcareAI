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
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back, Doctor!');
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
                    <p className="text-sm mb-8 text-muted font-medium">Sign in to your doctor account to manage patients</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email */}
                        <div className="input-group">
                            <label className="block text-sm font-semibold mb-2 text-secondary">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="input-icon" size={20} />
                                <input {...register('email')} type="email" placeholder="doctor@hospital.com"
                                    className="input-field has-icon h-48" />
                            </div>
                            {errors.email && <p className="form-error"><span className="form-error-dot" /> {errors.email.message}</p>}
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
                            ) : 'Sign In to Dashboard'}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm mt-8 text-muted font-medium">
                        Don't have an account?{' '}
                        <Link to="/register" className="link-primary">Create one now</Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
