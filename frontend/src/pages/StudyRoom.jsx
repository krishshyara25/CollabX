// pages/StudyRoom.jsx  →  Replace your current StudyRoom with this improved version

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Users, MessageSquare, Palette, Timer, StickyNote, Video, Copy, ArrowRight } from 'lucide-react';
import axios from 'axios';

const StudyRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/rooms/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoomData(data);
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };

    fetchRoom();

    if (socket) {
      socket.emit('join_room', { roomId: id, username: user.username });
    }
  }, [id, socket, user, navigate]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(id);
    alert("Room ID copied to clipboard!");
  };

  const quickActions = [
    { 
      title: "Chat", 
      icon: <MessageSquare size={28} />, 
      color: "#22c55e", 
      path: `/room/${id}/chat` 
    },
    { 
      title: "Whiteboard", 
      icon: <Palette size={28} />, 
      color: "#3b82f6", 
      path: `/room/${id}/whiteboard` 
    },
    { 
      title: "Pomodoro Timer", 
      icon: <Timer size={28} />, 
      color: "#eab308", 
      path: `/room/${id}/timer` 
    },
    { 
      title: "Notes", 
      icon: <StickyNote size={28} />, 
      color: "#a855f7", 
      path: `/room/${id}/notes` 
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{roomData?.name || "Study Room"}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Created by {roomData?.creator?.username || "Admin"} • Room ID: <strong>{id}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={copyRoomId} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Copy size={18} /> Copy Room ID
          </button>
          <button onClick={() => navigate('/')} className="btn btn-outline">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

        {/* Quick Actions */}
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Quick Start</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                onClick={() => navigate(action.path)}
                className="glass-card"
                style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ color: action.color, marginBottom: '1rem' }}>
                  {action.icon}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{action.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Click to open <ArrowRight size={16} style={{ verticalAlign: 'middle' }} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Online Members */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Online Now
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {onlineUsers.length || 1} member{onlineUsers.length !== 1 ? 's' : ''} online
            </p>
            {/* You can enhance this later with real online list */}
          </div>

          {/* Room Info */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3>Room Information</h3>
            <div style={{ marginTop: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p><strong>ID:</strong> {id}</p>
              <p><strong>Created:</strong> {roomData?.createdAt ? new Date(roomData.createdAt).toLocaleDateString() : 'Recently'}</p>
              <p><strong>Participants:</strong> {roomData?.participants?.length || 1}</p>
            </div>
          </div>

          {/* Quick Invite */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3>Invite Friends</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.8rem 0' }}>
              Share this room ID with your friends
            </p>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;