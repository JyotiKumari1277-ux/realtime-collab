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
  <div className="min-h-screen bg-cream font-sans">
    {/* Top bar */}
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

      <div className="max-w-5xl mx-auto p-8">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Create + Join forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <form onSubmit={handleCreateRoom} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-ink mb-3">Create a new workspace</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Workspace name"
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

          <form onSubmit={handleJoinRoom} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-ink mb-3">Join with a code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room code"
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
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">No workspaces yet. Create one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <div
                key={room._id}
                onClick={() => navigate(`/room/${room._id}`)}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-indigo/30 transition"
              >
                <div className={`w-9 h-9 rounded-lg ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-semibold text-sm mb-3`}>
                  {initials(room.name)}
                </div>
                <h3 className="font-serif font-semibold text-ink">{room.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Code: {room.roomCode}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {room.members.length} member{room.members.length > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;