import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    HiOutlineHome, HiOutlineUsers, HiOutlineUserAdd,
    HiOutlineBell, HiOutlineChartBar, HiOutlineLogout,
    HiOutlineMenu, HiOutlineMap, HiOutlineX,
    HiOutlineSun, HiOutlineMoon,
} from 'react-icons/hi';

const sidebarLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/patients', label: 'Patients', icon: HiOutlineUsers },
    { path: '/patients/map', label: 'Patient Map', icon: HiOutlineMap },
    { path: '/patients/add', label: 'Add Patient', icon: HiOutlineUserAdd },
    { path: '/alerts', label: 'Alerts', icon: HiOutlineBell },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
];

const DashboardLayout = () => {
    const { doctor, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex" style={{ minHeight: '100vh' }}>
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="mobile-overlay lg-hide"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`} style={{ zIndex: 50 }}>
                {/* Logo */}
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                        <div className="gradient-primary flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-primary tracking-tight">PostCare</h1>
                            <span className="text-xs font-bold text-c-primary uppercase tracking-wider">AI Agent</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg-hide" style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <HiOutlineX size={22} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }} className="space-y-1">
                    {sidebarLinks.map((link) => (
                        <NavLink key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="space-y-3" style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
                    <button onClick={toggleTheme} className="sidebar-link">
                        {isDark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <div className="doctor-info">
                        <div className="flex items-center gap-3">
                            <div className="doctor-avatar">
                                <span>{doctor?.fullName?.charAt(0) || 'D'}</span>
                            </div>
                            <div className="min-w-0" style={{ flex: 1 }}>
                                <p className="text-sm font-bold truncate text-primary">
                                    {doctor?.fullName?.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor?.fullName || 'Doctor'}`}
                                </p>
                                <p className="text-xs font-medium truncate text-muted">{doctor?.specialization || 'General'}</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="sidebar-link" style={{ color: '#ef4444' }}>
                        <HiOutlineLogout size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col min-w-0" style={{ flex: 1 }}>
                {/* Top Bar */}
                <header className="topbar">
                    <button onClick={() => setSidebarOpen(true)} className="lg-hide"
                        style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <HiOutlineMenu size={24} style={{ color: 'var(--text-primary)' }} />
                    </button>

                    <div className="lg-show">
                        <p className="text-sm font-medium text-muted">
                            Welcome back, <span className="text-primary font-semibold">
                                {doctor?.fullName?.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor?.fullName || ''}`}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <NavLink to="/alerts" className="notification-btn">
                            <HiOutlineBell size={22} style={{ color: 'var(--text-primary)' }} />
                            <span className="notification-dot">!</span>
                        </NavLink>
                    </div>
                </header>

                {/* Page content */}
                <main className="page-content">
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
