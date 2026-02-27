import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineSparkles,
    HiOutlineUser, HiOutlineUserCircle, HiOutlineChevronDown,
} from 'react-icons/hi';

const TABS = { AI: 'ai', DIRECT: 'direct' };

const MessagesPage = () => {
    const { user, isDoctor, isPatient } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [activeTab, setActiveTab] = useState(TABS.AI);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { if (isDoctor) api.get('/patients').then(({ data }) => setPatients(data.data || [])).catch(() => toast.error('Failed to load patients')); }, [isDoctor]);

    useEffect(() => {
        if (isPatient) {
            if (user?.linkedPatientId) setSelectedPatientId(user.linkedPatientId);
            else if (user?.phone) api.get('/patients').then(({ data }) => { const m = (data.data || []).find(p => p.phone === user.phone || p.phone === user.phone?.replace(/^\+91/, '')); if (m) setSelectedPatientId(m._id); }).catch(() => { });
        }
    }, [isPatient, user]);

    const loadMessages = useCallback(async () => {
        if (!selectedPatientId) return;
        setLoadingHistory(true);
        try { const { data } = await api.get(`/messages?patientId=${selectedPatientId}`); setMessages(data.data || []); }
        catch { } finally { setLoadingHistory(false); }
    }, [selectedPatientId]);
    useEffect(() => { loadMessages(); }, [loadMessages]);
    useEffect(() => { if (isDoctor && selectedPatientId) setSelectedPatient(patients.find(p => p._id === selectedPatientId) || null); }, [selectedPatientId, patients, isDoctor]);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const displayMessages = messages.filter(m => activeTab === TABS.AI ? (m.from === 'ai' || m.to === 'ai' || m.from === (isDoctor ? 'doctor' : 'patient')) : m.from !== 'ai');

    const handleSend = async () => {
        if (!input.trim() || !selectedPatientId || sending) return;
        const text = input.trim();
        setInput('');
        setSending(true);
        try {
            if (activeTab === TABS.AI) {
                setMessages(prev => [...prev, { _id: `temp-${Date.now()}`, from: isDoctor ? 'doctor' : 'patient', to: 'ai', content: text, createdAt: new Date().toISOString() }]);
                const { data } = await api.post('/messages/agent', { patientId: selectedPatientId, message: text });
                setMessages(prev => [...prev, { _id: `ai-${Date.now()}`, from: 'ai', to: isDoctor ? 'doctor' : 'patient', content: data.data.response, createdAt: new Date().toISOString() }]);
                // Show toasts for agentic actions
                if (data.data.prescriptionsCreated > 0) {
                    toast.success(`💊 ${data.data.prescriptionsCreated} prescription(s) created & patient notified via WhatsApp`, { duration: 5000 });
                }
                if (data.data.whatsappSent > 0) {
                    toast.success(`📱 WhatsApp message sent to patient`, { duration: 3000 });
                }
            } else {
                setMessages(prev => [...prev, { _id: `temp-${Date.now()}`, from: isDoctor ? 'doctor' : 'patient', to: isDoctor ? 'patient' : 'doctor', content: text, createdAt: new Date().toISOString() }]);
                await api.post('/messages', { patientId: selectedPatientId, content: text });
            }
        } catch { toast.error('Failed to send message'); }
        finally { setSending(false); inputRef.current?.focus(); }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const noPatientSelected = !selectedPatientId;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px 12px', flexShrink: 0 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HiOutlineChatAlt2 size={20} color="var(--black)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                            {isDoctor ? 'Messages & AI Assistant' : 'Chat & Messages'}
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                            {isDoctor ? 'Chat with AI or message patients directly' : 'Talk to AI assistant or message your doctor'}
                        </p>
                    </div>
                </div>

                {/* Patient Selector */}
                {isDoctor && (
                    <div className="flex items-center gap-3" style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', marginBottom: 10 }}>
                        <HiOutlineUser size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ position: 'relative', flex: 1 }}>
                            <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                                className="input-field" style={{ border: 'none', padding: '6px 28px 6px 0', background: 'transparent', height: 'auto', fontSize: 13 }}>
                                <option value="">Select a patient...</option>
                                {patients.map(p => <option key={p._id} value={p._id}>{p.name} — {p.surgeryType || 'N/A'} {p.phone ? `(${p.phone})` : ''}</option>)}
                            </select>
                        </div>
                        {selectedPatient && <span className="badge badge-info">{selectedPatient.riskStatus || selectedPatient.riskLevel || 'Active'}</span>}
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="tabs-container" style={{ width: '100%' }}>
                    <button className={`tab-btn ${activeTab === TABS.AI ? 'active' : ''}`} onClick={() => setActiveTab(TABS.AI)} style={{ flex: 1 }}>
                        <HiOutlineSparkles size={15} style={{ marginRight: 6 }} /> AI Assistant
                    </button>
                    <button className={`tab-btn ${activeTab === TABS.DIRECT ? 'active' : ''}`} onClick={() => setActiveTab(TABS.DIRECT)} style={{ flex: 1 }}>
                        <HiOutlineUserCircle size={15} style={{ marginRight: 6 }} /> {isDoctor ? 'Direct Message' : 'Message Doctor'}
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {noPatientSelected ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5 }}>
                        <HiOutlineChatAlt2 size={44} style={{ color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 240, fontWeight: 500 }}>
                            {isDoctor ? 'Select a patient above' : 'Loading your profile...'}
                        </p>
                    </div>
                ) : loadingHistory ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
                ) : displayMessages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
                        {activeTab === TABS.AI ? (
                            <>
                                <HiOutlineSparkles size={38} style={{ color: '#C8FF00' }} />
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>Ask the AI about recovery, medications, or symptoms.</p>
                            </>
                        ) : (
                            <>
                                <HiOutlineUserCircle size={38} style={{ color: 'var(--text-muted)' }} />
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>{isDoctor ? 'Send a direct message' : 'Message your doctor'}</p>
                            </>
                        )}
                    </div>
                ) : (
                    displayMessages.map(msg => <ChatBubble key={msg._id} msg={msg} isDoctor={isDoctor} />)
                )}
                {sending && activeTab === TABS.AI && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: '14px 14px 14px 4px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                        <HiOutlineSparkles size={14} style={{ color: '#C8FF00' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI is thinking...</span>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            {!noPatientSelected && (
                <div style={{ padding: '10px 24px 18px', flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                            placeholder={activeTab === TABS.AI ? 'Ask the AI assistant...' : isDoctor ? 'Message patient...' : 'Message your doctor...'}
                            rows={1} style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontFamily: 'Inter', fontSize: 14, lineHeight: '22px', maxHeight: 110, overflowY: 'auto' }}
                            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || sending}
                            style={{
                                width: 38, height: 38, borderRadius: 10, border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'default',
                                background: input.trim() && !sending ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', flexShrink: 0, opacity: input.trim() && !sending ? 1 : 0.4,
                            }}>
                            <HiOutlinePaperAirplane size={17} style={{ color: input.trim() && !sending ? 'var(--black)' : 'var(--text-muted)', transform: 'rotate(90deg)' }} />
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                        {activeTab === TABS.AI ? 'Powered by PostCare AI + Gemini' : 'Messages are stored securely'}
                    </p>
                </div>
            )}
        </div>
    );
};

const ChatBubble = ({ msg, isDoctor }) => {
    const isAI = msg.from === 'ai';
    const isSelf = (isDoctor && msg.from === 'doctor') || (!isDoctor && msg.from === 'patient');
    const isRight = isSelf;

    const label = isAI ? 'AI Assistant' : msg.from === 'doctor' ? (isDoctor ? 'You' : 'Doctor') : (isDoctor ? 'Patient' : 'You');
    const labelColor = isAI ? '#6d8a00' : isRight ? 'var(--text)' : 'var(--text-secondary)';

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ alignSelf: isRight ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: labelColor, marginLeft: 4 }}>
                {isAI && <HiOutlineSparkles size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />}{label}
            </span>
            <div style={{
                padding: '12px 16px', borderRadius: isRight ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isRight && !isAI ? 'var(--black)' : 'var(--bg-input)',
                border: isRight && !isAI ? 'none' : '1px solid var(--border)',
                color: isRight && !isAI ? '#fff' : 'var(--text)', fontSize: 14, lineHeight: 1.6,
                fontFamily: 'Inter', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
                {msg.content}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
};

export default MessagesPage;
