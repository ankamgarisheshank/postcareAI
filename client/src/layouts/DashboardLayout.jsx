import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    HiOutlineHome,
    HiOutlineUsers,
    HiOutlineUserAdd,
    HiOutlineBell,
    HiOutlineChartBar,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineSun,
    HiOutlineMoon,
} from 'react-icons/hi';

const sidebarLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/patients', label: 'Patients', icon: HiOutlineUsers },
    { path: '/patients/add', label: 'Add Patient', icon: HiOutlineUserAdd },
    { path: '/alerts', label: 'Alerts', icon: HiOutlineBell },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
];

const DashboardLayout = () => {
    const { doctor, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } bg-[var(--bg-secondary)] border-r border-[var(--border)] shadow-2xl lg:shadow-none`}
            >
                {/* Logo */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                                PostCare
                            </h1>
                            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                                AI Agent
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <HiOutlineX size={22} className="text-[var(--text-secondary)]" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-5 space-y-3 border-t border-[var(--border)] bg-gradient-to-b from-transparent to-[var(--bg-tertiary)]/30">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="sidebar-link w-full"
                    >
                        {isDark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* Doctor info */}
                    <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                    {doctor?.fullName?.charAt(0) || 'D'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-[var(--text-primary)]">
                                    Dr. {doctor?.fullName || 'Doctor'}
                                </p>
                                <p className="text-xs font-medium truncate text-[var(--text-muted)]">
                                    {doctor?.specialization || 'General'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 font-semibold"
                    >
                        <HiOutlineLogout size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header
                    className="h-[72px] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border)] shadow-sm"
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <HiOutlineMenu size={24} className="text-[var(--text-primary)]" />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-sm font-medium text-[var(--text-muted)]">
                            Welcome back, <span className="text-[var(--text-primary)] font-semibold">Dr. {doctor?.fullName}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <NavLink
                            to="/alerts"
                            className="relative p-2.5 rounded-xl transition-all hover:scale-105 bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-sm hover:shadow-md"
                        >
                            <HiOutlineBell size={22} className="text-[var(--text-primary)]" />
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] flex items-center justify-center font-bold shadow-lg shadow-red-500/40 border-2 border-[var(--bg-secondary)]">
                                !
                            </span>
                        </NavLink>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 overflow-auto bg-mesh-animated">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </main>

            </div>
        </div>
    );
};

export default DashboardLayout;
