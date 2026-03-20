import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineHome, HiOutlineUsers, HiOutlineUserAdd,
    HiOutlineBell, HiOutlineChartBar, HiOutlineLogout,
    HiOutlineMenu, HiOutlineMap, HiOutlineX,
    HiOutlineHeart, HiOutlineChatAlt2, HiOutlineSearch,
    HiOutlinePhone,
} from 'react-icons/hi';

const doctorLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/patients', label: 'Patients', icon: HiOutlineUsers },
    { path: '/patients/map', label: 'Patient Map', icon: HiOutlineMap },
    { path: '/patients/add', label: 'Add Patient', icon: HiOutlineUserAdd },
    { path: '/alerts', label: 'Alerts', icon: HiOutlineBell },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/messages', label: 'Messages', icon: HiOutlineChatAlt2 },
    { path: '/call-logs', label: 'Call Logs', icon: HiOutlinePhone },
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
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };
    const sidebarLinks = isDoctor ? doctorLinks : patientLinks;
    const displayName = user?.fullName || user?.name || (isDoctor ? 'Doctor' : 'Patient');
    const initials = displayName.charAt(0).toUpperCase();

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="mobile-overlay show"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar — icon only on desktop, full on mobile */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo" onClick={() => navigate(isDoctor ? '/dashboard' : '/my-recovery')}>
                    <span>P</span>
                </div>

                {/* Nav Links */}
                <nav className="sidebar-nav">
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <link.icon size={22} />
                            <span className="link-tooltip">{link.label}</span>
                            <span className="link-label">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="sidebar-bottom">
                    <button onClick={handleLogout} className="sidebar-link" title="Logout">
                        <HiOutlineLogout size={22} />
                        <span className="link-tooltip">Logout</span>
                        <span className="link-label">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="main-content">
                {/* Top Bar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                            <HiOutlineMenu size={22} />
                        </button>
                        <div className="topbar-greeting hide-mobile">
                            <h1>
                                Hi {isDoctor ? (displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`) : displayName},
                            </h1>
                            <p>Welcome to PostCare AI</p>
                        </div>
                        <div className="show-mobile" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                                {isDoctor ? 'PostCare AI' : 'My Recovery'}
                            </h1>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</p>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <div className="hide-mobile" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginRight: 4 }}>
                            {dateStr}
                        </div>
                        <NavLink to="/alerts" className="topbar-btn" title="Alerts">
                            <HiOutlineBell size={20} />
                            <span className="topbar-badge">!</span>
                        </NavLink>
                        <div className="topbar-avatar" title={displayName}>
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Page */}
                <main className="page-content">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
