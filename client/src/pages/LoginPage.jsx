import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
    const { login } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
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
        <div className="auth-bg flex items-center justify-center p-4">
            <Toaster position="top-right" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    className="text-center mb-8"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[var(--primary)]/30 border border-white/10 ring-4 ring-[var(--primary)]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 blur-xl group-hover:bg-white/30 transition-colors" />
                        <span className="text-white font-black text-4xl relative z-10 drop-shadow-lg">P</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                        PostCare AI
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 inline-block px-4 py-1.5 rounded-full border border-[var(--border)]">
                        Autonomous Patient Follow-up Agent
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-8 sm:p-10 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-2xl rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
                    <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)] tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="text-sm mb-8 text-[var(--text-muted)] font-medium">
                        Sign in to your doctor account to manage patients
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email */}
                        <div className="input-group">
                            <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                                Email Address
                            </label>
                            <div className="relative group">
                                <HiOutlineMail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                    size={20}
                                />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    className="input-glow pl-12 h-12 w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl shadow-sm transition-all text-base"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="input-group">
                            <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)] flex justify-between">
                                <span>Password</span>
                                <a href="#" className="text-xs text-[var(--primary)] hover:underline font-medium">Forgot?</a>
                            </label>
                            <div className="relative group">
                                <HiOutlineLockClosed
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                    size={20}
                                />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="input-glow pl-12 pr-12 h-12 w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl shadow-sm transition-all text-base font-medium tracking-wide placeholder:tracking-normal"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    {showPassword ? (
                                        <HiOutlineEyeOff size={20} />
                                    ) : (
                                        <HiOutlineEye size={20} />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500" /> {errors.password.message}
                                </p>
                            )}
                        </div>


                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[var(--primary)]/30 hover:shadow-[var(--primary)]/50 transition-all disabled:opacity-70 flex justify-center mt-8"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm mt-8 text-[var(--text-muted)] font-medium">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors hover:underline">
                            Create one now
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
