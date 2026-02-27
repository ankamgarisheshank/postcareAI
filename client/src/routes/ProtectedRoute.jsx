import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <div className="text-center">
                <div className="spinner mx-auto mb-4" />
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Loading...</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children ?? <Outlet />;
};

export default ProtectedRoute;
