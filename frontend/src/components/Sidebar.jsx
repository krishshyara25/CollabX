import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { BookOpen, Home, MessageSquare, Palette, Timer, StickyNote, LogOut, Layers, Calendar, User, Shield, CalendarDays, Video } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentRoomId, setCurrentRoomId] = useState(null);

  useEffect(() => {
    if (socket && user) {
      const handleIncomingCall = ({ callerName, targetUsers, roomId }) => {
        if (targetUsers.includes(user.username)) {
          toast.info(
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>📡 {callerName} invited you to a Video Call!</p>
              <button 
                  onClick={() => { navigate(`/room/${currentRoomId || roomId}/video?autoJoin=true`); toast.dismiss(); }}
                  style={{ marginTop: '10px', background: '#3b82f6', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
              >
                  Join Call
              </button>
            </div>,
            { autoClose: 20000, position: 'top-center', closeOnClick: false }
          );
        }
      };

      socket.on('incoming_video_call', handleIncomingCall);

      return () => {
        socket.off('incoming_video_call', handleIncomingCall);
      };
    }
  }, [socket, user, navigate, currentRoomId]);

  useEffect(() => {
    const path = location.pathname;
    const match = path.match(/\/room\/([^\/]+)/);

    if (match && match[1]) {
      setCurrentRoomId(match[1]);
    } else {
      setCurrentRoomId(null);
    }
  }, [location.pathname]);

  // Show sidebar if user is logged in AND we are inside a room
  if (!user || !currentRoomId) {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <BookOpen size={24} color="var(--primary)" />
        CollabX
      </div>

      <div className="sidebar-nav">
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          padding: '0.75rem 1rem 0.25rem',
          fontWeight: 500
        }}>
          Room: {currentRoomId}
        </div>

        {/* Main Room Home */}
        <NavLink
          to={`/room/${currentRoomId}`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={20} /> Room Home
        </NavLink>

        {/* Features */}
        <NavLink
          to={`/room/${currentRoomId}/chat`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={20} /> Chat
        </NavLink>

        <NavLink
          to={`/room/${currentRoomId}/video`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Video size={20} /> Video Call
        </NavLink>

        <NavLink
          to={`/room/${currentRoomId}/whiteboard`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Palette size={20} /> Whiteboard
        </NavLink>

        <NavLink
          to={`/room/${currentRoomId}/timer`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Timer size={20} /> Pomodoro Timer
        </NavLink>

        <NavLink
          to={`/room/${currentRoomId}/notes`}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <StickyNote size={20} /> Notes
        </NavLink>

        <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-color)' }}></div>

        {/* Global Features */}
        <NavLink to="/flashcards" className="nav-item">
          <Layers size={20} /> Flashcards
        </NavLink>

        <NavLink to="/scheduler" className="nav-item">
          <Calendar size={20} /> Scheduler
        </NavLink>

        <NavLink to="/calendar" className="nav-item">
          <CalendarDays size={20} /> Study Calendar
        </NavLink>

        <NavLink to="/profile" className="nav-item">
          <User size={20} /> Profile
        </NavLink>

        {user.role === 'admin' && (
          <NavLink to="/admin" className="nav-item">
            <Shield size={20} /> Admin Panel
          </NavLink>
        )}
      </div>

      <div style={{
        padding: '1.5rem 1rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        <button
          onClick={logout}
          className="nav-item"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--danger)'
          }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;