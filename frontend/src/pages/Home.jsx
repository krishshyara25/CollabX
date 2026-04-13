import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Inline styles (no external CSS needed) ─── */
const S = {
  /* ── Global Reset injected once ── */
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior: smooth; }
    body { font-family:'Inter',sans-serif; background:#f0f4ff; color:#0f172a; overflow-x:hidden; }
    :root {
      --blue:   #2563eb; --blue-h: #1d4ed8; --blue-l: #eff6ff;
      --violet: #7c3aed; --teal:   #14b8a6; --teal-h: #0d9488;
      --green:  #10b981; --amber:  #f59e0b; --red:    #ef4444;
      --text:   #0f172a; --muted:  #64748b; --hint:   #94a3b8;
      --surf:   #ffffff; --bg:     #f0f4ff; --border: #e2e8f0;
      --g-primary:  linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);
      --g-teal:     linear-gradient(135deg,#14b8a6 0%,#0ea5e9 100%);
      --g-hero:     linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      --g-amber:    linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);
      --sh-card: 0 4px 20px rgba(0,0,0,0.07);
      --sh-lg:   0 20px 60px rgba(0,0,0,0.12);
      --sh-blue: 0 8px 28px rgba(37,99,235,0.35);
    }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
    @keyframes fadeRight{ from{opacity:0;transform:translateX(32px)}  to{opacity:1;transform:translateX(0)} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
    @keyframes gradShift{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes slideDown{ from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse    { 0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(37,99,235,.4)} 70%{transform:scale(1);box-shadow:0 0 0 10px rgba(37,99,235,0)} 100%{transform:scale(.95)} }
    @keyframes orbit    { from{transform:rotate(0deg) translateX(120px) rotate(0deg)} to{transform:rotate(360deg) translateX(120px) rotate(-360deg)} }
    @keyframes countUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .reveal { opacity:0; transform:translateY(28px); transition:opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1); }
    .reveal.in { opacity:1; transform:translateY(0); }
    .reveal.d1 { transition-delay:.1s } .reveal.d2 { transition-delay:.2s }
    .reveal.d3 { transition-delay:.3s } .reveal.d4 { transition-delay:.4s }
    @media(max-width:768px){
      .hero-grid{flex-direction:column !important; text-align:center !important;}
      .hero-img{width:220px !important;}
      .hero-btns{justify-content:center !important;}
      .feat-grid{grid-template-columns:repeat(2,1fr) !important;}
      .steps-row{flex-direction:column !important; align-items:center !important;}
      .step-item{width:80% !important;}
      .steps-line{display:none !important;}
      .stat-row{grid-template-columns:repeat(2,1fr) !important;}
    }
    @media(max-width:480px){
      .feat-grid{grid-template-columns:1fr !important;}
      .stat-row{grid-template-columns:1fr !important;}
    }
  `,
};

/* ─── Scroll reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Animated counter ─── */
function Counter({ end, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let start = 0;
      const dur = 1400;
      const step = timestamp => {
        if (!start) start = timestamp;
        const prog = Math.min((timestamp - start) / dur, 1);
        setVal(Math.floor(prog * end));
        if (prog < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref} style={{ animation: 'countUp .4s ease' }}>{val}{suffix}</span>;
}

/* ─── Feature data ─── */
const FEATURES = [
  { icon: '💬', label: 'Real-time Chat',   desc: 'Instant messaging with threads, reactions & file sharing.',    color: '#eff6ff', accent: '#2563eb' },
  { icon: '🎨', label: 'Whiteboard',        desc: 'Draw, sketch and brainstorm with infinite canvas tools.',      color: '#f5f3ff', accent: '#7c3aed' },
  { icon: '🎥', label: 'Video Calls',       desc: 'HD group video with screen share & recording.',                color: '#ecfdf5', accent: '#10b981' },
  { icon: '📝', label: 'Smart Notes',       desc: 'Rich-text notes with tags, search and export.',                color: '#fff7ed', accent: '#f59e0b' },
  { icon: '📄', label: 'PDF → Quiz',        desc: 'Auto-generate quizzes from any PDF in seconds.',               color: '#fef2f2', accent: '#ef4444' },
  { icon: '⏱',  label: 'Pomodoro Timer',   desc: 'Focus sessions with custom intervals & break reminders.',      color: '#eff6ff', accent: '#2563eb' },
  { icon: '📅', label: 'Scheduler',         desc: 'Plan study sessions, set reminders, sync calendars.',          color: '#f0fdf4', accent: '#22c55e' },
  { icon: '🏆', label: 'Leaderboard',       desc: 'Track XP, streaks and compete with friends.',                  color: '#fefce8', accent: '#eab308' },
];

/* ─── Workflow steps ─── */
const STEPS = [
  { n: '01', title: 'Create Account', desc: 'Sign up free in under 30 seconds.' },
  { n: '02', title: 'Create or Join Room', desc: 'Start or enter a collaboration room.' },
  { n: '03', title: 'Study Together', desc: 'Chat, draw, video call & share notes live.' },
  { n: '04', title: 'Boost Productivity', desc: 'Use quizzes, timer & scheduling tools.' },
];

/* ─── Stats ─── */
const STATS = [
  { end: 12, suffix: 'K+', label: 'Active Students' },
  { end: 98,  suffix: '%',  label: 'Satisfaction Rate' },
  { end: 8,   suffix: '+',  label: 'Study Tools' },
  { end: 50,  suffix: 'K+', label: 'Sessions Hosted' },
];

/* ─── Floating Orb (decorative) ─── */
const Orb = ({ style }) => (
  <div style={{
    position: 'absolute', borderRadius: '50%',
    pointerEvents: 'none', zIndex: 0,
    filter: 'blur(60px)', opacity: .55,
    ...style,
  }} />
);

export default function Home() {
  const navigate = useNavigate();
  useReveal();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4ff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* Inject global keyframes + helper classes */}
      <style>{S.global}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 3rem',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 16px rgba(0,0,0,0.06)',
        animation: 'slideDown .5s cubic-bezier(.16,1,.3,1)',
      }}>
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em',
          background: 'var(--g-teal)', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>CollabX</h2>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.55rem 1.4rem', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
              background: 'transparent', border: '1.5px solid #2563eb', color: '#2563eb',
              cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Login</button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.55rem 1.4rem', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
              background: 'var(--g-primary)', backgroundSize: '200% 200%',
              animation: 'gradShift 5s ease infinite',
              border: 'none', color: 'white', cursor: 'pointer',
              boxShadow: 'var(--sh-blue)', fontFamily: 'inherit',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh-blue)'; }}
          >Get Started</button>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '92vh',
        display: 'flex', alignItems: 'center',
        padding: '4rem 3rem',
      }}>
        {/* Ambient orbs */}
        <Orb style={{ width: 600, height: 600, top: '-20%', right: '-10%', background: 'radial-gradient(circle,rgba(99,102,241,.18),transparent 70%)' }} />
        <Orb style={{ width: 400, height: 400, bottom: '-15%', left: '-8%',  background: 'radial-gradient(circle,rgba(16,185,129,.14),transparent 70%)' }} />
        <Orb style={{ width: 300, height: 300, top: '20%', left: '35%',       background: 'radial-gradient(circle,rgba(245,158,11,.1),transparent 70%)' }} />

        <div className="hero-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto', gap: '3rem', zIndex: 1, position: 'relative' }}>

          {/* Left */}
          <div style={{ maxWidth: 580, animation: 'fadeLeft .7s cubic-bezier(.16,1,.3,1)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#eff6ff', border: '1px solid rgba(37,99,235,.2)',
              borderRadius: 999, padding: '0.3rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '.06em',
              color: '#2563eb', textTransform: 'uppercase',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              New — PDF to Quiz is live
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 800,
              lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem',
            }}>
              All-in-One{' '}
              <span style={{
                background: 'var(--g-primary)', backgroundSize: '200% 200%',
                animation: 'gradShift 4s ease infinite',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Collaborative</span>
              <br />Study Platform
            </h1>

            <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: '#64748b', marginBottom: '2rem' }}>
              Chat, Whiteboard, Video Calls, Notes, Quizzes from PDFs,
              Scheduler &amp; Focus Timer — everything in one place for smarter studying.
            </p>

            <div className="hero-btns" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.85rem 2.2rem', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
                  background: 'var(--g-primary)', backgroundSize: '200% 200%',
                  animation: 'gradShift 5s ease infinite',
                  border: 'none', color: 'white', cursor: 'pointer',
                  boxShadow: 'var(--sh-blue)', fontFamily: 'inherit',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh-blue)'; }}
              >Get Started Free →</button>

              <button
                style={{
                  padding: '0.85rem 2.2rem', borderRadius: 12, fontWeight: 600, fontSize: '1rem',
                  background: 'white', border: '1.5px solid #e2e8f0', color: '#0f172a',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              >▶ Watch Demo</button>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '2rem' }}>
              {['S','A','R','M'].map((l, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: ['#2563eb','#7c3aed','#10b981','#f59e0b'][i],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.7rem', fontWeight: 700,
                  marginLeft: i > 0 ? -10 : 0, border: '2px solid white',
                }}>{l}</div>
              ))}
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 4 }}>
                Join <strong style={{ color: '#0f172a' }}>12,000+</strong> students worldwide
              </span>
            </div>
          </div>

          {/* Right — floating illustration */}
          <div style={{ animation: 'fadeRight .7s .2s cubic-bezier(.16,1,.3,1) both', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Glowing ring */}
              <div style={{
                position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                border: '1.5px dashed rgba(37,99,235,.25)',
              }} />
              {/* Orbiting dots */}
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 12, height: 12, borderRadius: '50%',
                  background: ['#2563eb','#7c3aed','#10b981','#f59e0b','#ef4444'][i],
                  animation: `orbit ${3 + i * 0.4}s linear infinite`,
                  animationDelay: `${-i * 0.6}s`,
                  transformOrigin: 'center',
                  boxShadow: `0 0 12px ${['#2563eb','#7c3aed','#10b981','#f59e0b','#ef4444'][i]}88`,
                }} />
              ))}
              <img
                className="hero-img"
                src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
                alt="Study illustration"
                style={{
                  width: 260, filter: 'drop-shadow(0 30px 50px rgba(37,99,235,.25))',
                  animation: 'float 5s ease-in-out infinite', position: 'relative', zIndex: 1,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS BAND ══════════ */}
      <section style={{
        background: 'white', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
        padding: '2.5rem 3rem',
      }}>
        <div className="stat-row reveal" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: '1rem', maxWidth: 900, margin: '0 auto', textAlign: 'center',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                <Counter end={s.end} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section style={{ padding: '5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block', background: '#f5f3ff', color: '#7c3aed',
            borderRadius: 999, padding: '0.3rem 1rem', fontSize: '0.75rem',
            fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            border: '1px solid rgba(124,58,237,.2)', marginBottom: '1rem',
          }}>Everything You Need</div>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Powerful Features
          </h2>
          <p style={{ color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            All the tools your study group needs, beautifully unified into one seamless workspace.
          </p>
        </div>

        <div className="feat-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: '1.25rem', maxWidth: 1200, margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`reveal d${(i % 4) + 1}`}
              style={{
                background: 'white', borderRadius: 16, padding: '1.75rem 1.5rem',
                border: '1px solid #e2e8f0', textAlign: 'left',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                transition: 'transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = f.accent + '44';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg,${f.accent},${f.accent}88)`,
              }} />
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: '1rem',
                transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.label}</h3>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#64748b' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ WORKFLOW ══════════ */}
      <section style={{
        padding: '5rem 3rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg,#ecfeff 0%,#eff6ff 100%)',
      }}>
        <Orb style={{ width: 500, height: 500, top: '-30%', right: '-10%', background: 'radial-gradient(circle,rgba(37,99,235,.08),transparent 70%)' }} />

        <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', background: '#eff6ff', color: '#2563eb',
            borderRadius: 999, padding: '0.3rem 1rem', fontSize: '0.75rem',
            fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            border: '1px solid rgba(37,99,235,.2)', marginBottom: '1rem',
          }}>Simple Process</div>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            How It Works
          </h2>
        </div>

        <div className="steps-row" style={{ display: 'flex', justifyContent: 'center', gap: 0, position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>
          {/* Connector line */}
          <div className="steps-line" style={{
            position: 'absolute', top: 36, left: '12%', right: '12%', height: 2,
            background: 'linear-gradient(90deg,#2563eb,#7c3aed)', opacity: .2,
          }} />

          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`step-item reveal d${i + 1}`}
              style={{ width: '22%', textAlign: 'center', padding: '0 1rem', position: 'relative', zIndex: 1 }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'var(--g-primary)', backgroundSize: '200% 200%',
                animation: 'gradShift 5s ease infinite',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800, color: 'white',
                boxShadow: 'var(--sh-blue)',
                transition: 'transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.18)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--sh-blue)'; }}
              >{s.n}</div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.title}</h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section style={{ padding: '5rem 3rem' }}>
        <div className="reveal" style={{
          maxWidth: 860, margin: '0 auto', borderRadius: 24, padding: '5rem 3rem',
          background: 'var(--g-hero)', backgroundSize: '200% 200%',
          animation: 'gradShift 8s ease infinite',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(102,126,234,.35)',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-40%', left: '-15%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Start Smart Learning Today
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              Join thousands of students already levelling up together. Free forever.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '1rem 2.8rem', borderRadius: 14, fontWeight: 700, fontSize: '1.05rem',
                background: 'white', color: '#2563eb', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)', fontFamily: 'inherit',
                transition: 'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.18)'; }}
            >Join Now — It's Free →</button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        textAlign: 'center', padding: '2.5rem 2rem',
        background: '#0f172a', color: '#64748b', fontSize: '0.875rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em',
          background: 'var(--g-teal)', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: '0.75rem',
        }}>CollabX</div>
        <p style={{ color: '#475569' }}>© 2026 CollabX — Built for Students with 💙</p>
      </footer>
    </div>
  );
}