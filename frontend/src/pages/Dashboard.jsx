import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [meetingIdToJoin, setMeetingIdToJoin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // Create Room using Backend API
  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/rooms',
        { 
          name: `${user.username}'s Study Room`, 
          description: 'Collaborative study session',
          isPrivate: false 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Join socket room for real-time features
      if (socket) {
        socket.emit('join_room', { roomId: data._id, username: user.username });
      }

      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Join existing Room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const roomId = meetingIdToJoin.trim();
    
    if (!roomId) {
      setError("Please enter a room ID");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/rooms/${roomId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('join_room', { roomId, username: user.username });
      }

      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found or invalid code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1>Welcome, {user?.username}!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Create or join a study room to collaborate with others
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Create Room */}
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Plus size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
            <h2>Create Study Room</h2>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
              Start a new collaborative session
            </p>
            <button 
              onClick={handleCreateRoom}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1.1rem' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create New Room'}
            </button>
          </div>

          {/* Join Room */}
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Video size={48} color="var(--success)" style={{ marginBottom: '1.5rem' }} />
            <h2>Join Study Room</h2>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0 1.5rem' }}>
              Enter room ID to join
            </p>
            
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                className="input-field"
                placeholder="Room ID"
                value={meetingIdToJoin}
                onChange={(e) => setMeetingIdToJoin(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit"
                className="btn btn-outline"
                style={{ 
                  width: '100%', 
                  padding: '1.1rem', 
                  marginTop: '1rem',
                  color: 'var(--success)', 
                  borderColor: 'var(--success)' 
                }}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </form>

            {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;