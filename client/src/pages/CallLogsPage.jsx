import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCallLogs } from '../services/patientService';
import toast from 'react-hot-toast';
import { HiOutlinePhone, HiOutlineUser, HiOutlineDocumentText } from 'react-icons/hi';

const CallLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data } = await getCallLogs();
            setLogs(data.data || []);
        } catch {
            toast.error('Failed to load call logs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    Call Logs
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    VAPI call history with AI summaries — what happened in each call
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="loading-shimmer" style={{ height: 120, borderRadius: 16 }} />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                    <HiOutlinePhone size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No call logs yet</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Call logs appear here after scheduled VAPI calls complete. Configure the VAPI webhook to receive transcripts and AI summaries.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log, i) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="card"
                            style={{ padding: 20 }}
                        >
                            <div
                                className="flex items-start justify-between"
                                style={{ gap: 16, cursor: (log.transcript || log.summary) ? 'pointer' : 'default' }}
                                onClick={() => (log.transcript || log.summary) && setExpandedId(expandedId === log._id ? null : log._id)}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                                        <HiOutlineUser size={18} style={{ color: 'var(--accent)' }} />
                                        <Link to={`/patients/${log.patientId?._id || log.patientId}`} onClick={e => e.stopPropagation()} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                                            {log.patientName || log.patientId?.fullName || log.patientId?.name || 'Unknown'}
                                        </Link>
                                        <span className="badge" style={{ background: log.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'var(--accent-bg)', color: log.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)', fontSize: 11 }}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {log.patientPhone} • {log.scheduledAt ? new Date(log.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : new Date(log.createdAt).toLocaleString()}
                                    </p>
                                    {log.message && (
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Message: {log.message}</p>
                                    )}
                                    {log.summary && (
                                        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-light)' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                                                <HiOutlineDocumentText size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> AI Summary
                                            </p>
                                            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{log.summary}</p>
                                        </div>
                                    )}
                                    {expandedId === log._id && log.transcript && (
                                        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {log.transcript}
                                        </div>
                                    )}
                                    {(log.transcript || log.summary) && !log.summary && !expandedId && (
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Click to {log.transcript ? 'view transcript' : 'expand'}</p>
                                    )}
                                </div>
                                {log.recordingUrl && (
                                    <a href={log.recordingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="btn btn-outline btn-sm">
                                        Listen
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CallLogsPage;
