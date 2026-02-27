import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPatients } from '../services/patientService';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { HiOutlineExternalLink, HiOutlineLocationMarker, HiUser } from 'react-icons/hi';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const PatientMapPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPatients({ limit: 500 })
            .then(res => setPatients(res.data.data))
            .catch(() => toast.error('Failed to load patients for map'))
            .finally(() => setLoading(false));
    }, []);

    const mappedPatients = patients.filter(p => p.location && p.location.lat && p.location.lng);
    const defaultCenter = mappedPatients.length > 0
        ? [mappedPatients[0].location.lat, mappedPatients[0].location.lng]
        : [20.5937, 78.9629];

    if (loading) return (
        <div className="flex items-center justify-center" style={{ height: 260 }}>
            <div className="spinner" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight">🗺️ Patient Geographic Map</h1>
                    <p className="text-sm font-medium text-muted mt-1">Visualize patient distribution and locate critical cases instantly</p>
                </div>
                <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Showing <strong style={{ marginLeft: 4, marginRight: 4 }}>{mappedPatients.length}</strong> / {patients.length} active locations
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card map-container" style={{ padding: 8 }}>
                <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%', borderRadius: 16, zIndex: 0 }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mappedPatients.map(patient => (
                        <Marker key={patient._id} position={[patient.location.lat, patient.location.lng]}>
                            <Popup>
                                <div className="popup-card">
                                    <h3><HiUser style={{ color: '#6366f1' }} /> {patient.fullName}</h3>
                                    <div className="flex items-center gap-2 mt-3 mb-2">
                                        <span className={`badge ${patient.status === 'Active' ? 'badge-success' : patient.status === 'Critical' ? 'badge-danger' : patient.status === 'Recovered' ? 'badge-info' : 'badge-warning'}`}>
                                            {patient.status}
                                        </span>
                                        <span className={`badge ${patient.riskLevel === 'High' ? 'badge-danger' : patient.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                                            {patient.riskLevel} Risk
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold" style={{ color: '#334155', marginTop: 8 }}>
                                        ⚕️ {patient.diagnosis || 'No Diagnosis'}
                                    </p>
                                    <p className="text-xs text-muted" style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                        <HiOutlineLocationMarker size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <span className="line-clamp-2">{patient.location.formattedAddress || patient.address}</span>
                                    </p>
                                    <Link to={`/patients/${patient._id}`}>
                                        <button className="popup-btn flex items-center justify-center gap-1">
                                            View Patient Profile <HiOutlineExternalLink size={14} />
                                        </button>
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </motion.div>
        </div>
    );
};

export default PatientMapPage;
