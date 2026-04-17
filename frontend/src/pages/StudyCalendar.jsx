import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit2, Trash2, Plus, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KEYFRAMES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  
  /* Custom Calendar Styling */
  .custom-calendar {
    width: 100%;
    border: none !important;
    background: transparent !important;
    font-family: 'Inter', sans-serif;
  }
  .custom-calendar .react-calendar__navigation button {
    color: #0f172a;
    font-weight: 700;
    font-size: 1.1rem;
    border-radius: 8px;
  }
  .custom-calendar .react-calendar__navigation button:hover {
    background: rgba(37,99,235,0.1) !important;
  }
  .custom-calendar .react-calendar__month-view__weekdays {
    text-transform: uppercase;
    font-weight: 700;
    font-size: 0.75rem;
    color: #64748b;
    abbr { text-decoration: none; }
  }
  .custom-calendar .react-calendar__tile {
    padding: 1.25rem 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: 12px;
    color: #1e293b;
    transition: all 0.2s;
  }
  .custom-calendar .react-calendar__tile:hover {
    background: rgba(37,99,235,0.08) !important;
  }
  .custom-calendar .react-calendar__tile--now {
    background: #eff6ff !important;
    color: #2563eb;
  }
  .custom-calendar .react-calendar__tile--active {
    background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
    color: white !important;
    box-shadow: 0 4px 14px rgba(37,99,235,0.3);
  }
  .custom-calendar .react-calendar__tile--hasActive {
    background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
    color: white !important;
  }
  .log-indicator {
    height: 6px;
    width: 6px;
    background: #10b981;
    border-radius: 50%;
    margin: 4px auto 0;
  }
