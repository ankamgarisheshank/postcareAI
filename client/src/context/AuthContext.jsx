import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('postcareai-token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.data);
        } catch (error) {
            console.error('Profile fetch failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    // Login supports email OR phone + password
    const login = async (identifier, password) => {
        const payload = { password };
        if (identifier.includes('@')) {
            payload.email = identifier;
        } else {
            payload.phone = identifier;
        }
        const { data } = await api.post('/auth/login', payload);
        const { token: newToken, ...userData } = data.data;
        localStorage.setItem('postcareai-token', newToken);
        setToken(newToken);
        setUser(userData);
        return data;
    };

    // Register doctor
    const register = async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        const { token: newToken, ...userData } = data.data;
        localStorage.setItem('postcareai-token', newToken);
        setToken(newToken);
        setUser(userData);
        return data;
    };

    // Register patient
    const registerPatient = async (formData) => {
        const { data } = await api.post('/auth/register/patient', formData);
        const { token: newToken, ...userData } = data.data;
        localStorage.setItem('postcareai-token', newToken);
        setToken(newToken);
        setUser(userData);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('postcareai-token');
        setToken(null);
        setUser(null);
    };

    const isDoctor = user?.role === 'doctor';
    const isPatient = user?.role === 'patient';

    return (
        <AuthContext.Provider value={{
            user,
            doctor: user,          // backward compat alias
            token,
            loading,
            login,
            register,
            registerPatient,
            logout,
            isAuthenticated: !!token,
            isDoctor,
            isPatient,
            role: user?.role,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
