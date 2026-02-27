import { useState, useEffect } from 'react';
import { getPatients } from '../services/patientService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { HiOutlineExternalLink, HiOutlineLocationMarker, HiUser, HiOutlineMap, HiOutlineHeart } from 'react-icons/hi';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const PatientMapPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPatients()
            .then(({ data }) => setPatients((data.data || []).filter(p => p.location?.coordinates?.length === 2)))
            .catch(() => toast.error('Failed to load patients'))
            .finally(() => setLoading(false));
    }, []);

    const center = patients.length > 0
        ? [patients[0].location.coordinates[1], patients[0].location.coordinates[0]]
        : [17.385, 78.4867];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                        Patient Map
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Visualize patient distribution and locate critical cases</p>
                </div>
                <span className="badge badge-accent" style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}>
                    <HiOutlineLocationMarker size={16} /> {patients.length} Located
                </span>
            </div>

            {loading ? (
                <div className="loading-shimmer" style={{ height: 500, borderRadius: 16 }} />
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <MapContainer center={center} zoom={12} style={{ height: 500, width: '100%', borderRadius: 16 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSL</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {patients.map(patient => (
                            <Marker key={patient._id} position={[patient.location.coordinates[1], patient.location.coordinates[0]]}>
                                <Popup>
                                    <div style={{ fontFamily: 'Inter', minWidth: 200 }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#111' }}>
                                                {(patient.fullName || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{patient.fullName}</p>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                                                    background: patient.riskLevel === 'High' ? 'rgba(239,68,68,0.1)' : patient.riskLevel === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                                    color: patient.riskLevel === 'High' ? '#dc2626' : patient.riskLevel === 'Medium' ? '#d97706' : '#16a34a',
                                                }}>{patient.riskLevel} Risk</span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginTop: 8 }}>
                                            {patient.diagnosis || 'No Diagnosis'}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                                            <HiOutlineLocationMarker size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                            {patient.address || 'No address'}
                                        </p>
                                        <a href={`/patients/${patient._id}`} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            marginTop: 10, fontSize: 12, fontWeight: 600,
                                            color: '#111', textDecoration: 'underline',
                                        }}>
                                            View Profile <HiOutlineExternalLink size={14} />
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export default PatientMapPage;
