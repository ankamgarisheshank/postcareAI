import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatients, deletePatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiOutlineEye, HiOutlinePencil, HiOutlineFilter } from 'react-icons/hi';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => { fetchPatients(); }, [search, statusFilter, pagination.page]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.page, limit: 12 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const { data } = await getPatients(params);
            setPatients(data.data);
            setPagination(data.pagination);
        } catch { toast.error('Failed to load patients'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete patient "${name}"? This cannot be undone.`)) return;
        try { await deletePatient(id); toast.success('Patient deleted'); fetchPatients(); }
        catch { toast.error('Failed to delete patient'); }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight">Patient Directory</h1>
                    <p className="text-sm font-medium text-muted mt-1">
                        Manage and monitor your active patients ({pagination.total} total)
                    </p>
                </div>
                <Link to="/patients/add">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="btn btn-primary flex items-center gap-2">
                        <HiOutlinePlus size={18} /> Add Patient
                    </motion.button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="card" style={{ padding: 20 }}>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <HiOutlineSearch className="search-icon" size={20} />
                        <input type="text" placeholder="Search patients by name, diagnosis, phone..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-select">
                        <HiOutlineFilter className="filter-icon" size={20} />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Critical">Critical</option>
                            <option value="Discharged">Discharged</option>
                            <option value="Recovered">Recovered</option>
                        </select>
                        <div className="chevron">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Grid */}
            {loading ? (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="loading-shimmer" style={{ height: 200, borderRadius: 20 }} />)}
                </div>
            ) : patients.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="empty-state">
                    <div className="empty-state-icon"><HiOutlineSearch size={40} style={{ color: 'var(--text-muted)' }} /></div>
                    <h3 className="text-2xl font-bold mb-3 text-primary">No patients found</h3>
                    <p className="text-muted font-medium" style={{ maxWidth: 400, margin: '0 auto' }}>
                        {search || statusFilter ? 'Try adjusting your search criteria or resetting the filters manually.' : 'You have not added any patients yet. Click "Add Patient" to get started.'}
                    </p>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {patients.map((patient, index) => (
                        <motion.div key={patient._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }} className="patient-card">
                            <div className="card-top-line" />

                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="patient-avatar"><span>{patient.fullName?.charAt(0)}</span></div>
                                    <div>
                                        <h3 className="font-bold text-base text-primary">{patient.fullName}</h3>
                                        <p className="text-xs font-semibold text-muted" style={{ marginTop: 2 }}>{patient.age} yrs • {patient.gender}</p>
                                    </div>
                                </div>
                                <span className={`badge ${patient.riskLevel === 'High' ? 'badge-danger' : patient.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                                    {patient.riskLevel}
                                </span>
                            </div>

                            <div className="space-y-3" style={{ flex: 1, marginBottom: 24 }}>
                                <div className="info-row">
                                    <span className="info-label">Diagnosis</span>
                                    <span className="info-value truncate ml-2">{patient.diagnosis || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Surgery</span>
                                    <span className="info-value truncate ml-2">{patient.surgeryType || 'N/A'}</span>
                                </div>
                                <div className="info-row pb-3 border-b">
                                    <span className="info-label">Status</span>
                                    <span className={`badge ${patient.status === 'Active' ? 'badge-success' : patient.status === 'Critical' ? 'badge-danger' : patient.status === 'Recovered' ? 'badge-info' : 'badge-warning'}`}>
                                        {patient.status}
                                    </span>
                                </div>
                                {/* Recovery */}
                                <div className="pt-1">
                                    <div className="flex items-end justify-between text-sm mb-2">
                                        <span className="text-muted font-medium">Recovery Phase</span>
                                        <span className="text-c-primary font-black text-lg">{patient.recoveryScore || 0}%</span>
                                    </div>
                                    <div className="recovery-bar-track">
                                        <div className="recovery-bar-fill" style={{ width: `${patient.recoveryScore || 0}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3" style={{ marginTop: 'auto' }}>
                                <Link to={`/patients/${patient._id}`} style={{ flex: 1 }}>
                                    <button className="btn-track"><HiOutlineEye size={16} /> Track Patient</button>
                                </Link>
                                <div className="flex gap-2">
                                    <Link to={`/patients/edit/${patient._id}`}>
                                        <button className="btn-icon btn-icon-edit"><HiOutlinePencil size={18} /></button>
                                    </Link>
                                    <button onClick={() => handleDelete(patient._id, patient.fullName)}
                                        className="btn-icon btn-icon-delete"><HiOutlineTrash size={18} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setPagination(p => ({ ...p, page }))}
                            className={`page-btn ${pagination.page === page ? 'active' : ''}`}>
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
