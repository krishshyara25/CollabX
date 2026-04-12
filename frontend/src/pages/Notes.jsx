import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Save, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

const Notes = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
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

    return () => {
      if (socket && user) {
        socket.emit('disconnect_from_room', { roomId: id, username: user.username });
      }
    };
  }, [socket, user, id]);

  useEffect(() => {
    fetchNotes();
  }, [id]);

  const fetchNotes = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
      const { data } = await axios.get(`http://localhost:5000/api/notes/${id}`, config);
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if(!content.trim()) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
      await axios.post(`http://localhost:5000/api/notes/${id}`, { content }, config);
      setContent('');
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
      await axios.delete(`http://localhost:5000/api/notes/item/${noteId}`, config);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  if (!socket) return <div style={{ padding: '2rem' }}>Connecting to real-time sync...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/room/${id}`)} style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Back to Room
        </button>
        <h2 style={{ margin: 0 }}>Notes - {roomData?.name || `Room ${id}`}</h2>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
        <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Edit size={16} /> Private Notes
        </h4>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes.map(n => (
            <div key={n._id} style={{ 
              background: 'var(--bg-surface-hover)', 
              padding: '1rem', 
              borderRadius: '8px', 
              position: 'relative',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-main)', paddingRight: '2rem', margin: 0, lineHeight: '1.5' }}>
                {n.content}
              </p>
              <div style={{ 
                position: 'absolute', 
                top: '0.5rem', 
                right: '0.5rem', 
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button 
                  onClick={() => deleteNote(n._id)} 
                  className="btn btn-outline" 
                  style={{ padding: '0.3rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--text-muted)',
              fontSize: '1rem'
            }}>
              No private notes for this room yet. Start by adding your first note below!
            </div>
          )}
        </div>

        <form onSubmit={addNote} style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ flex: 1, fontSize: '1rem' }} 
            placeholder="Jot something down..." 
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 1.5rem' }} 
            title="Save Note"
          >
            <Save size={18} /> Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default Notes;
