import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-lg font-medium text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
