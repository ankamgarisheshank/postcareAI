import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPatients, getMyPatient } from '../services/patientService';
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

// Default center (Hyderabad, India) for patients without address
const DEFAULT_CENTER = [17.385, 78.4867];
const OFFSET_STEP = 0.015; // ~1.5km between markers for approximate locations

// Helper: get [lat, lng] for Leaflet (server stores { lat, lng } or GeoJSON { coordinates: [lng, lat] })
const getPatientCoords = (p) => {
    if (!p?.location) return null;
    if (p.location.coordinates?.length === 2) return [p.location.coordinates[1], p.location.coordinates[0]];
    if (p.location.lat != null && p.location.lng != null) return [p.location.lat, p.location.lng];
    return null;
};

// Get coords for map display: real location OR fallback (approximate) so all patients show
const getDisplayCoords = (patient, index) => {
    const real = getPatientCoords(patient);
    if (real) return { coords: real, isApproximate: false };
    // Fallback: spread patients around default center so they're all visible
    const [baseLat, baseLng] = DEFAULT_CENTER;
    const row = Math.floor(index / 3);
    const col = index % 3;
    const coords = [baseLat + row * OFFSET_STEP, baseLng + col * OFFSET_STEP];
    return { coords, isApproximate: true };
};

const PatientMapPage = () => {
    const { isDoctor } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = isDoctor ? getPatients() : getMyPatient();
        fetch
            .then(({ data }) => {
                const d = data.data;
                setPatients(Array.isArray(d) ? d : (d ? [d] : []));
            })
            .catch(() => toast.error('Failed to load patients'))
            .finally(() => setLoading(false));
    }, [isDoctor]);

    const center = patients.length > 0
        ? getDisplayCoords(patients[0], 0).coords
        : DEFAULT_CENTER;

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
                    <HiOutlineLocationMarker size={16} /> {patients.length} Patient{patients.length !== 1 ? 's' : ''} on Map
                </span>
            </div>

            {loading ? (
                <div className="loading-shimmer" style={{ height: 500, borderRadius: 16 }} />
            ) : patients.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                    <HiOutlineMap size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No Patients Yet</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Add patients to see them on the map.</p>
                </div>
            ) : (
                <div className="card map-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <MapContainer center={center} zoom={12} style={{ height: 500, width: '100%', borderRadius: 16 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSL</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {patients.map((patient, idx) => {
                            const { coords, isApproximate } = getDisplayCoords(patient, idx);
                            return (
                                <Marker key={patient._id} position={coords}>
                                    <Popup>
                                        <div style={{ fontFamily: 'Inter', minWidth: 200 }}>
                                            {isApproximate && (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 8 }}>Approximate location</span>
                                            )}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#111' }}>
                                                    {(patient.fullName || patient.name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{patient.fullName || patient.name}</p>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                                                        background: patient.riskLevel === 'High' ? 'rgba(239,68,68,0.1)' : patient.riskLevel === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                                                        color: patient.riskLevel === 'High' ? '#dc2626' : patient.riskLevel === 'Medium' ? '#d97706' : '#16a34a',
                                                    }}>{patient.riskLevel} Risk</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginTop: 8 }}>
                                                {patient.diagnosis || patient.surgeryType || 'No diagnosis'}
                                            </p>
                                            <p style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                                                <HiOutlineLocationMarker size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                                {patient.address || (isApproximate ? 'Add address to get exact location' : 'No address')}
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
                            );
                        })}
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export default PatientMapPage;
