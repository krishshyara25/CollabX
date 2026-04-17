import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Users, MessageSquare, Palette, Timer, StickyNote, Video, Copy, ArrowLeft, Check, Zap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ping      { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
  @keyframes countUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  * { box-sizing:border-box; margin:0; padding:0; }
`;

const ACTIONS = [
  {
    title: 'Video Call',
    desc: 'Face-to-face team call',
    icon: Video,
    gradient: 'linear-gradient(135deg,#3b82f6,#2dd4bf)',
    glow: 'rgba(59,130,246,.3)',
    bg: '#eff6ff',
    key: 'video',
  },
  {
    title: 'Chat',
    desc: 'Real-time group messaging',
    icon: MessageSquare,
    gradient: 'linear-gradient(135deg,#10b981,#0891b2)',
    glow: 'rgba(16,185,129,.3)',
    bg: '#ecfdf5',
    key: 'chat',
  },
  {
    title: 'Whiteboard',
    desc: 'Draw & brainstorm together',
    icon: Palette,
    gradient: 'linear-gradient(135deg,#2563eb,#7c3aed)',
    glow: 'rgba(37,99,235,.3)',
    bg: '#eff6ff',
    key: 'whiteboard',
  },
  {
    title: 'Pomodoro Timer',
    desc: 'Focused study sessions',
    icon: Timer,
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    glow: 'rgba(245,158,11,.3)',
    bg: '#fffbeb',
    key: 'timer',
  },
  {
    title: 'Notes',
    desc: 'Shared collaborative notes',
    icon: StickyNote,
    gradient: 'linear-gradient(135deg,#a855f7,#ec4899)',
    glow: 'rgba(168,85,247,.3)',
    bg: '#faf5ff',
    key: 'notes',
  },
];

const AVATAR_COLORS = ['#2563eb','#7c3aed','#10b981','#f59e0b','#ef4444','#0891b2'];

const Orb = ({ style }) => (
  <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', filter:'blur(70px)', opacity:.5, ...style }} />
);

function SkeletonLine({ w = '100%', h = 14, mb = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, marginBottom: mb,
      background: 'linear-gradient(90deg,#f0f4ff 25%,#e8ecf5 50%,#f0f4ff 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

export default function StudyRoom() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const socket     = useSocket();
  const navigate   = useNavigate();

  const [roomData, setRoomData]     = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([user?.username || 'You']);
  const [copied, setCopied]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/rooms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoomData(data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();

    if (socket) {
      socket.emit('join_room', { roomId: id, username: user?.username });
      socket.on('room_users', (users) => setOnlineUsers(users));
      
      const handleIncomingCall = ({ callerName, targetUsers }) => {
        if (targetUsers.includes(user.username)) {
          toast.info(
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>📡 {callerName} invited you to a Video Call!</p>
              <button 
                  onClick={() => navigate(`/room/${id}/video?autoJoin=true`)}
                  style={{ marginTop: '10px', background: '#3b82f6', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
              >
                  Click to Join
              </button>
            </div>,
            { autoClose: 20000, position: 'top-center', closeOnClick: false }
          );
        }
      };

      socket.on('incoming_video_call', handleIncomingCall);
    }
    return () => { 
        if (socket) {
            socket.off('room_users'); 
            socket.off('incoming_video_call');
        }
    };
  }, [id, socket, user, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 60%,#eff6ff 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      {/* Ambient orbs */}
      <Orb style={{ width:600, height:600, top:'-20%', right:'-10%', background:'radial-gradient(circle,rgba(99,102,241,.15),transparent 70%)' }} />
      <Orb style={{ width:400, height:400, bottom:'-15%', left:'-8%',  background:'radial-gradient(circle,rgba(16,185,129,.12),transparent 70%)' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 2.5rem' }}>

        {/* ── TOPBAR ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'2.5rem', animation:'slideDown .5s cubic-bezier(.16,1,.3,1)',
          flexWrap:'wrap', gap:'1rem',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display:'flex', alignItems:'center', gap:6,
              background:'white', border:'1.5px solid #e2e8f0', borderRadius:10,
              padding:'0.5rem 1.1rem', fontWeight:600, fontSize:'0.85rem',
              color:'#64748b', cursor:'pointer', fontFamily:'inherit',
              transition:'all .2s', boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.color='#2563eb';e.currentTarget.style.transform='translateX(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';e.currentTarget.style.transform='translateX(0)';}}
          >
            <ArrowLeft size={15}/> Dashboard
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Live badge */}
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:999,
              padding:'0.3rem 0.85rem', fontSize:'0.75rem', fontWeight:600, color:'#16a34a',
            }}>
              <span style={{ position:'relative', display:'inline-flex' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'block' }} />
                <span style={{
                  position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e',
                  animation:'ping 1.5s ease-out infinite',
                }} />
              </span>
              Live Session
            </div>

            <button
              onClick={handleCopy}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background: copied ? '#f0fdf4' : 'white',
                border: `1.5px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                borderRadius:10, padding:'0.5rem 1.1rem',
                fontWeight:600, fontSize:'0.85rem',
                color: copied ? '#16a34a' : '#0f172a',
                cursor:'pointer', fontFamily:'inherit',
                transition:'all .25s', boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
              }}
            >
              {copied ? <><Check size={15}/> Copied!</> : <><Copy size={15}/> Copy Room ID</>}
            </button>
          </div>
        </div>

        {/* ── HERO HEADER ── */}
        <div style={{
          background:'rgba(255,255,255,0.8)', backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
          borderRadius:20, border:'1px solid rgba(255,255,255,0.7)',
          padding:'2rem 2.5rem', marginBottom:'2rem',
          boxShadow:'0 8px 32px rgba(37,99,235,.08)',
          animation:'fadeUp .5s cubic-bezier(.16,1,.3,1)',
          position:'relative', overflow:'hidden',
        }}>
          {/* top accent */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:3,
            background:'linear-gradient(90deg,#2563eb,#7c3aed,#10b981)',
            backgroundSize:'200% 200%', animation:'gradShift 4s ease infinite',
          }} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              {loading ? (
                <><SkeletonLine w={260} h={28} mb={10} /><SkeletonLine w={200} h={16} /></>
              ) : (
                <>
                  <h1 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'0.3rem', color:'#0f172a' }}>
                    {roomData?.name || 'Study Room'}
                  </h1>
                  <p style={{ color:'#64748b', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span>Created by <strong style={{color:'#0f172a'}}>{roomData?.creator?.username || 'Admin'}</strong></span>
                    <span style={{ color:'#cbd5e1' }}>•</span>
                    <span style={{ fontFamily:'monospace', background:'#f1f5f9', padding:'0.15rem 0.5rem', borderRadius:6, fontSize:'0.82rem', color:'#475569' }}>{id}</span>
                  </p>
                </>
              )}
            </div>

            {/* Stat pills */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:`${onlineUsers.length} Online`, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
                { label:`${roomData?.participants?.length || 1} Members`, color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
                { label: roomData?.createdAt ? new Date(roomData.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'Recent', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
              ].map((s,i) => (
                <div key={i} style={{
                  background:s.bg, border:`1px solid ${s.border}`, borderRadius:999,
                  padding:'0.3rem 0.9rem', fontSize:'0.78rem', fontWeight:600, color:s.color,
                  animation:`fadeUp .5s ${.1+i*.1}s cubic-bezier(.16,1,.3,1) both`,
                }}>{s.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.75rem', alignItems:'start' }}>

          {/* LEFT — Quick Actions */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem' }}>
              <Zap size={18} style={{ color:'#f59e0b' }} />
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#0f172a' }}>Quick Launch</h2>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1.1rem' }}>
              {ACTIONS.map((a, i) => {
                const Icon = a.icon;
                const isHovered = hoveredCard === i;
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/room/${id}/${a.key}`)}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: isHovered ? 'white' : 'rgba(255,255,255,0.85)',
                      backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
                      borderRadius:16, border:`1.5px solid ${isHovered ? 'rgba(37,99,235,.2)' : 'rgba(255,255,255,.7)'}`,
                      padding:'1.75rem 1.5rem', cursor:'pointer',
                      boxShadow: isHovered ? `0 20px 50px ${a.glow}, 0 4px 16px rgba(0,0,0,.06)` : '0 4px 16px rgba(0,0,0,.05)',
                      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                      transition:'all .3s cubic-bezier(.16,1,.3,1)',
                      animation:`fadeUp .5s ${i*.08}s cubic-bezier(.16,1,.3,1) both`,
                      position:'relative', overflow:'hidden',
                    }}
                  >
                    {/* Gradient top bar */}
                    <div style={{
                      position:'absolute', top:0, left:0, right:0, height:3,
                      background: a.gradient, opacity: isHovered ? 1 : 0,
                      transition:'opacity .3s',
                    }} />

                    {/* Icon */}
                    <div style={{
                      width:54, height:54, borderRadius:14,
                      background: isHovered ? a.gradient : a.bg,
                      backgroundSize:'200% 200%',
                      animation: isHovered ? 'gradShift 3s ease infinite' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      marginBottom:'1.1rem',
                      boxShadow: isHovered ? `0 8px 20px ${a.glow}` : 'none',
                      transition:'all .3s cubic-bezier(.34,1.56,.64,1)',
                      transform: isHovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
                    }}>
                      <Icon size={24} style={{ color: isHovered ? 'white' : a.gradient.match(/#\w{6}/)?.[0] }} />
                    </div>

                    <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a', marginBottom:'0.3rem' }}>{a.title}</h3>
                    <p style={{ fontSize:'0.82rem', color:'#64748b', lineHeight:1.5, marginBottom:'1rem' }}>{a.desc}</p>

                    <div style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      fontSize:'0.78rem', fontWeight:600,
                      color: isHovered ? '#2563eb' : '#94a3b8',
                      transition:'color .2s',
                    }}>
                      Open {a.title} →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Online Members */}
            <div style={{
              background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)',
              borderRadius:16, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.5rem', boxShadow:'0 4px 16px rgba(0,0,0,.05)',
              animation:'fadeUp .5s .15s cubic-bezier(.16,1,.3,1) both',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.1rem' }}>
                <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:7 }}>
                  <Users size={16} style={{color:'#2563eb'}}/> Online Now
                </h3>
                <span style={{
                  background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0',
                  borderRadius:999, padding:'0.15rem 0.6rem', fontSize:'0.72rem', fontWeight:700,
                }}>{onlineUsers.length}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {onlineUsers.slice(0,5).map((u, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, animation:`fadeUp .4s ${i*.07}s both` }}>
                    <div style={{ position:'relative' }}>
                      <div style={{
                        width:34, height:34, borderRadius:'50%',
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'0.75rem', fontWeight:700, color:'white', border:'2px solid white',
                        boxShadow:'0 2px 6px rgba(0,0,0,.12)',
                      }}>{(typeof u === 'string' ? u : u.username || 'U')[0].toUpperCase()}</div>
                      <span style={{
                        position:'absolute', bottom:0, right:0,
                        width:9, height:9, borderRadius:'50%',
                        background:'#22c55e', border:'1.5px solid white',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#0f172a' }}>
                        {typeof u === 'string' ? u : u.username}
                        {i === 0 && <span style={{ marginLeft:5, fontSize:'0.7rem', color:'#2563eb', fontWeight:600 }}>you</span>}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Active now</div>
                    </div>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <p style={{ fontSize:'0.78rem', color:'#94a3b8', textAlign:'center' }}>+{onlineUsers.length - 5} more members</p>
                )}
              </div>
            </div>

            {/* Room Info */}
            <div style={{
              background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)',
              borderRadius:16, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.5rem', boxShadow:'0 4px 16px rgba(0,0,0,.05)',
              animation:'fadeUp .5s .25s cubic-bezier(.16,1,.3,1) both',
            }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f172a', marginBottom:'1.1rem' }}>Room Info</h3>
              {loading ? (
                <><SkeletonLine w="70%" /><SkeletonLine w="55%" /><SkeletonLine w="65%" /></>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    ['Room ID', <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'#475569', background:'#f1f5f9', padding:'0.15rem 0.4rem', borderRadius:5 }}>{id}</span>],
                    ['Created', new Date(roomData?.createdAt || Date.now()).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })],
                    ['Participants', roomData?.participants?.length || 1],
                    ['Creator', roomData?.creator?.username || 'Admin'],
                  ].map(([k,v],i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:8, borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize:'0.8rem', color:'#94a3b8', fontWeight:500 }}>{k}</span>
                      <span style={{ fontSize:'0.82rem', color:'#0f172a', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invite Card */}
            <div style={{
              borderRadius:16, overflow:'hidden',
              animation:'fadeUp .5s .35s cubic-bezier(.16,1,.3,1) both',
              boxShadow:'0 8px 28px rgba(37,99,235,.18)',
            }}>
              <div style={{
                background:'linear-gradient(135deg,#2563eb,#7c3aed)',
                backgroundSize:'200% 200%', animation:'gradShift 6s ease infinite',
                padding:'1.5rem', position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:'-40%', right:'-20%', width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
                <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'white', marginBottom:'0.4rem' }}>Invite Friends</h3>
                <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,.75)', marginBottom:'1rem', lineHeight:1.5 }}>
                  Share the Room ID to start studying together
                </p>
                <div style={{
                  background:'rgba(255,255,255,0.15)', borderRadius:10,
                  padding:'0.65rem 0.85rem', fontFamily:'monospace',
                  fontSize:'0.78rem', color:'white', wordBreak:'break-all',
                  border:'1px solid rgba(255,255,255,.2)', marginBottom:'0.85rem',
                }}>{id}</div>
                <button
                  onClick={handleCopy}
                  style={{
                    width:'100%', padding:'0.6rem',
                    borderRadius:10, border:'none', cursor:'pointer',
                    background: copied ? 'rgba(255,255,255,0.25)' : 'white',
                    color: copied ? 'white' : '#2563eb',
                    fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit',
                    transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}
                >
                  {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy Room ID</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}