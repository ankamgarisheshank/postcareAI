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
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6"
                >
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 neon-glow">
                        <span className="text-white font-bold text-2xl">P</span>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Create Account
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Join PostCare AI as a Doctor
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-8"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {inputFields.map((field) => (
                            <div key={field.name} className="input-group">
                                <label className="block text-sm font-medium mb-1.5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    {field.label} {field.required && <span className="text-red-400">*</span>}
                                </label>
                                <div className="relative group">
                                    <field.icon
                                        className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary"
                                        size={18}
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                    <input
                                        {...register(field.name)}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        className="input-glow pl-11 hover-glow"
                                    />
                                </div>
                                {errors[field.name] && (
                                    <p className="text-red-400 text-xs mt-1">{errors[field.name].message}</p>
                                )}
                            </div>
                        ))}


                        {/* Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        className="input-glow pl-11 pr-11"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {showPassword ? <HiOutlineEyeOff size={18} style={{ color: 'var(--text-muted)' }} /> : <HiOutlineEye size={18} style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    Confirm Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        {...register('confirmPassword')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Repeat password"
                                        className="input-glow pl-11"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-3d btn-3d-primary w-full py-3 text-center disabled:opacity-60 mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </motion.button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