`;

const Orb = ({ style }) => (
  <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', filter:'blur(70px)', opacity:.5, ...style }} />
);

export default function StudyCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);

  // Parse YYYY-MM-DD from 'date'
  const selectedDateStr = format(date, 'yyyy-MM-dd');
  const logsForSelectedDate = logs.filter(log => log.date === selectedDateStr);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch calendar logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/calendar/${editingId}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/api/calendar', {
          ...formData,
          date: selectedDateStr
        }, config);
      }
      
      setFormData({ title: '', content: '' });
      setEditingId(null);
      fetchLogs();
    } catch (err) {
      console.error('Failed to save log', err);
    }
  };

  const startEdit = (log) => {
    setEditingId(log._id);
    setFormData({ title: log.title, content: log.content || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study log?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs();
      if(editingId === id) {
        setFormData({ title: '', content: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to delete log', err);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const d = format(date, 'yyyy-MM-dd');
      const hasLog = logs.some(l => l.date === d);
      return hasLog ? <div className="log-indicator"></div> : null;
    }
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 60%,#eff6ff 100%)',
      fontFamily:'Inter, sans-serif', position:'relative', overflow:'hidden',
    }}>
      <style>{KEYFRAMES}</style>
      <Orb style={{ width:600, height:600, top:'-20%', left:'-10%', background:'radial-gradient(circle,rgba(37,99,235,.15),transparent 70%)' }} />
      <Orb style={{ width:500, height:500, bottom:'-15%', right:'-8%',  background:'radial-gradient(circle,rgba(217,70,239,.12),transparent 70%)' }} />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'2rem 2.5rem' }}>
        
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'2rem', animation:'fadeUp 0.5s ease' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              background:'white', border:'1px solid #e2e8f0', borderRadius:'50%', width:40, height:40, 
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
              color:'#64748b', transition:'all 0.2s', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#0f172a', letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:'0.5rem' }}>
               <CalendarIcon style={{ color:'#d946ef' }} /> Study Calendar
            </h1>
            <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Track your daily progress and study sessions.</p>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 7fr) minmax(0, 5fr)', gap:'2rem', alignItems:'start' }}>
          
          {/* Calendar Section */}
          <div style={{
            background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
            borderRadius:24, border:'1px solid rgba(255,255,255,.7)',
            padding:'2rem', boxShadow:'0 10px 40px rgba(37,99,235,.08)',
            animation:'fadeUp .5s .1s cubic-bezier(.16,1,.3,1) both',
          }}>
            <Calendar
              onChange={setDate}
              value={date}
              className="custom-calendar"
              tileContent={tileContent}
            />
          </div>

          {/* Logs Section */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', animation:'slideIn .5s .2s cubic-bezier(.16,1,.3,1) both' }}>
            
            <div style={{
              background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              borderRadius:24, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.75rem', boxShadow:'0 10px 40px rgba(37,99,235,.08)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#0f172a' }}>
                  {format(date, 'MMMM do, yyyy')}
                </h2>
                <div style={{ background:'#f0fdf4', color:'#16a34a', padding:'0.2rem 0.75rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'600' }}>
                  {logsForSelectedDate.length} Entries
                </div>
              </div>

              {logsForSelectedDate.length === 0 ? (
                 <div style={{ textAlign:'center', padding:'2rem 0', color:'#94a3b8' }}>
                   <BookOpen size={32} style={{ margin:'0 auto 0.5rem', opacity:0.5 }} />
                   <p style={{ fontSize:'0.9rem' }}>No study logs for this date.</p>
                 </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem', maxHeight:'300px', overflowY:'auto', paddingRight:'0.5rem' }}>
                  {logsForSelectedDate.map(log => (
                    <div key={log._id} style={{ 
                      background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:16, padding:'1.25rem',
                      transition:'all 0.2s', position:'relative', group:'true' 
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <h3 style={{ fontSize:'1rem', fontWeight:600, color:'#1e293b', marginBottom:'0.5rem' }}>{log.title}</h3>
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                          <button onClick={() => startEdit(log)} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer' }}><Edit2 size={14}/></button>
                          <button onClick={() => handleDelete(log._id)} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <p style={{ color:'#64748b', fontSize:'0.85rem', lineHeight:1.5 }}>
                        {log.content || <span style={{ fontStyle:'italic' }}>No additional notes.</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / Edit Form */}
            <div style={{
              background:'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))', 
              backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              borderRadius:24, border:'1px solid rgba(255,255,255,.7)',
              padding:'1.75rem', boxShadow:'0 10px 40px rgba(37,99,235,.08)',
            }}>
              <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                {editingId ? <Edit2 size={18} style={{color:'#f59e0b'}} /> : <Plus size={18} style={{color:'#10b981'}} />}
                {editingId ? 'Edit Study Log' : 'Add Study Log'}
              </h3>
              
              <form onSubmit={handleCreateOrUpdate} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Topic studied (e.g., React Hooks)"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{
                      width:'100%', padding:'0.75rem 1rem', borderRadius:12,
                      border:'1.5px solid #e2e8f0', background:'white', color:'#0f172a', 
                      fontSize:'0.9rem', fontFamily:'inherit', transition:'all .2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Notes, concepts learned, or thoughts..."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    style={{
                      width:'100%', padding:'0.75rem 1rem', borderRadius:12,
                      border:'1.5px solid #e2e8f0', background:'white', color:'#0f172a', 
                      fontSize:'0.9rem', fontFamily:'inherit', transition:'all .2s',
                      resize:'vertical'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
                
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex:1, padding:'0.8rem', borderRadius:12, border:'none',
                      background:'linear-gradient(135deg,#2563eb,#7c3aed)',
                      color:'white', fontWeight:700, fontSize:'0.9rem',
                      fontFamily:'inherit', cursor:'pointer',
                      boxShadow:'0 6px 20px rgba(37,99,235,.3)',
                      transition:'transform .2s, box-shadow .2s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 25px rgba(37,99,235,.4)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,.3)';}}
                  >
                    {editingId ? 'Update Log' : 'Save Log'}
                  </button>
                  
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setFormData({title:'', content:''}); }}
                      style={{
                        padding:'0.8rem 1.2rem', borderRadius:12, border:'1.5px solid #e2e8f0',
                        background:'white', color:'#64748b', fontWeight:600, fontSize:'0.9rem',
                        fontFamily:'inherit', cursor:'pointer',
                        transition:'all .2s',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='white'}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
