import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Video, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [myRooms, setMyRooms] = useState([]);
  const [meetingIdToJoin, setMeetingIdToJoin] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { user, logout } = useAuth();        // ← Added logout from context
  const socket = useSocket();
  const navigate = useNavigate();

  // Fetch user's created rooms
  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/rooms/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRooms(data);
    } catch (err) {
      console.error('Failed to fetch my rooms', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyRooms();
    }
  }, [user]);

  // Create New Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("Please enter a room name");
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/rooms',
        { 
          name: roomName.trim(), 
          description: 'Collaborative study session',
          isPrivate: false 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('join_room', { roomId: data._id, username: user.username });
      }

      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
      setRoomName('');
    }
  };

  // Join by ID
  const handleJoinById = async (e) => {
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
      setError(err.response?.data?.message || 'Room not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  // Join one of my created rooms
  const handleJoinMyRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', { roomId, username: user.username });
    }
    navigate(`/room/${roomId}`);
  };

  // Leave Room
  const handleLeaveRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to leave this room?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/rooms/${roomId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchMyRooms(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave room');
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Welcome, {user?.username}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your study rooms and collaborate</p>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.6rem 1.2rem',
            color: 'var(--danger)',
            borderColor: 'var(--danger)'
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Left Column: Create Room + My Rooms */}
        <div>
          {/* Create New Room */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Study Room</h2>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                className="input-field"
                placeholder="Room Name (e.g. Physics Final Prep)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>

          {/* My Created Rooms */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>My Created Rooms</h3>
            
            {myRooms.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                No rooms created yet. Create one above!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myRooms.map(room => (
                  <div 
                    key={room._id}
                    className="glass-card" 
                    style={{ 
                      padding: '1.2rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 0.3rem 0' }}>{room.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {room.participants?.length || 1} members
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleJoinMyRoom(room._id)}
                      >
                        Open
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.5rem 0.8rem' }}
                        onClick={() => handleLeaveRoom(room._id)}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Join by ID */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Join Room by ID</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Enter a room code shared by someone
          </p>

          <form onSubmit={handleJoinById}>
            <input
              type="text"
              className="input-field"
              placeholder="Enter Room ID"
              value={meetingIdToJoin}
              onChange={(e) => setMeetingIdToJoin(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <button 
              type="submit"
              className="btn btn-outline"
              style={{ width: '100%', padding: '1rem', color: 'var(--success)', borderColor: 'var(--success)' }}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>

          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;