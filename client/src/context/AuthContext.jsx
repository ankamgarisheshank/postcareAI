import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [doctor, setDoctor] = useState(null);
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
            setDoctor(data.data);
        } catch (error) {
            console.error('Profile fetch failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const { token: newToken, ...doctorData } = data.data;
        localStorage.setItem('postcareai-token', newToken);
        setToken(newToken);
        setDoctor(doctorData);
        return data;
    };

    const register = async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        const { token: newToken, ...doctorData } = data.data;
        localStorage.setItem('postcareai-token', newToken);
        setToken(newToken);
        setDoctor(doctorData);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('postcareai-token');
        setToken(null);
        setDoctor(null);
    };

    return (
        <AuthContext.Provider value={{ doctor, token, loading, login, register, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
