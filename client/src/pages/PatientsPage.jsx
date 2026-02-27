import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatients, deletePatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import {
    HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiOutlineEye,
    HiOutlinePencil, HiOutlineFilter,
} from 'react-icons/hi';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchPatients();
    }, [search, statusFilter, pagination.page]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.page, limit: 12 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const { data } = await getPatients(params);
            setPatients(data.data);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete patient "${name}"? This cannot be undone.`)) return;
        try {
            await deletePatient(id);
            toast.success('Patient deleted');
            fetchPatients();
        } catch (error) {
            toast.error('Failed to delete patient');
        }
    };

    const getRiskBadge = (level) => {
        if (level === 'High') return 'badge-danger';
        if (level === 'Medium') return 'badge-warning';
        return 'badge-success';
    };

    const getStatusBadge = (status) => {
        if (status === 'Active') return 'badge-success';
        if (status === 'Critical') return 'badge-danger';
        if (status === 'Recovered') return 'badge-info';
        return 'badge-warning';
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Patients
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Manage your patients ({pagination.total} total)
                    </p>
                </div>
                <Link to="/patients/add">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="btn-3d btn-3d-primary flex items-center gap-2"
                    >
                        <HiOutlinePlus size={18} />
                        Add Patient
                    </motion.button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search patients by name, diagnosis, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-glow pl-11"
                        />
                    </div>
                    <div className="relative">
                        <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-glow pl-11 pr-10 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Critical">Critical</option>
                            <option value="Discharged">Discharged</option>
                            <option value="Recovered">Recovered</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Patient Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 rounded-2xl loading-shimmer" />
                    ))}
                </div>
            ) : patients.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-12 text-center"
                >
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                        <HiOutlineSearch size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No patients found
                    </h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {search || statusFilter ? 'Try adjusting your filters' : 'Add your first patient to get started'}
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {patients.map((patient, index) => (
                        <motion.div
                            key={patient._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-5 flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold">
                                            {patient.fullName?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {patient.fullName}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {patient.age} yrs • {patient.gender}
                                        </p>
                                    </div>
                                </div>
                                <span className={`badge ${getRiskBadge(patient.riskLevel)}`}>
                                    {patient.riskLevel}
                                </span>
                            </div>

                            <div className="space-y-2 flex-1 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span style={{ color: 'var(--text-muted)' }}>Diagnosis</span>
                                    <span className="font-medium truncate ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        {patient.diagnosis || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span style={{ color: 'var(--text-muted)' }}>Surgery</span>
                                    <span className="font-medium truncate ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        {patient.surgeryType || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                    <span className={`badge ${getStatusBadge(patient.status)}`}>
                                        {patient.status}
                                    </span>
                                </div>
                                {/* Recovery progress */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span style={{ color: 'var(--text-muted)' }}>Recovery</span>
                                        <span className="font-medium" style={{ color: 'var(--primary)' }}>
                                            {patient.recoveryScore || 0}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                                        <div
                                            className="h-full rounded-full gradient-primary transition-all duration-500"
                                            style={{ width: `${patient.recoveryScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Link to={`/patients/${patient._id}`} className="flex-1">
                                    <button className="w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                        style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                        <HiOutlineEye size={14} /> View
                                    </button>
                                </Link>
                                <Link to={`/patients/edit/${patient._id}`}>
                                    <button className="py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                        style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                                        <HiOutlinePencil size={14} />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(patient._id, patient.fullName)}
                                    className="py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                >
                                    <HiOutlineTrash size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setPagination((p) => ({ ...p, page }))}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${pagination.page === page ? 'gradient-primary text-white' : ''
                                }`}
                            style={pagination.page !== page ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : {}}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
