
import { useState } from 'react';
import './Login.css';

export default function Login() {
  const [role, setRole] = useState('Citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Demo navigation only. Authentication is not implemented yet.
    window.location.href =
      role === 'Department Officer' ? '/officer' : '/';
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <a className="login-brand" href="/">
          <span className="login-brand-icon">F</span>
          <span>FixNear</span>
        </a>

        <div className="login-welcome">
          <p className="login-eyebrow">YOUR COMMUNITY. YOUR VOICE.</p>
          <h1>Let's make our neighbourhood better, together.</h1>
          <p>
            Report local problems, track their progress, and help
            make your community a better place to live.
          </p>

          <div className="login-benefits">
            <div>✓ Report community issues</div>
            <div>✓ Track complaint updates</div>
            <div>✓ Stay connected with your community</div>
          </div>
        </div>

        <p className="login-footer">
          Making every neighbourhood better.
        </p>
      </section>

      <section className="login-side">
        <div className="login-card">
          <a className="login-back" href="/">
            ← Back to homepage
          </a>

          <h2>Welcome back!</h2>
          <p className="login-subtitle">
            Sign in to continue to FixNear.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-role">Sign in as</label>
            <select
              id="login-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="Citizen">Citizen</option>
              <option value="Department Officer">
                Department Officer
              </option>
            </select>

            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-submit" type="submit">
              Sign In
            </button>
          </form>

          <p className="login-register">
            New to FixNear?{' '}
            <a href="/register">Create an account</a>
          </p>

          <p className="login-note">
            Demo only: sign-in details are not verified or saved.
          </p>
        </div>
      </section>
    </main>
  );
}
