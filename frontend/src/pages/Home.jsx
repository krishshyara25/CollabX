import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">

      {/* NAVBAR */}
      <nav className="navbar">
        <h2 className="logo">CollabX</h2>
        <div className="nav-links">
          <button onClick={() => navigate('/login')} className="btn-outline">
            Login
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>All-in-One Collaborative Study Platform 🚀</h1>
          <p>
            Chat, Whiteboard, Video Calls, Notes, Quiz from PDFs,
            Scheduler & Focus Timer — everything in one place.
          </p>

          <div className="hero-buttons">
            <button onClick={() => navigate('/login')} className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">Explore Features</button>
          </div>
        </div>

        <div className="hero-right">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" />
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="features">
        <h2>Powerful Features 💡</h2>

        <div className="feature-grid">
          <div className="feature-card">💬 Real-time Chat</div>
          <div className="feature-card">🎨 Whiteboard</div>
          <div className="feature-card">🎥 Video Call</div>
          <div className="feature-card">📝 Notes</div>
          <div className="feature-card">📄 PDF → Quiz</div>
          <div className="feature-card">⏱ Pomodoro Timer</div>
          <div className="feature-card">📅 Scheduler</div>
          <div className="feature-card">🏆 Leaderboard</div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="workflow">
        <h2>How It Works ⚡</h2>

        <div className="steps">
          <div className="step">
            <h3>1. Login</h3>
            <p>Create account or login</p>
          </div>

          <div className="step">
            <h3>2. Create / Join Room</h3>
            <p>Start collaboration instantly</p>
          </div>

          <div className="step">
            <h3>3. Study Together</h3>
            <p>Chat, draw, video call & share notes</p>
          </div>

          <div className="step">
            <h3>4. Boost Productivity</h3>
            <p>Use timer, quizzes & scheduling</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Start Smart Learning Today 🎯</h2>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Join Now
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 CollabX | Built for Students 🚀</p>
      </footer>

    </div>
  );
};

export default Home;