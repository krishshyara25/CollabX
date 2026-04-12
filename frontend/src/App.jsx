import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import StudyRoom from './pages/StudyRoom';
import Chat from './pages/Chat';
import Whiteboard from './pages/Whiteboard';
import PomodoroTimer from './pages/PomodoroTimer';
import Notes from './pages/Notes';

import Scheduler from './pages/Scheduler';
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
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const location = useLocation();

  // Hide sidebar on auth pages and dashboard
  const hideSidebar = 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/';

  return (
    <div className="app-container">
      {!hideSidebar && <Sidebar />}

      <div className="main-content">
        {!hideSidebar && <Topbar />}

        <div className={hideSidebar ? '' : 'content-wrapper'}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Main Study Room */}
            <Route 
              path="/room/:id" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <StudyRoom />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />

            {/* Feature Full Pages */}
            <Route 
              path="/room/:id/chat" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Chat />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/room/:id/whiteboard" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Whiteboard />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/room/:id/timer" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <PomodoroTimer />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/room/:id/notes" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Notes />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />

            {/* Other Pages */}
            <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute><Scheduler /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default App;