import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Home from './pages/Home'; // 🔥 NEW
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import StudyRoom from './pages/StudyRoom';
import Chat from './pages/Chat';
import VideoCall from './pages/VideoCall';
import Whiteboard from './pages/Whiteboard';
import PomodoroTimer from './pages/PomodoroTimer';
import Notes from './pages/Notes';
import Scheduler from './pages/Scheduler';
import StudyCalendar from './pages/StudyCalendar';
import Profile from './pages/Profile';
import Flashcards from './pages/Flashcards';
import AdminPanel from './pages/AdminPanel';

import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/" replace />; // 🔥 changed
  return children;
};

const App = () => {
  const location = useLocation();

  const hideSidebar =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  return (
      <SocketProvider>
        <div className="app-container">
          {!hideSidebar && <Sidebar />}

          <div className="main-content">
            {!hideSidebar && <Topbar />}

            <div className={hideSidebar ? '' : 'content-wrapper'}>
              <Routes>

                {/* 🔥 Landing Page */}
                <Route path="/" element={<Home />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 🔥 Dashboard moved */}
                <Route 
                  path="/dashboard" 
                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
                />

                {/* Study Room */}
                <Route path="/room/:id" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
                <Route path="/room/:id/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/room/:id/video" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
                <Route path="/room/:id/whiteboard" element={<ProtectedRoute><Whiteboard /></ProtectedRoute>} />
                <Route path="/room/:id/timer" element={<ProtectedRoute><PomodoroTimer /></ProtectedRoute>} />
                <Route path="/room/:id/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />

                {/* Other */}
                <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
                <Route path="/scheduler" element={<ProtectedRoute><Scheduler /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><StudyCalendar /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

              </Routes>
            </div>
          </div>

          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </SocketProvider>
  );
};

export default App;