import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import axios from 'axios';

const PomodoroTimer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro');
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/rooms/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRoomData(data);
      } catch (error) {
        console.error('Error fetching room:', error);
        navigate(`/room/${id}`);
      }
    };
    fetchRoom();
  }, [id, navigate]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomId: id, username: user.username });

    socket.on('receive_timer_update', (data) => {
      setTimeLeft(data.timeLeft);
      setIsActive(data.isActive);
      setMode(data.mode);
    });

    return () => {
      socket.off('receive_timer_update');
      if (socket && user) {
        socket.emit('disconnect_from_room', { roomId: id, username: user.username });
      }
    };
  }, [socket, user, id]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const broadcastState = (newState) => {
    if (socket) {
      socket.emit('timer_update', { roomId: id, ...newState });
    }
  }

  const toggleTimer = () => {
    const newState = { timeLeft, isActive: !isActive, mode };
    setIsActive(!isActive);
    broadcastState(newState);
  };

  const resetTimer = () => {
    const newTime = mode === 'pomodoro' ? 25 * 60 : 5 * 60;
    const newState = { timeLeft: newTime, isActive: false, mode };
    setTimeLeft(newTime);
    setIsActive(false);
    broadcastState(newState);
  };

  const switchMode = (newMode) => {
    const newTime = newMode === 'pomodoro' ? 25 * 60 : 5 * 60;
    const newState = { timeLeft: newTime, isActive: false, mode: newMode };
    setMode(newMode);
    setTimeLeft(newTime);
    setIsActive(false);
    broadcastState(newState);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!socket) return <div style={{ padding: '2rem' }}>Connecting to real-time sync...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/room/${id}`)} style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Back to Room
        </button>
        <h2 style={{ margin: 0 }}>Pomodoro Timer - {roomData?.name || `Room ${id}`}</h2>
      </div>

      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <button 
            className={`btn ${mode === 'pomodoro' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
            onClick={() => switchMode('pomodoro')}
          >
            Pomodoro
          </button>
          <button 
            className={`btn ${mode === 'shortBreak' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
            onClick={() => switchMode('shortBreak')}
          >
            Break
          </button>
        </div>

        <div style={{ fontSize: '6rem', fontWeight: 700, margin: '2rem 0', fontFamily: 'monospace', color: 'var(--primary)' }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
          <button onClick={toggleTimer} className="btn btn-primary" style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}>
            {isActive ? <Pause /> : <Play />}
          </button>
          <button onClick={resetTimer} className="btn btn-outline" style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}>
            <RotateCcw />
          </button>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {mode === 'pomodoro' ? 'Focus time: 25 minutes' : 'Break time: 5 minutes'}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
