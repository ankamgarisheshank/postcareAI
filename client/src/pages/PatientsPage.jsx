import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatients, deletePatient } from '../services/patientService';
import toast, { Toaster } from 'react-hot-toast';
import {
    HiOutlineSearch, HiOutlinePlus, HiOutlineTrash,
    HiOutlineExternalLink, HiOutlinePencil, HiOutlineFilter,
} from 'react-icons/hi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => { fetchPatients(); }, []);
    const fetchPatients = async () => {
        try { const { data } = await getPatients(); setPatients(data.data || []); }
        catch { toast.error('Failed to load patients'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this patient?')) return;
        try { await deletePatient(id); setPatients(prev => prev.filter(p => p._id !== id)); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    const filtered = patients.filter(p => {
        const matchSearch = (p.fullName || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.phone || '').includes(search);
        const matchStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'Critical' ? 'badge-danger' : s === 'Recovered' ? 'badge-info' : 'badge-warning';
    const riskBadge = (r) => r === 'High' ? 'badge-danger' : r === 'Medium' ? 'badge-warning' : 'badge-success';

    if (loading) return (
        <div className="space-y-5">
            <div className="loading-shimmer" style={{ height: 60, borderRadius: 16 }} />
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="loading-shimmer" style={{ height: 160, borderRadius: 16 }} />)}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Patients</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{patients.length} total patients registered</p>
                </div>
                <Link to="/patients/add" className="btn btn-primary btn-pill">
                    <HiOutlinePlus size={18} /> Add Patient
                </Link>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 250 }}>
                    <HiOutlineSearch size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input placeholder="Search patients by name, diagnosis, phone..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="tabs-container">
                    {['All', 'Active', 'Critical', 'Recovered'].map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)} className={`tab-btn ${statusFilter === f ? 'active' : ''}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Patient Grid */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><HiOutlineSearch size={28} style={{ color: 'var(--text-muted)' }} /></div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>No patients found</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Try adjusting your search or filters</p>
                </div>
            ) : (
                <motion.div variants={container} initial="hidden" animate="show"
                    className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {filtered.map(patient => (
                        <motion.div key={patient._id} variants={item}>
                            <Link to={`/patients/${patient._id}`} className="patient-card" style={{ display: 'block', textDecoration: 'none' }}>
                                <div className="card-top-line" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="patient-avatar-lg" style={{ width: 44, height: 44, fontSize: 17, borderRadius: 12 }}>
                                        {(patient.fullName || patient.name || '?').charAt(0)}
                                    </div>
                                    <div className="min-w-0" style={{ flex: 1 }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }} className="truncate">{patient.fullName || patient.name}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{patient.age} yrs • {patient.gender}</p>
                                    </div>
                                </div>

                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }} className="truncate">
                                    {patient.diagnosis || patient.surgeryType || 'No diagnosis'}
                                </p>

                                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                                    <span className={`badge ${statusBadge(patient.status)}`}>{patient.status || 'Active'}</span>
                                    {patient.riskLevel && <span className={`badge ${riskBadge(patient.riskLevel)}`}>{patient.riskLevel} Risk</span>}
                                    {patient.recoveryScore != null && (
                                        <span className="badge badge-neutral">Recovery: {patient.recoveryScore}%</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {patient.phone || 'No phone'}
                                    </span>
                                    <div className="flex gap-1">
                                        <Link to={`/patients/edit/${patient._id}`} onClick={e => e.stopPropagation()}
                                            style={{ padding: 6, borderRadius: 8, color: 'var(--text-muted)', display: 'flex' }}>
                                            <HiOutlinePencil size={16} />
                                        </Link>
                                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(patient._id); }}
                                            style={{ padding: 6, borderRadius: 8, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                                            <HiOutlineTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default PatientsPage;
