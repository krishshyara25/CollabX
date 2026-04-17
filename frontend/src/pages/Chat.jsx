import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Users, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes popIn      { 0%{opacity:0;transform:scale(.85) translateY(8px)} 70%{transform:scale(1.03) translateY(-1px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes popInRight { 0%{opacity:0;transform:scale(.85) translateY(8px) translateX(8px)} 70%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1) translateY(0) translateX(0)} }
  @keyframes typing     { 0%,80%,100%{transform:scale(0);opacity:.4} 40%{transform:scale(1);opacity:1} }
  @keyframes ping       { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
  @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.5} }
  * { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:999px; }
  ::-webkit-scrollbar-thumb:hover { background:#cbd5e1; }
  input::placeholder { color:#94a3b8; }
  input:focus { outline:none; }
`;

const AVATAR_COLORS = ['#2563eb','#7c3aed','#10b981','#f59e0b','#ef4444','#0891b2','#ec4899'];

const getAvatarColor = (username = '') =>
  AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Avatar({ username, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: getAvatarColor(username),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.34, fontWeight: 700,
      border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,.12)',
    }}>{(username?.[0] || '?').toUpperCase()}</div>
  );
}

function TypingIndicator({ users }) {
  if (!users.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0', animation: 'fadeUp .25s ease' }}>
      <Avatar username={users[0]} size={26} />
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px 12px 12px 4px',
        padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', gap: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block',
            animation: `typing 1.4s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{users[0]} is typing…</span>
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.75rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#e2e8f0)' }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', background: '#f8fafc', padding: '0.15rem 0.65rem', borderRadius: 999, border: '1px solid #e2e8f0' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#e2e8f0,transparent)' }} />
    </div>
  );
}

