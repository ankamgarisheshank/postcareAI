import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
    HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
    HiOutlineUser, HiOutlinePhone, HiOutlineOfficeBuilding,
} from 'react-icons/hi';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    specialization: z.string().optional(),
    phone: z.string().optional(),
    hospital: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const RegisterPage = () => {
    const { register: registerDoctor } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...formData } = data;
            await registerDoctor(formData);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputFields = [
        { name: 'fullName', label: 'Full Name', icon: HiOutlineUser, placeholder: 'Dr. John Doe', required: true },
        { name: 'email', label: 'Email', icon: HiOutlineMail, placeholder: 'doctor@hospital.com', type: 'email', required: true },
        { name: 'specialization', label: 'Specialization', icon: HiOutlineUser, placeholder: 'e.g. Cardiology' },
        { name: 'phone', label: 'Phone', icon: HiOutlinePhone, placeholder: '+91 9876543210' },
        { name: 'hospital', label: 'Hospital', icon: HiOutlineOfficeBuilding, placeholder: 'Hospital Name' },
    ];

    return (
        <div className="auth-bg flex items-center justify-center p-4">
            <Toaster position="top-right" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--primary)]/30 border border-white/10 ring-4 ring-[var(--primary)]/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 blur-xl group-hover:bg-white/30 transition-colors" />
                        <span className="text-white font-black text-3xl relative z-10 drop-shadow-lg">P</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">
                        Create Account
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 inline-block px-4 py-1.5 rounded-full border border-[var(--border)]">
                        Join PostCare AI as a Doctor
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-8 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-2xl rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {inputFields.map((field) => (
                            <div key={field.name} className="input-group">
                                <label className="block text-sm font-semibold mb-1.5 text-[var(--text-secondary)]">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative group">
                                    <field.icon
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                        size={20}
                                    />
                                    <input
                                        {...register(field.name)}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        className="input-glow pl-12 h-11 w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl shadow-sm transition-all text-sm font-medium"
                                    />
                                </div>
                                {errors[field.name] && (
                                    <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-red-500" /> {errors[field.name].message}
                                    </p>
                                )}
                            </div>
                        ))}


                        {/* Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-[var(--text-secondary)]">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Min 6 characters"
                                        className="input-glow pl-11 pr-11 h-11 w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl shadow-sm transition-all text-sm font-medium tracking-wide placeholder:tracking-normal"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                        {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500" /> {errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-[var(--text-secondary)]">
                                    Confirm <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <input
                                        {...register('confirmPassword')}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Repeat password"
                                        className="input-glow pl-11 h-11 w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl shadow-sm transition-all text-sm font-medium tracking-wide placeholder:tracking-normal"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 font-medium text-xs mt-1.5 ml-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500" /> {errors.confirmPassword.message}</p>}
                            </div>
                        </div>

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
                                    Creating account...
                                </span>
                            ) : (
                                'Complete Registration'
                            )}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm mt-6 text-[var(--text-muted)] font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors hover:underline">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;



