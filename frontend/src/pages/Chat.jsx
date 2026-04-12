import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';

const Chat = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomData, setRoomData] = useState(null);
  const messagesEndRef = useRef(null);

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
    const fetchMessages = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
        const { data } = await axios.get(`http://localhost:5000/api/messages/${id}`, config);
        setMessages(data);
      } catch(err) { console.error('Failed to grab prev chat', err) }
    };
    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomId: id, username: user.username });

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive_message');
      if (socket && user) {
        socket.emit('disconnect_from_room', { roomId: id, username: user.username });
      }
    };
  }, [socket, user, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    const messageData = {
      id: Date.now(),
      roomId: id,
      username: user.username,
      text: inputText,
      isSystem: false,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setInputText('');
  };

  if (!socket) return <div style={{ padding: '2rem' }}>Connecting to real-time sync...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/room/${id}`)} style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Back to Room
        </button>
        <h2 style={{ margin: 0 }}>Chat - {roomData?.name || `Room ${id}`}</h2>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', flex: 1 }}>
        <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Room Chat</h4>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.map((msg, i) => (
            <div key={msg._id || msg.id || i} style={{ 
              alignSelf: msg.isSystem ? 'center' : (msg.username === user.username ? 'flex-end' : 'flex-start'),
              background: msg.isSystem ? 'transparent' : (msg.username === user.username ? 'var(--primary)' : 'var(--bg-surface)'),
              padding: msg.isSystem ? '0.2rem' : '0.5rem 0.8rem',
              borderRadius: msg.isSystem ? '0' : '8px',
              maxWidth: '90%',
              opacity: msg.isSystem ? 0.6 : 1,
              fontSize: msg.isSystem ? '0.8rem' : '0.9rem'
            }}>
              {!msg.isSystem && <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem' }}>{msg.username}</div>}
              <div>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 1 }}
            placeholder="Type..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