function MessageBubble({ msg, isMine, showAvatar, showName, isNew }) {
  if (msg.isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.2rem 0.75rem', borderRadius: 999 }}>{msg.text}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8,
      animation: isNew ? (isMine ? 'popInRight .35s cubic-bezier(.34,1.56,.64,1)' : 'popIn .35s cubic-bezier(.34,1.56,.64,1)') : 'none',
      marginBottom: 2,
    }}>
      {/* Avatar placeholder for alignment */}
      <div style={{ width: 32, flexShrink: 0 }}>
        {showAvatar && !isMine && <Avatar username={msg.username} size={32} />}
      </div>

      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        {showName && !isMine && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: getAvatarColor(msg.username), marginBottom: 3, paddingLeft: 4 }}>
            {msg.username}
          </span>
        )}
        <div style={{
          padding: '0.6rem 0.9rem',
          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isMine
            ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
            : 'white',
          backgroundSize: isMine ? '200% 200%' : 'auto',
          animation: isMine ? 'gradShift 6s ease infinite' : 'none',
          color: isMine ? 'white' : '#0f172a',
          fontSize: '0.9rem', lineHeight: 1.55,
          boxShadow: isMine
            ? '0 4px 14px rgba(37,99,235,.3)'
            : '0 2px 8px rgba(0,0,0,.07)',
          border: isMine ? 'none' : '1px solid #f1f5f9',
          wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 3, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(70px)', opacity: .45, ...style }} />
);

export default function Chat() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const socket     = useSocket();
  const navigate   = useNavigate();

  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState('');
  const [roomData, setRoomData]       = useState(null);
  const [typing, setTyping]           = useState([]);
  const [newMsgIds, setNewMsgIds]     = useState(new Set());
  const [inputFocused, setInputFocused] = useState(false);
  const [connected, setConnected]     = useState(!!socket);
  const [onlineCount, setOnlineCount] = useState(1);

  const messagesEndRef  = useRef(null);
  const typingTimeout   = useRef(null);
  const isTypingRef     = useRef(false);
  const inputRef        = useRef(null);

  /* fetch room */
  useEffect(() => {
    axios.get(`http://localhost:5000/api/rooms/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(({ data }) => setRoomData(data))
      .catch(() => navigate(`/room/${id}`));
  }, [id, navigate]);

  /* fetch history */
  useEffect(() => {
    axios.get(`http://localhost:5000/api/messages/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(({ data }) => setMessages(data))
      .catch(console.error);
  }, [id]);

  /* socket events */
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('join_room', { roomId: id, username: user.username });

    const onMessage = (msg) => {
      const tempId = `new-${Date.now()}`;
      const withId = { ...msg, _tempId: tempId };
      setMessages(prev => [...prev, withId]);
      setNewMsgIds(prev => new Set(prev).add(withId._id || withId.id || tempId));
      setTimeout(() => setNewMsgIds(prev => { const n = new Set(prev); n.delete(withId._id || withId.id || tempId); return n; }), 600);
    };

    const onTyping    = ({ username }) => setTyping(prev => prev.includes(username) ? prev : [...prev, username]);
    const onStopTyping = ({ username }) => setTyping(prev => prev.filter(u => u !== username));
    const onRoomUsers  = (users) => setOnlineCount(users.length || 1);

    socket.on('receive_message', onMessage);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    socket.on('room_users', onRoomUsers);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('room_users', onRoomUsers);
      socket.emit('disconnect_from_room', { roomId: id, username: user.username });
    };
  }, [socket, user, id]);

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* typing indicator */
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { roomId: id, username: user.username });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { roomId: id, username: user.username });
    }, 1200);
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !socket) return;
    clearTimeout(typingTimeout.current);
    isTypingRef.current = false;
    socket.emit('stop_typing', { roomId: id, username: user.username });

    const msg = {
      id: Date.now(),
      roomId: id,
      username: user.username,
      text: inputText.trim(),
      isSystem: false,
      timestamp: new Date().toISOString(),
    };
    socket.emit('send_message', msg);
    const tempId = `mine-${msg.id}`;
    setMessages(prev => [...prev, { ...msg, _tempId: tempId }]);
    setNewMsgIds(prev => new Set(prev).add(msg.id));
    setTimeout(() => setNewMsgIds(prev => { const n = new Set(prev); n.delete(msg.id); return n; }), 600);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* group messages by date + consecutive sender */
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const dateLabel = formatDateLabel(msg.timestamp);
    const prevLabel = prev ? formatDateLabel(prev.timestamp) : null;
    const showDate = dateLabel !== prevLabel;
    const sameSender = prev && prev.username === msg.username && !prev.isSystem && !msg.isSystem && !showDate;
    acc.push({ msg, showDate, dateLabel, showAvatar: !sameSender, showName: !sameSender });
    return acc;
  }, []);

  if (!socket) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4ff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #bfdbfe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Connecting to real-time sync…</p>
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 60%,#eff6ff 100%)',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      <Orb style={{ width: 500, height: 500, top: '-20%', right: '-10%', background: 'radial-gradient(circle,rgba(99,102,241,.12),transparent 70%)' }} />
      <Orb style={{ width: 350, height: 350, bottom: '-15%', left: '-8%',  background: 'radial-gradient(circle,rgba(16,185,129,.1),transparent 70%)' }} />

      {/* ── TOPBAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,.7)',
        boxShadow: '0 2px 16px rgba(37,99,235,.07)',
        flexShrink: 0, zIndex: 10, animation: 'slideDown .5s cubic-bezier(.16,1,.3,1)',
        position: 'relative',
      }}>
        {/* Top gradient bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#2563eb,#7c3aed,#10b981)', backgroundSize: '200% 200%', animation: 'gradShift 4s ease infinite' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/room/${id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '0.45rem 0.9rem', fontWeight: 600, fontSize: '0.8rem', color: '#64748b',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateX(0)'; }}
          ><ArrowLeft size={14} /> Back</button>

          {/* Room avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              backgroundSize: '200% 200%', animation: 'gradShift 5s ease infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(37,99,235,.3)',
            }}>{(roomData?.name?.[0] || 'R').toUpperCase()}</div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {roomData?.name || `Room ${id}`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#22c55e' : '#94a3b8', display: 'block' }} />
                  {connected && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'ping 1.8s ease-out infinite' }} />}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {connected ? `${onlineCount} online` : 'Reconnecting…'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '0.25rem 0.75rem' }}>
            <Users size={12} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>{onlineCount}</span>
          </div>
          {connected
            ? <Wifi size={16} style={{ color: '#22c55e' }} />
            : <WifiOff size={16} style={{ color: '#94a3b8', animation: 'pulse 1.5s infinite' }} />}
        </div>
      </div>

      {/* ── MESSAGES AREA ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, animation: 'fadeUp .5s ease' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              backgroundSize: '200% 200%', animation: 'gradShift 4s ease infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37,99,235,.3)',
            }}>
              <Send size={26} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>No messages yet</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Be the first to say hello! 👋</p>
          </div>
        )}

        {groupedMessages.map(({ msg, showDate, dateLabel, showAvatar, showName }, i) => (
          <React.Fragment key={msg._id || msg.id || i}>
            {showDate && <DateDivider label={dateLabel} />}
            <MessageBubble
              msg={msg}
              isMine={msg.username === user.username}
              showAvatar={showAvatar}
              showName={showName}
              isNew={newMsgIds.has(msg._id || msg.id)}
            />
          </React.Fragment>
        ))}

        <TypingIndicator users={typing.filter(u => u !== user.username)} />
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={{
        flexShrink: 0, padding: '1rem 1.5rem',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,.7)',
        boxShadow: '0 -4px 20px rgba(0,0,0,.05)',
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white',
            border: `1.5px solid ${inputFocused ? '#2563eb' : '#e2e8f0'}`,
            borderRadius: 14, padding: '0.55rem 0.85rem',
            transition: 'all .2s',
            boxShadow: inputFocused ? '0 0 0 4px rgba(37,99,235,.1)' : '0 2px 8px rgba(0,0,0,.06)',
          }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message…"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: '#0f172a', fontSize: '0.9rem', fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 6, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            ><Smile size={18} /></button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
              background: inputText.trim()
                ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
                : '#f1f5f9',
              backgroundSize: '200% 200%',
              animation: inputText.trim() ? 'gradShift 4s ease infinite' : 'none',
              color: inputText.trim() ? 'white' : '#94a3b8',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: inputText.trim() ? '0 6px 18px rgba(37,99,235,.35)' : 'none',
              transition: 'all .2s cubic-bezier(.34,1.56,.64,1)',
              transform: inputText.trim() ? 'scale(1)' : 'scale(0.92)',
            }}
            onMouseEnter={e => { if (inputText.trim()) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(37,99,235,.45)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = inputText.trim() ? 'scale(1)' : 'scale(.92)'; e.currentTarget.style.boxShadow = inputText.trim() ? '0 6px 18px rgba(37,99,235,.35)' : 'none'; }}
          ><Send size={18} /></button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
          Press <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '0px 4px', fontSize: '0.65rem', color: '#64748b' }}>Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}