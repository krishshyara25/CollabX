import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, LogOut, ArrowRight, BookOpen, Zap, Clock, Hash, Trash2, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes ping      { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  * { box-sizing:border-box; margin:0; padding:0; }
  input::placeholder { color:#94a3b8; }
  input:focus { outline:none; }
  @media(max-width:860px) { .dash-grid{grid-template-columns:1fr !important;} }
`;

const AVATAR_COLORS = ['#2563eb','#7c3aed','#10b981','#f59e0b','#ef4444','#0891b2','#ec4899'];
const ROOM_GRADIENTS = [
  'linear-gradient(135deg,#2563eb,#7c3aed)',
  'linear-gradient(135deg,#10b981,#0891b2)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#0891b2,#2563eb)',
  'linear-gradient(135deg,#22c55e,#14b8a6)',
];

const Orb = ({ style }) => (
  <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', filter:'blur(70px)', opacity:.5, ...style }} />
);

function SkeletonCard() {
  return (
    <div style={{
      background:'white', borderRadius:14, padding:'1.25rem',
      border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:10,
    }}>
      {[['70%',16],['45%',12],['55%',12]].map(([w,h],i) => (
        <div key={i} style={{
          width:w, height:h, borderRadius:6,
          background:'linear-gradient(90deg,#f0f4ff 25%,#e8ecf5 50%,#f0f4ff 75%)',
          backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite',
        }} />
      ))}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.45)',
      backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:999, animation:'fadeUp .2s ease',
    }}>
      <div style={{
        background:'white', borderRadius:20, padding:'2rem', maxWidth:380, width:'90%',
        boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'scaleIn .2s cubic-bezier(.16,1,.3,1)',
        border:'1px solid #e2e8f0',
      }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
          <Trash2 size={22} style={{ color:'#ef4444' }} />
        </div>
        <h3 style={{ textAlign:'center', fontSize:'1rem', fontWeight:700, color:'#0f172a', marginBottom:'0.5rem' }}>Leave Room?</h3>
        <p style={{ textAlign:'center', fontSize:'0.85rem', color:'#64748b', marginBottom:'1.5rem', lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:'0.65rem', borderRadius:10, border:'1.5px solid #e2e8f0',
            background:'white', color:'#64748b', fontWeight:600, fontSize:'0.875rem',
            cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f8fafc';}}
            onMouseLeave={e=>{e.currentTarget.style.background='white';}}
          >Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:'0.65rem', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,#ef4444,#dc2626)',
            color:'white', fontWeight:700, fontSize:'0.875rem',
            cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 4px 14px rgba(239,68,68,.3)', transition:'all .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 20px rgba(239,68,68,.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 14px rgba(239,68,68,.3)';}}
          >Leave</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [myRooms, setMyRooms]               = useState([]);
  const [meetingIdToJoin, setMeetingIdToJoin] = useState('');
  const [roomName, setRoomName]             = useState('');
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [creating, setCreating]             = useState(false);
  const [fetching, setFetching]             = useState(true);
  const [confirmLeave, setConfirmLeave]     = useState(null);
  const [joinFocused, setJoinFocused]       = useState(false);
  const [createFocused, setCreateFocused]   = useState(false);
  const [hoveredRoom, setHoveredRoom]       = useState(null);

  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/rooms/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (user) fetchMyRooms(); }, [user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) { setError('Please enter a room name'); return; }
    setCreating(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/rooms',
        { name: roomName.trim(), description: 'Collaborative study session', isPrivate: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (socket) socket.emit('join_room', { roomId: data._id, username: user.username });
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false); setRoomName('');
    }
  };

  const handleJoinById = async (e) => {
    e.preventDefault();
    const roomId = meetingIdToJoin.trim();
    if (!roomId) { setError('Please enter a room ID'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (socket) socket.emit('join_room', { roomId, username: user.username });
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found or invalid ID');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMyRoom = (roomId) => {
    if (socket) socket.emit('join_room', { roomId, username: user.username });
    navigate(`/room/${roomId}`);
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/leave`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchMyRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave room');
    } finally {
      setConfirmLeave(null);
    }
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 60%,#eff6ff 100%)',
      fontFamily:'Inter, sans-serif', position:'relative', overflow:'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      {confirmLeave && (
        <ConfirmModal
          message="You'll need the Room ID to rejoin later."
          onConfirm={() => handleLeaveRoom(confirmLeave)}
          onCancel={() => setConfirmLeave(null)}
        />
      )}

      <Orb style={{ width:600, height:600, top:'-20%', right:'-10%', background:'radial-gradient(circle,rgba(99,102,241,.15),transparent 70%)' }} />
      <Orb style={{ width:400, height:400, bottom:'-15%', left:'-8%',  background:'radial-gradient(circle,rgba(16,185,129,.12),transparent 70%)' }} />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'2rem 2.5rem' }}>

        {/* ── TOPBAR ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'2.5rem', animation:'slideDown .5s cubic-bezier(.16,1,.3,1)',
          flexWrap:'wrap', gap:'1rem',
        }}>
          {/* Logo */}
          <div style={{
            fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.04em',
            background:'linear-gradient(135deg,#14b8a6,#0ea5e9)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>CollabX</div>

          {/* User + Logout */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:38, height:38, borderRadius:'50%',
                background: AVATAR_COLORS[user?.username?.charCodeAt(0) % AVATAR_COLORS.length] || '#2563eb',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:700, fontSize:'0.85rem',
                border:'2px solid white', boxShadow:'0 2px 8px rgba(0,0,0,.12)',
              }}>{(user?.username?.[0] || 'U').toUpperCase()}</div>
              <div>
                <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#0f172a' }}>{user?.username}</div>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'white', border:'1.5px solid #fecaca', borderRadius:10,
                padding:'0.5rem 1rem', fontWeight:600, fontSize:'0.82rem', color:'#ef4444',
                cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
                boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.transform='translateY(0)';}}
            ><LogOut size={14}/> Logout</button>
          </div>
        </div>

        {/* ── WELCOME HERO ── */}
        <div style={{
          background:'rgba(255,255,255,0.85)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderRadius:20, border:'1px solid rgba(255,255,255,.7)',
          padding:'2rem 2.5rem', marginBottom:'2rem',
          boxShadow:'0 8px 32px rgba(37,99,235,.08)',
          animation:'fadeUp .5s cubic-bezier(.16,1,.3,1)',
          position:'relative', overflow:'hidden',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#2563eb,#7c3aed,#10b981)', backgroundSize:'200% 200%', animation:'gradShift 4s ease infinite' }} />

          <div>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.3rem' }}>{greet()}</p>
            <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-0.03em', color:'#0f172a', marginBottom:'0.3rem' }}>
              Welcome back, <span style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{user?.username}</span>!
            </h1>
            <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Ready to collaborate? Create a room or join one below.</p>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              { label:'My Rooms', value: myRooms.length, color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
              { label:'Status', value:'Online', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
              { label:'Calendar', value:'View', color:'#d946ef', bg:'#fdf4ff', border:'#fbcfe8', isLink:true, path:'/calendar' },
            ].map((s,i) => (
              <div key={i} style={{
                background:s.bg, border:`1px solid ${s.border}`,
                borderRadius:12, padding:'0.65rem 1.1rem', textAlign:'center',
                animation:`fadeUp .4s ${.1+i*.1}s both`,
                cursor: s.isLink ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={() => s.isLink && navigate(s.path)}
              onMouseEnter={e => { if (s.isLink) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 70, 239, 0.2)'; } }}
              onMouseLeave={e => { if (s.isLink) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:s.color, lineHeight:1, display:'flex', justifyContent:'center' }}>
                    {s.isLink ? <CalendarIcon size={24} style={{ marginBottom: '-2px' }} /> : s.value}
                </div>
                <div style={{ fontSize:'0.72rem', color:s.color, fontWeight:500, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="dash-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.75rem', alignItems:'start' }}>

          {/* LEFT COL */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Create Room Card */}
            <div style={{
              background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              borderRadius:18, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,.06)',
              animation:'fadeUp .5s .1s cubic-bezier(.16,1,.3,1) both',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#2563eb,#7c3aed)', backgroundSize:'200% 200%', animation:'gradShift 4s ease infinite' }} />

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.25rem' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Plus size={20} style={{ color:'#2563eb' }} />
                </div>
                <div>
                  <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Create Study Room</h2>
                  <p style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Start a new collaboration session</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                <input
                  type="text"
                  placeholder="Room name (e.g. Physics Final Prep)"
                  value={roomName}
                  onChange={e => { setRoomName(e.target.value); setError(''); }}
                  onFocus={() => setCreateFocused(true)}
                  onBlur={() => setCreateFocused(false)}
                  style={{
                    width:'100%', padding:'0.75rem 1rem', borderRadius:10,
                    border:`1.5px solid ${createFocused ? '#2563eb' : '#e2e8f0'}`,
                    background:'white', color:'#0f172a', fontSize:'0.9rem',
                    fontFamily:'inherit', transition:'all .2s',
                    boxShadow: createFocused ? '0 0 0 4px rgba(37,99,235,.1)' : 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    width:'100%', padding:'0.8rem',
                    borderRadius:10, border:'none',
                    background: creating ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
                    backgroundSize:'200% 200%',
                    animation: creating ? 'none' : 'gradShift 4s ease infinite',
                    color:'white', fontWeight:700, fontSize:'0.9rem',
                    fontFamily:'inherit', cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: creating ? 'none' : '0 6px 20px rgba(37,99,235,.35)',
                    transition:'transform .2s, box-shadow .2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  }}
                  onMouseEnter={e=>{ if(!creating){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(37,99,235,.45)';}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=creating?'none':'0 6px 20px rgba(37,99,235,.35)';}}
                >
                  {creating ? (
                    <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Creating...</>
                  ) : (
                    <><Plus size={16}/> Create Room</>
                  )}
                </button>
              </form>
            </div>

            {/* My Rooms */}
            <div style={{
              background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              borderRadius:18, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,.06)',
              animation:'fadeUp .5s .2s cubic-bezier(.16,1,.3,1) both',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <BookOpen size={17} style={{ color:'#7c3aed' }} />
                  <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>My Rooms</h3>
                </div>
                <span style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe', borderRadius:999, padding:'0.15rem 0.65rem', fontSize:'0.72rem', fontWeight:700 }}>
                  {myRooms.length}
                </span>
              </div>

              {fetching ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[1,2].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : myRooms.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
                  <div style={{ fontSize:36, marginBottom:'0.75rem' }}>📚</div>
                  <p style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.6 }}>No rooms yet. Create your first room above!</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {myRooms.map((room, i) => {
                    const isHovered = hoveredRoom === room._id;
                    const gradient = ROOM_GRADIENTS[i % ROOM_GRADIENTS.length];
                    return (
                      <div
                        key={room._id}
                        onMouseEnter={() => setHoveredRoom(room._id)}
                        onMouseLeave={() => setHoveredRoom(null)}
                        style={{
                          background: isHovered ? 'white' : '#fafbfc',
                          border:`1.5px solid ${isHovered ? 'rgba(37,99,235,.2)' : '#f1f5f9'}`,
                          borderRadius:14, padding:'1.1rem 1.25rem',
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          transition:'all .25s cubic-bezier(.16,1,.3,1)',
                          boxShadow: isHovered ? '0 8px 24px rgba(37,99,235,.1)' : 'none',
                          animation:`fadeUp .4s ${i*.07}s both`,
                          cursor:'default',
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{
                            width:40, height:40, borderRadius:10, flexShrink:0,
                            background: gradient, backgroundSize:'200% 200%',
                            animation:'gradShift 5s ease infinite',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'1rem', fontWeight:700, color:'white',
                            boxShadow:'0 4px 12px rgba(0,0,0,.15)',
                          }}>{room.name?.[0]?.toUpperCase() || 'R'}</div>
                          <div>
                            <h4 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f172a', marginBottom:2 }}>{room.name}</h4>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <Users size={11} style={{ color:'#94a3b8' }} />
                              <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{room.participants?.length || 1} members</span>
                              <span style={{ color:'#e2e8f0' }}>•</span>
                              <Clock size={11} style={{ color:'#94a3b8' }} />
                              <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                                {room.createdAt ? new Date(room.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'Recent'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                          <button
                            onClick={() => handleJoinMyRoom(room._id)}
                            style={{
                              padding:'0.45rem 1rem', borderRadius:8, border:'none',
                              background:'linear-gradient(135deg,#2563eb,#7c3aed)',
                              color:'white', fontWeight:600, fontSize:'0.78rem',
                              cursor:'pointer', fontFamily:'inherit',
                              transition:'all .2s', boxShadow:'0 3px 10px rgba(37,99,235,.3)',
                              display:'flex', alignItems:'center', gap:5,
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(37,99,235,.4)';}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 3px 10px rgba(37,99,235,.3)';}}
                          >Open <ArrowRight size={13}/></button>
                          <button
                            onClick={() => setConfirmLeave(room._id)}
                            style={{
                              padding:'0.45rem 0.7rem', borderRadius:8,
                              border:'1.5px solid #fecaca', background:'white',
                              color:'#ef4444', cursor:'pointer', fontFamily:'inherit',
                              transition:'all .2s', display:'flex', alignItems:'center',
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.transform='translateY(-1px)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.transform='translateY(0)';}}
                          ><Trash2 size={14}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Join by ID */}
            <div style={{
              background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              borderRadius:18, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.75rem', boxShadow:'0 4px 20px rgba(0,0,0,.06)',
              animation:'fadeUp .5s .15s cubic-bezier(.16,1,.3,1) both',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#10b981,#0891b2)', backgroundSize:'200% 200%', animation:'gradShift 4s ease infinite' }} />

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.25rem' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Hash size={20} style={{ color:'#10b981' }} />
                </div>
                <div>
                  <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Join by Room ID</h2>
                  <p style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Enter a code shared by a friend</p>
                </div>
              </div>

              <form onSubmit={handleJoinById} style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                <input
                  type="text"
                  placeholder="Paste Room ID here..."
                  value={meetingIdToJoin}
                  onChange={e => { setMeetingIdToJoin(e.target.value); setError(''); }}
                  onFocus={() => setJoinFocused(true)}
                  onBlur={() => setJoinFocused(false)}
                  style={{
                    width:'100%', padding:'0.75rem 1rem', borderRadius:10,
                    border:`1.5px solid ${joinFocused ? '#10b981' : error ? '#fca5a5' : '#e2e8f0'}`,
                    background:'white', color:'#0f172a', fontSize:'0.9rem',
                    fontFamily:'monospace', transition:'all .2s',
                    boxShadow: joinFocused ? '0 0 0 4px rgba(16,185,129,.1)' : 'none',
                  }}
                />

                {error && (
                  <div style={{
                    background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9,
                    padding:'0.6rem 0.9rem', display:'flex', alignItems:'center', gap:7,
                    animation:'slideIn .25s ease',
                  }}>
                    <X size={14} style={{ color:'#ef4444', flexShrink:0 }} />
                    <span style={{ color:'#dc2626', fontSize:'0.82rem', fontWeight:500 }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width:'100%', padding:'0.8rem', borderRadius:10, border:'none',
                    background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#0891b2)',
                    backgroundSize:'200% 200%',
                    animation: loading ? 'none' : 'gradShift 4s ease infinite',
                    color:'white', fontWeight:700, fontSize:'0.9rem',
                    fontFamily:'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,.35)',
                    transition:'transform .2s, box-shadow .2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  }}
                  onMouseEnter={e=>{ if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(16,185,129,.45)';}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=loading?'none':'0 6px 20px rgba(16,185,129,.35)';}}
                >
                  {loading ? (
                    <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Joining...</>
                  ) : (
                    <>Join Room <ArrowRight size={16}/></>
                  )}
                </button>
              </form>
            </div>

            {/* Tips Card */}
            <div style={{
              borderRadius:18, overflow:'hidden',
              boxShadow:'0 8px 28px rgba(37,99,235,.15)',
              animation:'fadeUp .5s .3s cubic-bezier(.16,1,.3,1) both',
            }}>
              <div style={{
                background:'linear-gradient(135deg,#2563eb,#7c3aed)',
                backgroundSize:'200% 200%', animation:'gradShift 6s ease infinite',
                padding:'1.75rem', position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:'-40%', right:'-20%', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem', position:'relative', zIndex:1 }}>
                  <Zap size={18} style={{ color:'#fbbf24' }} />
                  <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'white' }}>Quick Tips</h3>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, position:'relative', zIndex:1 }}>
                  {[
                    'Share your Room ID with friends to let them join instantly',
                    'Use the Pomodoro timer to stay focused during long sessions',
                    'Export your whiteboard as an image to save your work',
                  ].map((tip, i) => (
                    <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                      <div style={{
                        width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,.2)',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1,
                        fontSize:'0.65rem', fontWeight:800, color:'white',
                      }}>{i + 1}</div>
                      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,.85)', lineHeight:1.55 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}