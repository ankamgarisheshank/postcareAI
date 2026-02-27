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
        <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
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
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border)',
                }}
            >
                {/* Logo */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                PostCare
                            </h1>
                            <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                                AI Agent
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <HiOutlineX size={20} style={{ color: 'var(--text-secondary)' }} />
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
                <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="sidebar-link w-full"
                    >
                        {isDark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* Doctor info */}
                    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                    {doctor?.fullName?.charAt(0) || 'D'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    Dr. {doctor?.fullName || 'Doctor'}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                    {doctor?.specialization || 'General'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-400 hover:text-red-500 hover:bg-red-500/10"
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
                    className="h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30"
                    style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <HiOutlineMenu size={24} style={{ color: 'var(--text-primary)' }} />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Welcome back, <span style={{ color: 'var(--text-primary)' }}>Dr. {doctor?.fullName}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <NavLink
                            to="/alerts"
                            className="relative p-2 rounded-xl transition-colors"
                            style={{ background: 'var(--bg-tertiary)' }}
                        >
                            <HiOutlineBell size={20} style={{ color: 'var(--text-secondary)' }} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
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
