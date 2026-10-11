
import { useEffect, useState } from 'react';
import OfficerDashboard from './OfficerDashboard';
import Login from './Login.jsx';
import './App.css';

const API = 'http://localhost:8080/api/complaints';

function App() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Roads',
    location: '',
    priority: 'Medium',
    department: 'Municipal Corporation'
  });

  async function loadComplaints() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error('Could not load complaints');
      }

      const data = await response.json();
      setComplaints(data);
    } catch {
      setMessage(
        'Cannot connect to the server. Please check that the backend is running.'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    const complaint = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      status: 'Pending'
    };

    if (!complaint.location) {
      setMessage('Please enter the location of the issue.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(complaint)
      });

      const data = await response.json();

      // Handle duplicate and validation warnings first.
      if (data.duplicate === true) {
        setMessage(data.message || 'This complaint may already exist.');
        setMessageType('error');
        return;
      }

      if (data.error === true) {
        setMessage(data.message || 'Please check your complaint details.');
        setMessageType('error');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed.');
      }

      // Only clear the form after a successful save.
      setForm({
        title: '',
        description: '',
        category: 'Roads',
        location: '',
        priority: 'Medium',
        department: 'Municipal Corporation'
      });

      setMessage('Your complaint has been submitted successfully!');
      setMessageType('success');

      await loadComplaints();
    } catch (error) {
      setMessage(
        error.message ||
        'Could not submit your complaint. Please try again.'
      );
      setMessageType('error');
    }
  }

  // Login page route.
  if (window.location.pathname === '/login') {
    return <Login />;
  }

  // Keep the officer dashboard route working. This route is not secured yet.
  if (window.location.pathname === '/officer') {
    return <OfficerDashboard />;
  }

  const pending = complaints.filter(
    c => c.status === 'Pending'
  ).length;

  const resolved = complaints.filter(
    c => c.status === 'Resolved'
  ).length;

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">F</span>
          <span>
            FixNear
            <small>Better neighborhoods, together.</small>
          </span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#report">Report an Issue</a>
          <a href="#complaints">Complaints</a>
          <a href="/login">Login</a>
        </nav>

        <a className="nav-button" href="#report">
          Report Now ↗
        </a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot"></span>
              YOUR COMMUNITY. YOUR VOICE.
            </span>

            <h1>
              See a problem?
              <br />
              <span>Let's fix it.</span>
            </h1>

            <p>
              Report local problems, track their progress, and help make
              your neighborhood a better place to live.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#report">
                ＋ Report an Issue
              </a>
              <a className="text-button" href="#complaints">
                Track Complaints →
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span>
              Every report matters. Every neighborhood counts.
            </div>
          </div>

          <div className="hero-art" aria-label="Community improvement illustration">
            <div className="sun"></div>
            <div className="cloud cloud-one"></div>
            <div className="cloud cloud-two"></div>
            <div className="hill hill-back"></div>
            <div className="hill hill-front"></div>
            <div className="road"></div>
            <div className="building building-one">
              <i></i><i></i><i></i>
            </div>
            <div className="building building-two">
              <i></i><i></i><i></i><i></i>
            </div>
            <div className="tree tree-one"><i></i></div>
            <div className="tree tree-two"><i></i></div>
            <div className="pin"><span>✓</span></div>
            <div className="art-label">
              <span>✦</span> Small actions, big change
            </div>
          </div>
        </section>

        <section className="stats">
          <div>
            <span className="stat-icon blue">▤</span>
            <div>
              <strong>{complaints.length}</strong>
              <span>Total complaints</span>
            </div>
          </div>

          <div>
            <span className="stat-icon amber">◷</span>
            <div>
              <strong>{pending}</strong>
              <span>Awaiting action</span>
            </div>
          </div>

          <div>
            <span className="stat-icon green">✓</span>
            <div>
              <strong>{resolved}</strong>
              <span>Resolved issues</span>
            </div>
          </div>
        </section>

        <section className="report-section" id="report">
          <div className="section-heading">
            <span className="eyebrow">MAKE A DIFFERENCE</span>
            <h2>Report a local issue</h2>
            <p>
              Share the details below so the responsible team can take action.
            </p>
          </div>

          <form className="complaint-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Issue title *
                <input
                  required
                  maxLength="120"
                  placeholder="e.g. Streetlight not working"
                  value={form.title}
                  onChange={e =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </label>

              <label>
                Category *
                <select
                  required
                  value={form.category}
                  onChange={e =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option>Roads</option>
                  <option>Streetlights</option>
                  <option>Garbage</option>
                  <option>Water Supply</option>
                  <option>Drainage</option>
                  <option>Public Safety</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="full">
                Description *
                <textarea
                  required
                  rows="4"
                  maxLength="1500"
                  placeholder="Describe the problem and how it affects your neighborhood..."
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>

              <label>
                Location *
                <input
                  required
                  maxLength="250"
                  placeholder="Enter street, area, or landmark"
                  value={form.location}
                  onChange={e =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </label>

              <label>
                Responsible Department *
                <select
                  required
                  value={form.department}
                  onChange={e =>
                    setForm({ ...form, department: e.target.value })
                  }
                >
                  <option>Municipal Corporation</option>
                  <option>Electricity Department</option>
                  <option>Water Supply Department</option>
                  <option>Police Department</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={e =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
            </div>

            <button className="primary-button submit-button" type="submit">
              Submit Complaint <span>→</span>
            </button>

            {message && (
              <p
                className="message"
                role="status"
                style={{
                  color: messageType === 'error' ? '#c0392b' : '#218838'
                }}
              >
                {message}
              </p>
            )}
          </form>
        </section>

        <section className="complaints-section" id="complaints">
          <div className="complaints-heading">
            <div>
              <span className="eyebrow">COMMUNITY TRANSPARENCY</span>
              <h2>Recent complaints</h2>
              <p>
                Follow the progress of reported neighborhood issues.
              </p>
            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={loadComplaints}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="empty-state">Loading complaints...</p>
          ) : complaints.length === 0 ? (
            <div className="empty-state">
              <span>✧</span>
              <strong>No complaints yet</strong>
              <p>
                Be the first to report an issue in your neighborhood.
              </p>
              <a href="#report">Report an issue →</a>
            </div>
          ) : (
            <div className="complaint-list">
              {complaints.map(c => (
                <article className="complaint-card" key={c.id}>
                  <div className="complaint-symbol">⌖</div>

                  <div className="complaint-details">
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>

                    <div className="complaint-meta">
                      <span>⌖ {c.location || 'Location not provided'}</span>
                      <span>{c.category}</span>
                      <span>#{c.id}</span>
                    </div>
                  </div>

                  <div className="complaint-tags">
                    <span
                      className={`status status-${(
                        c.status || 'Pending'
                      ).toLowerCase()}`}
                    >
                      {c.status || 'Pending'}
                    </span>

                    <span className="priority">
                      {c.priority || 'Medium'} priority
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">F</span>
          <span>
            FixNear
            <small>Building better communities.</small>
          </span>
        </a>

        <span>Made for communities that care. © 2026 FixNear</span>
      </footer>
    </div>
  );
}

export default App;