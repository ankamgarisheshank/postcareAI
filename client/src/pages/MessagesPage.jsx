import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getMyPatient } from '../services/patientService';
import toast from 'react-hot-toast';
import {
    HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineSparkles,
    HiOutlineUser, HiOutlineUserCircle, HiOutlineChevronDown, HiOutlineSearch,
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
    const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setPatientDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => { if (isDoctor) api.get('/patients').then(({ data }) => setPatients(data.data || [])).catch(() => toast.error('Failed to load patients')); }, [isDoctor]);

    useEffect(() => {
        if (isPatient) {
            if (user?.linkedPatientId) setSelectedPatientId(user.linkedPatientId);
            else getMyPatient().then(({ data }) => { const p = data?.data; if (p?._id) setSelectedPatientId(p._id); }).catch(() => { });
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
        <div className="messages-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', minHeight: 0 }}>
            {/* Header */}
            <div style={{ padding: '16px 24px 12px', flexShrink: 0 }} className="messages-header">
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
                    <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 12 }}>
                        <button
                            type="button"
                            onClick={() => setPatientDropdownOpen(o => !o)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 16px',
                                borderRadius: 14,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: selectedPatient ? 'var(--accent-bg)' : 'var(--bg-input)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                                color: selectedPatient ? 'var(--accent)' : 'var(--text-muted)',
                                flexShrink: 0,
                            }}>
                                {selectedPatient ? (selectedPatient.fullName || selectedPatient.name || '?').charAt(0).toUpperCase() : <HiOutlineUser size={22} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                                    {selectedPatient ? (selectedPatient.fullName || selectedPatient.name) : 'Select patient to message'}
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {selectedPatient ? `${selectedPatient.surgeryType || 'General care'} • ${selectedPatient.phone || 'No phone'}` : `${patients.length} patient${patients.length !== 1 ? 's' : ''} available`}
                                </p>
                            </div>
                            {selectedPatient && (
                                <span className="badge" style={{
                                    background: selectedPatient.riskStatus === 'critical' ? 'rgba(239,68,68,0.15)' : 'var(--accent-bg)',
                                    color: selectedPatient.riskStatus === 'critical' ? 'var(--danger)' : 'var(--text-secondary)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}>
                                    {selectedPatient.riskStatus || selectedPatient.riskLevel || 'Active'}
                                </span>
                            )}
                            <HiOutlineChevronDown size={20} style={{
                                color: 'var(--text-muted)',
                                flexShrink: 0,
                                transform: patientDropdownOpen ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s',
                            }} />
                        </button>

                        <AnimatePresence>
                            {patientDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: 6,
                                        background: 'var(--bg-card)',
                                        borderRadius: 14,
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                        maxHeight: 320,
                                    }}
                                >
                                    {patients.length > 4 && (
                                        <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <HiOutlineSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, surgery, phone..."
                                                    value={patientSearch}
                                                    onChange={e => setPatientSearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px 10px 40px',
                                                        borderRadius: 10,
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--bg-input)',
                                                        fontSize: 13,
                                                        outline: 'none',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ maxHeight: 260, overflowY: 'auto', padding: 8 }}>
                                        {patients
                                            .filter(p => !patientSearch.trim() || [p.name, p.fullName, p.surgeryType, p.phone].some(v => String(v || '').toLowerCase().includes(patientSearch.toLowerCase())))
                                            .map(p => (
                                                <button
                                                    key={p._id}
                                                    type="button"
                                                    onClick={() => { setSelectedPatientId(p._id); setPatientDropdownOpen(false); setPatientSearch(''); }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '12px 14px',
                                                        borderRadius: 12,
                                                        border: 'none',
                                                        background: selectedPatientId === p._id ? 'var(--accent-bg)' : 'transparent',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => { if (selectedPatientId !== p._id) e.currentTarget.style.background = 'var(--bg-input)'; }}
                                                    onMouseLeave={e => { if (selectedPatientId !== p._id) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 10,
                                                        background: selectedPatientId === p._id ? 'var(--accent)' : 'var(--bg-input)',
                                                        color: selectedPatientId === p._id ? 'var(--black)' : 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        flexShrink: 0,
                                                    }}>
                                                        {(p.fullName || p.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.fullName || p.name}</p>
                                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{p.surgeryType || 'General care'} {p.phone ? `• ${p.phone}` : ''}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        {patients.filter(p => !patientSearch.trim() || [p.name, p.fullName, p.surgeryType, p.phone].some(v => String(v || '').toLowerCase().includes(patientSearch.toLowerCase()))).length === 0 && (
                                            <p style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No patients match your search</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
