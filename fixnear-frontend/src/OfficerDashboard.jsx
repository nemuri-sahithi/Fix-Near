
import { useEffect, useState } from 'react';
import './OfficerDashboard.css';

const API = 'http://localhost:8080/api/complaints';

function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [proofPaths, setProofPaths] = useState({});
  const [savingProof, setSavingProof] = useState(null);

  async function loadComplaints() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();

      setComplaints(await response.json());
      setMessage('');
    } catch {
      setMessage(
        'Unable to load complaints. Check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function updateStatus(id, status) {
    try {
      const response = await fetch(`${API}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage(`Complaint #${id} updated to ${status}.`);
      await loadComplaints();
    } catch {
      setMessage(`Could not update complaint #${id}. Please try again.`);
    }
  }

  async function submitProof(id) {
    const resolutionProof = (proofPaths[id] || '').trim();

    if (!resolutionProof) {
      setMessage('Please enter a resolution proof URL or path first.');
      return;
    }

    setSavingProof(id);
    setMessage('');

    try {
      const response = await fetch(`${API}/${id}/resolution-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionProof })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Proof submission failed.');
      }

      setMessage(`Resolution proof submitted for complaint #${id}.`);
      await loadComplaints();
    } catch (error) {
      setMessage(
        error.message || `Could not submit proof for complaint #${id}.`
      );
    } finally {
      setSavingProof(null);
    }
  }

  const pending = complaints.filter(
    c => c.status === 'Pending'
  ).length;

  const progress = complaints.filter(
    c => c.status === 'In Progress'
  ).length;

  const resolved = complaints.filter(
    c => c.status === 'Resolved'
  ).length;

  const departments = [
    'All',
    ...new Set(
      complaints.map(c => c.department).filter(Boolean)
    )
  ];

  const filtered = complaints.filter(c => {
    const matchesStatus = filter === 'All' || c.status === filter;
    const matchesDepartment =
      departmentFilter === 'All' ||
      c.department === departmentFilter;

    return matchesStatus && matchesDepartment;
  });

  return (
    <div className="officer-app">
      <header className="officer-header">
        <a className="officer-brand" href="/">
          <span className="officer-logo">F</span>
          <span>
            FixNear
            <small>OFFICIAL PORTAL</small>
          </span>
        </a>

        <div className="officer-label">
          <span></span> Department Workspace
        </div>
      </header>

      <main className="officer-main">
        <div className="officer-welcome">
          <div>
            <span className="officer-eyebrow">
              COMPLAINT MANAGEMENT
            </span>
            <h1>Officer Dashboard</h1>
            <p>
              Review community reports, update their progress,
              and submit proof of completed work.
            </p>
          </div>

          <button
            className="officer-refresh"
            onClick={loadComplaints}
          >
            ↻ Refresh Data
          </button>
        </div>

        {message && (
          <div className="officer-message" role="status">
            {message}
          </div>
        )}

        <section className="officer-stats">
          <div>
            <span className="officer-stat-icon">▤</span>
            <span>
              Total Reports
              <strong>{complaints.length}</strong>
            </span>
          </div>

          <div>
            <span className="officer-stat-icon amber-icon">◷</span>
            <span>
              Pending
              <strong>{pending}</strong>
            </span>
          </div>

          <div>
            <span className="officer-stat-icon blue-icon">↻</span>
            <span>
              In Progress
              <strong>{progress}</strong>
            </span>
          </div>

          <div>
            <span className="officer-stat-icon green-icon">✓</span>
            <span>
              Resolved
              <strong>{resolved}</strong>
            </span>
          </div>
        </section>

        <section className="officer-reports">
          <div className="officer-reports-heading">
            <div>
              <h2>Community Complaints</h2>
              <p>
                Track complaint progress and resolution verification.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <label>
                Filter by department
                <select
                  value={departmentFilter}
                  onChange={e =>
                    setDepartmentFilter(e.target.value)
                  }
                >
                  {departments.map(department => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Filter by status
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option>All</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="officer-empty">
              Loading reports...
            </div>
          ) : filtered.length === 0 ? (
            <div className="officer-empty">
              <span>✓</span>
              <strong>No complaints found</strong>
              <p>New community reports will appear here.</p>
            </div>
          ) : (
            <div className="officer-table-wrap">
              <table className="officer-table">
                <thead>
                  <tr>
                    <th>COMPLAINT</th>
                    <th>LOCATION</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>UPDATE STATUS</th>
                    <th>RESOLUTION PROOF</th>
                    <th>VERIFICATION</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.title}</strong>
                        <small>
                          #{c.id} · {c.category}
                        </small>
                        <p>{c.description}</p>
                      </td>

                      <td>{c.location}</td>

                      <td>
                        <span
                          className={`officer-priority priority-${(
                            c.priority || 'Medium'
                          ).toLowerCase()}`}
                        >
                          {c.priority || 'Medium'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`officer-status status-${(
                            c.status || 'Pending'
                          ).toLowerCase().replace(' ', '-')}`}
                        >
                          {c.status || 'Pending'}
                        </span>
                      </td>

                      <td>
                        <select
                          aria-label={`Update status for complaint ${c.id}`}
                          value={c.status || 'Pending'}
                          onChange={e =>
                            updateStatus(c.id, e.target.value)
                          }
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                      </td>

                      <td>
                        {c.status === 'Resolved' ? (
                          <div
                            style={{
                              minWidth: '190px',
                              display: 'grid',
                              gap: '8px'
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Enter proof URL or path"
                              value={proofPaths[c.id] ?? ''}
                              onChange={e =>
                                setProofPaths(previous => ({
                                  ...previous,
                                  [c.id]: e.target.value
                                }))
                              }
                            />

                            <button
                              type="button"
                              disabled={savingProof === c.id}
                              onClick={() => submitProof(c.id)}
                            >
                              {savingProof === c.id
                                ? 'Submitting...'
                                : 'Submit Proof'}
                            </button>

                            {c.resolutionProof && (
                              <small>
                                Proof submitted
                              </small>
                            )}
                          </div>
                        ) : (
                          <small>
                            Mark Resolved to submit proof.
                          </small>
                        )}
                      </td>

                      <td>
                        <strong>
                          {c.verificationStatus || 'Not Submitted'}
                        </strong>

                        {c.citizenFeedback && (
                          <p>
                            Feedback: {c.citizenFeedback}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="officer-disclaimer">
          Demonstration dashboard · Authentication and
          department-specific access are not configured yet.
        </p>
      </main>
    </div>
  );
}

export default OfficerDashboard;
