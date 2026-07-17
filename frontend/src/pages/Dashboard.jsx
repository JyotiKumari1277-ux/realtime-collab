import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const config = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms`, config);
      setRooms(res.data);
    } catch (err) {
      setError('Could not load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/rooms`, { name: newRoomName }, config);
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      setError('Could not create room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/rooms/join`, { roomCode: joinCode.trim().toUpperCase() }, config);
      setJoinCode('');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarColors = ['bg-indigo', 'bg-teal-600', 'bg-amber-500', 'bg-rose-500'];
  const initials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  return (
    <div className="min-h-screen bg-cream font-sans flex flex-col">
      {/* Top bar — Flock + Logout kept exactly as before */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 grid grid-cols-3 items-center">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">Flock</h2>
        </div>
        <div className="flex justify-center">
          <span className="text-base text-slate-600 bg-indigo/10 px-4 py-1.5 rounded-full">
            👋 Welcome, <span className="font-semibold text-indigo">{user.name}</span>
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-900 transition shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-8">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Hero / welcome section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">
              Welcome back, <span className="text-indigo">{user.name}</span> 👋
            </h1>
            <p className="text-slate-500 text-base">
              Collaborate in real-time and get things done together.
            </p>
          </div>

          {/* Simple decorative illustration */}
          <div className="hidden md:flex items-center justify-center w-56 h-40 shrink-0">
            <svg viewBox="0 0 200 140" className="w-full h-full">
              <circle cx="100" cy="70" r="65" fill="#EEF0FF" />
              <rect x="40" y="45" width="90" height="60" rx="8" fill="#FFFFFF" stroke="#C7CBFA" strokeWidth="2" />
              <rect x="52" y="58" width="45" height="6" rx="3" fill="#6C63FF" />
              <rect x="52" y="70" width="30" height="6" rx="3" fill="#CBD5E1" />
              <circle cx="140" cy="95" r="18" fill="#0D9488" />
              <circle cx="140" cy="90" r="7" fill="#FFFFFF" />
              <path d="M128 108c0-8 6-13 12-13s12 5 12 13" fill="#FFFFFF" />
              <circle cx="60" cy="100" r="16" fill="#6C63FF" />
              <circle cx="60" cy="95" r="6" fill="#FFFFFF" />
              <path d="M50 112c0-7 5-11 10-11s10 4 10 11" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Create + Join forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-ink mb-1">Create a new workspace</h2>
            <p className="text-sm text-slate-400 mb-4">Start a new project and invite your team.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter workspace name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-indigo text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-dark transition disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>

          <form onSubmit={handleJoinRoom} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-ink mb-1">Join with a code</h2>
            <p className="text-sm text-slate-400 mb-4">Enter a room code to join an existing workspace.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Room list */}
        <h2 className="font-serif text-lg font-semibold text-ink mb-4">Your Workspaces</h2>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-400 text-sm">No workspaces yet. Create one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <div
                key={room._id}
                onClick={() => navigate(`/room/${room._id}`)}
                className="relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-indigo/30 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-semibold text-sm`}>
                    {initials(room.name)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === room._id ? null : room._id);
                    }}
                    className="text-slate-400 hover:text-slate-600 px-1"
                  >
                    ⋮
                  </button>
                </div>

                <h3 className="font-serif font-semibold text-ink">{room.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Code: {room.roomCode}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span>👥</span> {room.members.length} member{room.members.length > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-8 py-5 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Flock. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
