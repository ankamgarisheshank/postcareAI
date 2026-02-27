import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatients, deletePatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import {
    HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiOutlineEye,
    HiOutlinePencil, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList,
} from 'react-icons/hi';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table' - table shows all data

    useEffect(() => {
        fetchPatients();
    }, [search, statusFilter, pagination.page, viewMode]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.page, limit: viewMode === 'table' ? 25 : 12 };
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        Patient Directory
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
                        Manage and monitor your active patients ({pagination.total} total)
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
            <div className="glass-card p-5 border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg shadow-black/5 rounded-3xl">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search patients by name, diagnosis, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-glow pl-12 h-[50px] w-full bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-2xl shadow-sm transition-all"
                        />
                    </div>
                    <div className="relative group min-w-[200px]">
                        <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-glow pl-12 pr-10 h-[50px] w-full appearance-none cursor-pointer bg-[var(--bg-secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-2xl shadow-sm transition-all font-medium text-[var(--text-primary)]"
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Critical">Critical</option>
                            <option value="Discharged">Discharged</option>
                            <option value="Recovered">Recovered</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2.5 rounded-xl transition-colors ${viewMode === 'table' ? 'gradient-primary text-white' : ''}`}
                            style={viewMode !== 'table' ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
                            title="Table view - all data"
                        >
                            <HiOutlineViewList size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2.5 rounded-xl transition-colors ${viewMode === 'cards' ? 'gradient-primary text-white' : ''}`}
                            style={viewMode !== 'cards' ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
                            title="Card view"
                        >
                            <HiOutlineViewGrid size={20} />
                        </button>
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
            ) : viewMode === 'table' && patients.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card overflow-x-auto"
                >
                    <table className="w-full min-w-[900px]" style={{ color: 'var(--text-primary)' }}>
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Patient</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Age / Gender</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Phone</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Address</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Admission</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Discharge</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Operation</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Surgery</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Diagnosis</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Treatment</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Risk</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Recovery</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient._id} className="table-row border-b" style={{ borderColor: 'var(--border)' }}>
                                    <td className="py-3 px-4">
                                        <Link to={`/patients/${patient._id}`} className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                                            {patient.fullName}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{patient.age} / {patient.gender}</td>
                                    <td className="py-3 px-4 text-sm">{patient.phone || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm max-w-[180px] truncate" title={patient.address}>{patient.address || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm">{patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm">{patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm">{patient.operationDate ? new Date(patient.operationDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm">{patient.surgeryType || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm max-w-[150px] truncate" title={patient.diagnosis}>{patient.diagnosis || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm max-w-[150px] truncate" title={patient.treatmentSummary}>{patient.treatmentSummary || 'N/A'}</td>
                                    <td className="py-3 px-4"><span className={`badge ${getStatusBadge(patient.status)}`}>{patient.status}</span></td>
                                    <td className="py-3 px-4"><span className={`badge ${getRiskBadge(patient.riskLevel)}`}>{patient.riskLevel}</span></td>
                                    <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--primary)' }}>{patient.recoveryScore || 0}%</td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1">
                                            <Link to={`/patients/${patient._id}`}>
                                                <button className="p-1.5 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }} title="View"><HiOutlineEye size={16} /></button>
                                            </Link>
                                            <Link to={`/patients/edit/${patient._id}`}>
                                                <button className="p-1.5 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }} title="Edit"><HiOutlinePencil size={16} /></button>
                                            </Link>
                                            <button onClick={() => handleDelete(patient._id, patient.fullName)} className="p-1.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} title="Delete"><HiOutlineTrash size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            ) : patients.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-16 text-center border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl shadow-lg rounded-3xl"
                >
                    <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-[var(--bg-tertiary)] border-4 border-[var(--bg-secondary)] shadow-inner">
                        <HiOutlineSearch size={40} className="text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">
                        No patients found
                    </h3>
                    <p className="text-[var(--text-muted)] max-w-md mx-auto font-medium">
                        {search || statusFilter ? 'Try adjusting your search criteria or resetting the filters manually.' : 'You have not added any patients yet. Click the "Add Patient" button to get started.'}
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {patients.map((patient, index) => (
                        <motion.div
                            key={patient._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, ease: "easeOut" }}
                            className="glass-card p-6 flex flex-col border border-[var(--border)] bg-[var(--bg-secondary)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-3xl group relative overflow-hidden"
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/40 transition-shadow">
                                        <span className="text-white font-black text-lg">
                                            {patient.fullName?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                            {patient.fullName}
                                        </h3>
                                        <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                                            {patient.age} yrs • {patient.gender}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${patient.riskLevel === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : patient.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                    {patient.riskLevel}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)] font-medium">Diagnosis</span>
                                    <span className="font-bold truncate ml-2 text-[var(--text-secondary)]">
                                        {patient.diagnosis || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)] font-medium">Surgery</span>
                                    <span className="font-bold truncate ml-2 text-[var(--text-secondary)]">
                                        {patient.surgeryType || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-3 border-b border-[var(--border)]">
                                    <span className="text-[var(--text-muted)] font-medium">Status</span>
                                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border ${patient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : patient.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : patient.status === 'Recovered' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                        {patient.status}
                                    </span>
                                </div>
                                {/* Recovery progress */}
                                <div className="pt-1">
                                    <div className="flex justify-between items-end text-sm mb-2">
                                        <span className="text-[var(--text-muted)] font-medium">Recovery Phase</span>
                                        <span className="font-black text-lg text-[var(--primary)] drop-shadow-sm">
                                            {patient.recoveryScore || 0}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden bg-[var(--bg-tertiary)] shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-1000 ease-out"
                                            style={{ width: `${patient.recoveryScore || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-auto">
                                <Link to={`/patients/${patient._id}`} className="flex-1">
                                    <button className="w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--primary)]/30">
                                        <HiOutlineEye size={16} /> Track Patient
                                    </button>
                                </Link>
                                <div className="flex gap-2">
                                    <Link to={`/patients/edit/${patient._id}`}>
                                        <button className="py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center transition-all bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white shadow-sm">
                                            <HiOutlinePencil size={18} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(patient._id, patient.fullName)}
                                        className="py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-sm"
                                    >
                                        <HiOutlineTrash size={18} />
                                    </button>
                                </div>
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
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-all hover:scale-105 ${pagination.page === page ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/30' : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                }`}
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
