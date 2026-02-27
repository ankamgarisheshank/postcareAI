import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    HiOutlineHome, HiOutlineUsers, HiOutlineUserAdd,
    HiOutlineBell, HiOutlineChartBar, HiOutlineLogout,
    HiOutlineMenu, HiOutlineMap, HiOutlineX,
    HiOutlineSun, HiOutlineMoon, HiOutlineHeart,
    HiOutlineChatAlt2,
} from 'react-icons/hi';

const doctorLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/patients', label: 'Patients', icon: HiOutlineUsers },
    { path: '/patients/map', label: 'Patient Map', icon: HiOutlineMap },
    { path: '/patients/add', label: 'Add Patient', icon: HiOutlineUserAdd },
    { path: '/alerts', label: 'Alerts', icon: HiOutlineBell },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/messages', label: 'Messages', icon: HiOutlineChatAlt2 },
];

const patientLinks = [
    { path: '/my-recovery', label: 'My Recovery', icon: HiOutlineHeart },
    { path: '/messages', label: 'AI Chat', icon: HiOutlineChatAlt2 },
    { path: '/patients/map', label: 'Location Map', icon: HiOutlineMap },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/alerts', label: 'My Alerts', icon: HiOutlineBell },
];

const DashboardLayout = () => {
    const { user, isDoctor, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };
    const sidebarLinks = isDoctor ? doctorLinks : patientLinks;
    const displayName = user?.fullName || user?.name || (isDoctor ? 'Doctor' : 'Patient');

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
                                <span>{displayName.charAt(0)}</span>
                            </div>
                            <div className="min-w-0" style={{ flex: 1 }}>
                                <p className="text-sm font-bold truncate text-primary">
                                    {isDoctor ? (displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`) : displayName}
                                </p>
                                <p className="text-xs font-medium truncate text-muted">
                                    {isDoctor ? (user?.specialization || 'General') : 'Patient'}
                                </p>
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
                                {isDoctor ? (displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`) : displayName}
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
