import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Trash2, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Whiteboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isWhiteboardLocked, setIsWhiteboardLocked] = useState(false);
  const [roomData, setRoomData] = useState(null);
  
  const isCreator = roomData && (String(user._id) === String(roomData.creator._id || roomData.creator) || user.role === 'admin');

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
    const canvas = canvasRef.current;
    
    const initCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth || 800;
      canvas.height = canvas.parentElement.offsetHeight || 500;

      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.strokeStyle = '#f8fafc';
      context.lineWidth = 3;
      contextRef.current = context;
      
      fetchState(context);
    };

    const fetchState = async (context) => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }};
        const { data } = await axios.get(`http://localhost:5000/api/whiteboard/${id}`, config);
        if (data && data.dataURL) {
          const image = new Image();
          image.onload = () => { context.drawImage(image, 0, 0); };
          image.src = data.dataURL;
        }
      } catch(e) { console.error("Whiteboard load err", e) }
    }
    
    setTimeout(initCanvas, 100);
  }, [id]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomId: id, username: user.username });

    socket.on('draw_receive', (data) => {
      const { x0, y0, x1, y1, color } = data;
      const context = contextRef.current;
      context.strokeStyle = color || '#f8fafc';
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.stroke();
      context.closePath();
      context.strokeStyle = '#f8fafc';
    });

    socket.on('clear_whiteboard_receive', () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('whiteboard_lock_status', (status) => {
      setIsWhiteboardLocked(status);
    });

    return () => {
      socket.off('draw_receive');
      socket.off('clear_whiteboard_receive');
      socket.off('whiteboard_lock_status');
      if (socket && user) {
        socket.emit('disconnect_from_room', { roomId: id, username: user.username });
      }
    };
  }, [socket, user, id]);

  const startDrawing = ({ nativeEvent }) => {
    if (isWhiteboardLocked && !isCreator) {
      toast.error("Whiteboard is locked by the creator.");
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    if (socket) {
      socket.emit('save_whiteboard', { roomId: id, dataURL: canvasRef.current.toDataURL() });
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    const x0 = contextRef.current.lastX || offsetX;
    const y0 = contextRef.current.lastY || offsetY;

    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    if (socket) {
      socket.emit('draw_event', {
        roomId: id,
        x0,
        y0,
        x1: offsetX,
        y1: offsetY,
      });
    }

    contextRef.current.lastX = offsetX;
    contextRef.current.lastY = offsetY;
  };
  
  const resetPosition = () => {
    contextRef.current.lastX = undefined;
    contextRef.current.lastY = undefined;
    finishDrawing();
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('clear_whiteboard', id);
    }
  };

  const toggleWhiteboardLock = () => {
    if (user._id !== roomData?.creator && user.role !== 'admin') return;
    
    const newState = !isWhiteboardLocked;
    setIsWhiteboardLocked(newState);
    if (socket) {
      socket.emit('whiteboard_toggle_lock', { roomId: id, isLocked: newState });
    }
  };

  if (!socket) return <div style={{ padding: '2rem' }}>Connecting to real-time sync...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/room/${id}`)} style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Back to Room
        </button>
        <h2 style={{ margin: 0 }}>Whiteboard - {roomData?.name || `Room ${id}`}</h2>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isCreator && (
            <button className={`btn ${isWhiteboardLocked ? 'btn-danger' : 'btn-outline'}`} onClick={toggleWhiteboardLock}>
              {isWhiteboardLocked ? <Lock size={16} /> : <Unlock size={16} />} 
              {isWhiteboardLocked ? 'Board Locked' : 'Lock Board'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Shared Whiteboard</h4>
          <button onClick={clearCanvas} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} title="Clear Canvas">
            <Trash2 size={16} />
          </button>
        </div>
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          height: '100%', 
          minHeight: '500px', 
          cursor: (isWhiteboardLocked && !isCreator) ? 'not-allowed' : 'crosshair',
          position: 'relative'
        }}>
          {isWhiteboardLocked && !isCreator && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              zIndex: 10, 
              background: 'rgba(255,255,255,0.1)', 
              pointerEvents: 'none', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              fontWeight: 'bold', 
              border: '2px dashed var(--danger)',
              color: 'var(--danger)'
            }}>
              Whiteboard Locked
            </div>
          )}
          <canvas
            onMouseDown={startDrawing}
            onMouseUp={resetPosition}
            onMouseOut={resetPosition}
            onMouseMove={draw}
            ref={canvasRef}
            style={{ touchAction: 'none', width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
