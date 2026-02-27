import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineSparkles,
    HiOutlineUser, HiOutlineUserCircle,
    HiOutlineChevronDown,
} from 'react-icons/hi';

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */
const TABS = {
    AI: 'ai',
    DIRECT: 'direct',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const MessagesPage = () => {
    const { user, isDoctor, isPatient } = useAuth();

    // Patient selector (for doctors)
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Tabs & messages
    const [activeTab, setActiveTab] = useState(TABS.AI);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    /* -------- load patients for doctor -------- */
    useEffect(() => {
        if (isDoctor) {
            api.get('/patients')
                .then(({ data }) => setPatients(data.data || []))
                .catch(() => toast.error('Failed to load patients'));
        }
    }, [isDoctor]);

    /* -------- resolve patient ID for patient user -------- */
    useEffect(() => {
        if (isPatient) {
            if (user?.linkedPatientId) {
                setSelectedPatientId(user.linkedPatientId);
            } else if (user?.phone) {
                // Fallback: find patient record by phone
                api.get('/patients')
                    .then(({ data }) => {
                        const match = (data.data || []).find(
                            (p) => p.phone === user.phone || p.phone === user.phone?.replace(/^\+91/, '')
                        );
                        if (match) setSelectedPatientId(match._id);
                    })
                    .catch(() => {});
            }
        }
    }, [isPatient, user]);

    /* -------- load message history when patient selected -------- */
    const loadMessages = useCallback(async () => {
        if (!selectedPatientId) return;
        setLoadingHistory(true);
        try {
            const { data } = await api.get(`/messages?patientId=${selectedPatientId}`);
            setMessages(data.data || []);
        } catch {
            // silent
        } finally {
            setLoadingHistory(false);
        }
    }, [selectedPatientId]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    /* -------- keep selected patient object in sync -------- */
    useEffect(() => {
        if (isDoctor && selectedPatientId) {
            const found = patients.find((p) => p._id === selectedPatientId);
            setSelectedPatient(found || null);
        }
    }, [selectedPatientId, patients, isDoctor]);

    /* -------- auto-scroll -------- */
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    /* -------- filter messages for active tab -------- */
    // AI tab: messages where from=ai or to=ai
    // Direct tab: doctor↔patient only (no AI involvement)
    const displayMessages = messages.filter((m) => {
        if (activeTab === TABS.AI) {
            return m.from === 'ai' || m.to === 'ai';
        }
        return m.from !== 'ai' && m.to !== 'ai';
    });

    /* -------- send -------- */
    const handleSend = async () => {
        if (!input.trim() || !selectedPatientId || sending) return;
        const text = input.trim();
        setInput('');
        setSending(true);

        try {
            if (activeTab === TABS.AI) {
                // AI agent mode
                const optimisticUser = {
                    _id: `temp-${Date.now()}`,
                    from: isDoctor ? 'doctor' : 'patient',
                    to: 'ai',
                    content: text,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, optimisticUser]);

                const { data } = await api.post('/messages/agent', {
                    patientId: selectedPatientId,
                    message: text,
                });

                const aiMsg = {
                    _id: `ai-${Date.now()}`,
                    from: 'ai',
                    to: isDoctor ? 'doctor' : 'patient',
                    content: data.data.response,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, aiMsg]);
            } else {
                // Direct message mode
                const optimisticMsg = {
                    _id: `temp-${Date.now()}`,
                    from: isDoctor ? 'doctor' : 'patient',
                    to: isDoctor ? 'patient' : 'doctor',
                    content: text,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, optimisticMsg]);

                await api.post('/messages', {
                    patientId: selectedPatientId,
                    content: text,
                });
            }
        } catch (err) {
            toast.error('Failed to send message');
            console.error(err);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* =============== RENDER =============== */
    const noPatientSelected = !selectedPatientId;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 0 }}>
            {/* ---- Header ---- */}
            <div style={{ padding: '20px 24px 16px', flexShrink: 0 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <HiOutlineChatAlt2 size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-primary" style={{ lineHeight: 1.2 }}>
                            {isDoctor ? 'Messages & AI Assistant' : 'Chat & Messages'}
                        </h1>
                        <p className="text-sm text-muted">
                            {isDoctor
                                ? 'Chat with OpenClaw AI or message your patients directly'
                                : 'Talk to your AI care assistant or message your doctor'}
                        </p>
                    </div>
                </div>

                {/* ---- Patient Selector (doctor only) ---- */}
                {isDoctor && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 14,
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        marginBottom: 12,
                    }}>
                        <HiOutlineUser size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        <div style={{ position: 'relative', flex: 1 }}>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 32px 8px 0',
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-primary)', fontSize: 14,
                                    fontFamily: 'Poppins, sans-serif', fontWeight: 500,
                                    cursor: 'pointer', outline: 'none',
                                    appearance: 'none', WebkitAppearance: 'none',
                                }}
                            >
                                <option value="" style={{ background: 'var(--bg-secondary)' }}>
                                    Select a patient...
                                </option>
                                {patients.map((p) => (
                                    <option
                                        key={p._id}
                                        value={p._id}
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        {p.name} — {p.surgeryType || 'N/A'} {p.phone ? `(${p.phone})` : ''}
                                    </option>
                                ))}
                            </select>
                            <HiOutlineChevronDown
                                size={16}
                                style={{
                                    position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--text-secondary)', pointerEvents: 'none',
                                }}
                            />
                        </div>
                        {selectedPatient && (
                            <span className="badge badge-info" style={{ flexShrink: 0 }}>
                                {selectedPatient.riskStatus || selectedPatient.riskLevel || 'Active'}
                            </span>
                        )}
                    </div>
                )}

                {/* ---- Tab Switcher ---- */}
                <div style={{
                    display: 'flex', gap: 4, padding: 4, borderRadius: 14,
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                }}>
                    {[
                        { key: TABS.AI, label: 'AI Assistant', icon: HiOutlineSparkles },
                        { key: TABS.DIRECT, label: isDoctor ? 'Direct Message' : 'Message Doctor', icon: HiOutlineUserCircle },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '10px 16px', borderRadius: 11, border: 'none',
                                cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                                fontSize: 13, fontWeight: 600,
                                transition: 'all 0.2s ease',
                                background: activeTab === tab.key
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'transparent',
                                color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ---- Chat Area ---- */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1, overflowY: 'auto', padding: '0 24px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                }}
            >
                {noPatientSelected ? (
                    /* Empty state */
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.5,
                    }}>
                        <HiOutlineChatAlt2 size={48} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-muted font-medium text-center" style={{ maxWidth: 260 }}>
                            {isDoctor
                                ? 'Select a patient above to start chatting'
                                : 'Loading your patient profile...'}
                        </p>
                    </div>
                ) : loadingHistory ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div className="spinner" />
                    </div>
                ) : displayMessages.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5,
                    }}>
                        {activeTab === TABS.AI ? (
                            <>
                                <HiOutlineSparkles size={40} style={{ color: '#8b5cf6' }} />
                                <p className="text-sm text-muted text-center" style={{ maxWidth: 280 }}>
                                    Ask the AI about recovery progress, medications, symptoms, or anything related to post-operative care.
                                </p>
                            </>
                        ) : (
                            <>
                                <HiOutlineUserCircle size={40} style={{ color: 'var(--text-muted)' }} />
                                <p className="text-sm text-muted text-center" style={{ maxWidth: 280 }}>
                                    {isDoctor
                                        ? 'Send a direct message to this patient'
                                        : 'Send a message to your doctor'}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    /* Message bubbles */
                    displayMessages.map((msg) => <ChatBubble key={msg._id} msg={msg} isDoctor={isDoctor} />)
                )}

                {/* Typing indicator */}
                {sending && activeTab === TABS.AI && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px', borderRadius: '16px 16px 16px 4px',
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        }}
                    >
                        <HiOutlineSparkles size={14} style={{ color: '#8b5cf6' }} />
                        <span className="text-xs text-muted">AI is thinking...</span>
                        <span className="dot-pulse" />
                    </motion.div>
                )}
            </div>

            {/* ---- Input Area ---- */}
            {!noPatientSelected && (
                <div style={{
                    padding: '12px 24px 20px', flexShrink: 0,
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: 10,
                        padding: '10px 14px', borderRadius: 16,
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                activeTab === TABS.AI
                                    ? 'Ask the AI assistant...'
                                    : isDoctor
                                        ? 'Message patient...'
                                        : 'Message your doctor...'
                            }
                            rows={1}
                            style={{
                                flex: 1, resize: 'none', border: 'none', outline: 'none',
                                background: 'transparent', color: 'var(--text-primary)',
                                fontFamily: 'Poppins, sans-serif', fontSize: 14,
                                lineHeight: '22px', maxHeight: 110, overflowY: 'auto',
                            }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            style={{
                                width: 40, height: 40, borderRadius: 12, border: 'none',
                                cursor: input.trim() && !sending ? 'pointer' : 'default',
                                background: input.trim() && !sending
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'var(--bg-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease', flexShrink: 0,
                                opacity: input.trim() && !sending ? 1 : 0.4,
                            }}
                        >
                            <HiOutlinePaperAirplane
                                size={18}
                                style={{
                                    color: input.trim() && !sending ? '#fff' : 'var(--text-muted)',
                                    transform: 'rotate(90deg)',
                                }}
                            />
                        </button>
                    </div>
                    <p className="text-xs text-muted" style={{ marginTop: 6, textAlign: 'center' }}>
                        {activeTab === TABS.AI
                            ? 'Powered by OpenClaw + Gemini 3 Pro'
                            : 'Messages are stored securely'}
                    </p>
                </div>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Chat Bubble                                                        */
/* ------------------------------------------------------------------ */
const ChatBubble = ({ msg, isDoctor }) => {
    const isAI = msg.from === 'ai';
    const isSelf =
        (isDoctor && msg.from === 'doctor') || (!isDoctor && msg.from === 'patient');
    const isRight = isSelf;

    const bgColor = isAI
        ? 'var(--bg-tertiary)'
        : isRight
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'var(--bg-tertiary)';

    const textColor = isRight && !isAI ? '#fff' : 'var(--text-primary)';

    const borderRadius = isAI
        ? '16px 16px 16px 4px'
        : isRight
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px';

    const label = isAI
        ? 'AI Assistant'
        : msg.from === 'doctor'
            ? (isDoctor ? 'You' : 'Doctor')
            : (isDoctor ? 'Patient' : 'You');

    const labelColor = isAI ? '#8b5cf6' : isRight ? '#6366f1' : 'var(--text-secondary)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                alignSelf: isRight ? 'flex-end' : 'flex-start',
                maxWidth: '75%', display: 'flex', flexDirection: 'column',
                gap: 4,
            }}
        >
            <span style={{ fontSize: 11, fontWeight: 600, color: labelColor, marginLeft: 4 }}>
                {isAI && <HiOutlineSparkles size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                {label}
            </span>
            <div
                style={{
                    padding: '12px 16px', borderRadius, background: bgColor,
                    border: isRight && !isAI ? 'none' : '1px solid var(--border)',
                    color: textColor, fontSize: 14, lineHeight: 1.6,
                    fontFamily: 'Poppins, sans-serif', whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {msg.content}
            </div>
            <span style={{
                fontSize: 10, color: 'var(--text-muted)', marginLeft: 4,
            }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
};

export default MessagesPage;
