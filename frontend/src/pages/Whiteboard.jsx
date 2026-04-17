import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  ArrowLeft, Trash2, Lock, Unlock, Square, Circle, 
  Minus, Eraser, Paintbrush, Download, Save, ShieldAlert 
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Whiteboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isInitializedRef = useRef(false);
  const containerRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isWhiteboardLocked, setIsWhiteboardLocked] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tool states
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#3b82f6'); // Default to a nice primary blue
  const [lineWidth, setLineWidth] = useState(4);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const isCreator = roomData && 
    (String(user?._id) === String(roomData.creator?._id || roomData.creator) || user?.role === 'admin');

  // Fetch room data
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

  // ====================== CANVAS INITIALIZATION ======================
  const initializeCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const parent = containerRef.current;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    contextRef.current = ctx;
    isInitializedRef.current = true;

    // Load saved state
    try {
      const { data } = await axios.get(`http://localhost:5000/api/whiteboard/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (data?.dataURL) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = data.dataURL;
      }
    } catch (e) {
      console.error("No previous board state found.");
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(initializeCanvas, 200);
    window.addEventListener('resize', initializeCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initializeCanvas);
    };
  }, [initializeCanvas]);

  // ====================== SOCKET LISTENERS ======================
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_room', { roomId: id, username: user.username });

    socket.on('draw_receive', (data) => {
      const ctx = contextRef.current;
      if (!ctx) return;
      
      // Temporary style switch for incoming data
      const prevColor = ctx.strokeStyle;
      const prevWidth = ctx.lineWidth;
      const prevOp = ctx.globalCompositeOperation;

      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.lineWidth;
      ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';

      if (data.tool === 'pen' || data.tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
      } else {
        drawShape(ctx, data);
      }

      // Restore user's local styles
      ctx.strokeStyle = prevColor;
      ctx.lineWidth = prevWidth;
      ctx.globalCompositeOperation = prevOp;
    });

    socket.on('clear_whiteboard_receive', () => {
      contextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    socket.on('whiteboard_lock_status', (status) => setIsWhiteboardLocked(status));

    return () => {
      socket.off('draw_receive');
      socket.off('clear_whiteboard_receive');
      socket.off('whiteboard_lock_status');
    };
  }, [socket, user, id]);

  const drawShape = (ctx, data) => {
    if (data.tool === 'rectangle') {
      ctx.strokeRect(data.x0, data.y0, data.x1 - data.x0, data.y1 - data.y0);
    } else if (data.tool === 'circle') {
      const radius = Math.hypot(data.x1 - data.x0, data.y1 - data.y0);
      ctx.beginPath();
      ctx.arc(data.x0, data.y0, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (data.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(data.x0, data.y0);
      ctx.lineTo(data.x1, data.y1);
      ctx.stroke();
    }
  };

  // ====================== DRAWING LOGIC ======================
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top
    };
  };

  const startDrawing = (e) => {
    if (isWhiteboardLocked && !isCreator) {
      toast.warning("Board is locked");
      return;
    }
    const { x, y } = getCoords(e.nativeEvent);
    const ctx = contextRef.current;

    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color; 
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    
    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lastX = x;
      ctx.lastY = y;
    }
  };

  const draw = (e) => {
    if (!isDrawing || !contextRef.current) return;
    const { x, y } = getCoords(e.nativeEvent);
    const ctx = contextRef.current;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();

      socket?.emit('draw_event', {
        roomId: id,
        tool,
        x0: ctx.lastX,
        y0: ctx.lastY,
        x1: x,
        y1: y,
        color: tool === 'eraser' ? '#000000' : color,
        lineWidth: ctx.lineWidth
      });
      ctx.lastX = x;
      ctx.lastY = y;
    }
  };

  const finishDrawing = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e.nativeEvent || { clientX: startPos.x, clientY: startPos.y });
    
    if (['rectangle', 'circle', 'line'].includes(tool)) {
      const shapeData = { roomId: id, tool, x0: startPos.x, y0: startPos.y, x1: x, y1: y, color, lineWidth };
      drawShape(contextRef.current, shapeData);
      socket?.emit('draw_event', shapeData);
    }

    setIsDrawing(false);
    autoSave();
  };

  const autoSave = () => {
    setIsSaving(true);
    socket?.emit('save_whiteboard', { 
      roomId: id, 
      dataURL: canvasRef.current.toDataURL('image/png') 
    });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `whiteboard-${id}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="main-content" style={{ height: '100vh', background: '#0f172a', overflow: 'hidden' }}>
      
      {/* Upper Navigation */}
      <div className="topbar" style={{ justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate(`/room/${id}`)}>
            <ArrowLeft size={18} />
          </button>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>
            {roomData?.name || "Collaborative Canvas"}
          </h3>
          {isSaving && <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Save size={12} className="animate-pulse" /> Autosaving...
          </span>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={downloadImage} title="Export as PNG">
            <Download size={18} />
          </button>
          {isCreator && (
            <button 
              className={`btn ${isWhiteboardLocked ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => {
                const newState = !isWhiteboardLocked;
                setIsWhiteboardLocked(newState);
                socket?.emit('whiteboard_toggle_lock', { roomId: id, isLocked: newState });
              }}
            >
              {isWhiteboardLocked ? <Lock size={18} /> : <Unlock size={18} />}
              <span className="hide-mobile">{isWhiteboardLocked ? 'Unlock' : 'Lock'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, padding: '1rem', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Vertical Toolbar */}
        <div className="glass-card" style={{ 
          width: '70px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '1rem 0'
        }}>
          <ToolIcon active={tool === 'pen'} onClick={() => setTool('pen')} icon={<Paintbrush size={22} />} title="Pen" />
          <ToolIcon active={tool === 'rectangle'} onClick={() => setTool('rectangle')} icon={<Square size={22} />} title="Rectangle" />
          <ToolIcon active={tool === 'circle'} onClick={() => setTool('circle')} icon={<Circle size={22} />} title="Circle" />
          <ToolIcon active={tool === 'line'} onClick={() => setTool('line')} icon={<Minus size={22} />} title="Line" />
          <ToolIcon active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={22} />} title="Eraser" />
          
          <div className="divider" style={{ width: '60%', margin: '0.5rem 0' }} />
          
          <button className="tool-btn" onClick={() => {
            if(window.confirm("Clear entire board?")) {
              contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              socket?.emit('clear_whiteboard', id);
            }
          }} title="Clear All">
            <Trash2 size={22} color="#ef4444" />
          </button>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#1e293b', borderRadius: '16px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)' }}>
          {isWhiteboardLocked && !isCreator && (
            <div className="glass-card" style={{ 
              position: 'absolute', inset: 0, zIndex: 50, display: 'flex', 
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,23,42,0.8)', border: 'none'
            }}>
              <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
              <h2 style={{ color: 'white' }}>Board Locked</h2>
              <p>Only the creator can draw right now.</p>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            style={{ display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          />

          {/* Floating Controls (Color & Size) */}
          <div className="glass-card" style={{ 
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '20px', width: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} 
                style={{ width: '30px', height: '30px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
              <span style={{ color: 'black', fontSize: '0.8rem', fontWeight: 600 }}>COLOR</span>
            </div>
            <div className="divider" style={{ height: '20px', width: '1px', margin: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} 
                 />
              <span style={{ color: 'black', fontSize: '0.8rem', fontWeight: 600, width: '30px' }}>{lineWidth}px</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Component for Tools
const ToolIcon = ({ active, onClick, icon, title }) => (
  <button 
    className={`tool-btn ${active ? 'active' : ''}`} 
    onClick={onClick} 
    title={title}
    style={{ color: active ? 'white' : '#94a3b8' }}
  >
    {icon}
  </button>
);

export default Whiteboard;