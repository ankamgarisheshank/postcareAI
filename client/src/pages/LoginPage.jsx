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
    identifier: z.string().min(1, 'Please enter your email or phone number'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
});

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginMode, setLoginMode] = useState('doctor');
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await login(data.identifier, data.password);
            if (loginMode === 'patient') {
                navigate('/my-recovery');
            } else {
                navigate('/dashboard');
            }
            toast.success('Welcome back!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="auth-bg">
            <Toaster position="top-right" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 420 }}>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="auth-logo">
                        <div className="auth-logo-glow" />
                        <span>P</span>
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        PostCare AI
                    </h1>
                    <p className="auth-subtitle">Autonomous Patient Follow-up Agent</p>
                </div>

                {/* Card */}
                <div className="auth-card">
                    <div className="top-accent" />

                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Welcome Back</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to manage your patients</p>

                    {/* Login Mode Toggle */}
                    <div className="tabs-container" style={{ width: '100%', marginBottom: 24 }}>
                        <button className={`tab-btn ${loginMode === 'doctor' ? 'active' : ''}`} style={{ flex: 1 }}
                            onClick={() => setLoginMode('doctor')}>Doctor</button>
                        <button className={`tab-btn ${loginMode === 'patient' ? 'active' : ''}`} style={{ flex: 1 }}
                            onClick={() => setLoginMode('patient')}>Patient</button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="input-group">
                            <label>Email or Phone Number</label>
                            <div className="relative">
                                <HiOutlineMail className="input-icon" size={20} />
                                <input {...register('identifier')} type="text" placeholder="doctor@hospital.com or +91 9876543210"
                                    className="input-field has-icon" style={{ height: 48 }} autoComplete="username" />
                            </div>
                            {errors.identifier && <p className="form-error"><span className="form-error-dot" /> {errors.identifier.message}</p>}
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Password</span>
                                <a href="#" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>Forgot?</a>
                            </label>
                            <div className="relative">
                                <HiOutlineLockClosed className="input-icon" size={20} />
                                <input {...register('password')} type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password" placeholder="••••••••"
                                    className="input-field has-icon has-icon-right" style={{ height: 48, letterSpacing: showPassword ? 'normal' : '0.15em' }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                                </button>
                            </div>
                            {errors.password && <p className="form-error"><span className="form-error-dot" /> {errors.password.message}</p>}
                        </div>

                        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            className="btn btn-primary w-full btn-lg" style={{ marginTop: 24 }}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--black)' }} />
                                    Authenticating...
                                </span>
                            ) : 'Sign In'}
                        </motion.button>
                    </form>

                    <p className="text-center mt-6" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="link-primary">Create one</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
