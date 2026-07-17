import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-ink text-white p-10">
          <div>
            <h2 className="font-serif text-2xl font-semibold mb-1">Flock</h2>
            <span className="text-xs uppercase tracking-wider text-indigo-300">
              Real-time collaboration
            </span>
          </div>
          <div>
            <h3 className="font-serif text-3xl leading-tight mb-3">
              Welcome back.
            </h3>
            <p className="text-sm text-slate-300">
              Your team's work is already moving — sign in to see it live.
            </p>
          </div>
          <p className="text-xs text-slate-500">Your data stays yours — encrypted, always.</p>
        </div>

        <div className="p-10 flex flex-col justify-center">
          <h1 className="font-serif text-2xl font-semibold text-ink mb-1">
            Sign in
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Pick up right where you left off.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-dark transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;