import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';
import { API_URL } from '../config';

function RoomPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [descDraft, setDescDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickAddColumn, setQuickAddColumn] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);

  const config = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const fetchRoom = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms/${id}`, config);
      setRoom(res.data);
    } catch (err) {
      setError('Could not load this workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks/${id}`, config);
      setTasks(res.data);
    } catch (err) {
      console.error('Could not load tasks');
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/activity/${id}`, config);
      setActivities(res.data);
    } catch (err) {
      console.error('Could not load activity');
    }
  };

  useEffect(() => {
    fetchRoom();
    fetchTasks();
    fetchActivities();

    socket.emit('joinRoom', {
      roomId: id,
      userId: user._id || user.id,
      userName: user.name,
    });

    socket.on('presenceUpdate', (usersList) => {
      setOnlineUsers(usersList);
    });

    socket.on('taskCreated', (task) => {
      setTasks((prev) => [...prev, task]);
      fetchActivities();
      setNotifications((prev) => [
        { id: Date.now(), text: `New task "${task.title}" was created`, time: new Date() },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      setSelectedTask((prev) => {
        if (prev && prev._id === updatedTask._id) {
          return updatedTask;
        }
        return prev;
      });
      fetchActivities();
      setNotifications((prev) => [
        { id: Date.now(), text: `Task "${updatedTask.title}" was updated`, time: new Date() },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('taskDeleted', ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setSelectedTask((prev) => (prev && prev._id === taskId ? null : prev));
      fetchActivities();
      setNotifications((prev) => [
        { id: Date.now(), text: `A task was deleted`, time: new Date() },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('presenceUpdate');
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await axios.post(
        `${API_URL}/api/tasks`,
        { roomId: id, title: newTitle },
        config
      );
      setNewTitle('');
    } catch (err) {
      console.error('Could not add task');
    }
  };

  const handleQuickAddToColumn = async (colKey) => {
    if (!quickAddTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/tasks`,
        { roomId: id, title: quickAddTitle },
        config
      );
      if (colKey !== 'todo') {
        await axios.put(
          `${API_URL}/api/tasks/${res.data._id}`,
          { status: colKey, version: res.data.version },
          config
        );
      }
    } catch (err) {
      console.error('Could not add task');
    } finally {
      setQuickAddTitle('');
      setQuickAddColumn(null);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/tasks/${task._id}`,
        { status: newStatus, version: task.version },
        config
      );
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Ye task kisi aur ne update kar diya hai — page refresh karo.');
        fetchTasks();
      }
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, config);
    } catch (err) {
      console.error('Could not delete task');
    }
  };

  const openTaskPanel = (task) => {
    setSelectedTask(task);
    setDescDraft(task.description || '');
    setConflictWarning(false);
  };

  const closeTaskPanel = () => {
    setSelectedTask(null);
    setDescDraft('');
    setConflictWarning(false);
  };

  const handlePriorityChange = async (newPriority) => {
    if (!selectedTask) return;
    try {
      const res = await axios.put(
        `${API_URL}/api/tasks/${selectedTask._id}`,
        { priority: newPriority, version: selectedTask.version },
        config
      );
      setSelectedTask(res.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictWarning(true);
      } else {
        console.error('Could not update priority');
      }
    }
  };

  const handleDescriptionSave = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/tasks/${selectedTask._id}`,
        { description: descDraft, version: selectedTask.version },
        config
      );
      setSelectedTask(res.data);
      setConflictWarning(false);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictWarning(true);
      } else {
        console.error('Could not update description');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConflictRefresh = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks/${id}`, config);
      setTasks(res.data);
      const latest = res.data.find((t) => t._id === selectedTask._id);
      if (latest) {
        setSelectedTask(latest);
        setDescDraft(latest.description || '');
      }
    } catch (err) {
      console.error('Could not refresh task');
    } finally {
      setConflictWarning(false);
    }
  };

  const handleRestore = async (historyIndex) => {
    if (!selectedTask) return;
    try {
      const res = await axios.put(
        `${API_URL}/api/tasks/${selectedTask._id}/restore/${historyIndex}`,
        {},
        config
      );
      setSelectedTask(res.data);
      setDescDraft(res.data.description || '');
    } catch (err) {
      alert('Could not restore this version.');
    }
  };

  const handleDeleteFromPanel = async () => {
    if (!selectedTask) return;
    await handleDelete(selectedTask._id);
    closeTaskPanel();
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/rooms/${id}/members/${memberId}/role`,
        { role: newRole },
        config
      );
      setRoom(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update role');
    }
  };

  const groupActivities = (list) => {
    const grouped = [];
    for (const act of list) {
      const last = grouped[grouped.length - 1];
      if (
        last &&
        last.user?.name === act.user?.name &&
        last.action === act.action &&
        last.task === act.task
      ) {
        last.count += 1;
        last.latestTime = act.createdAt;
      } else {
        grouped.push({ ...act, count: 1, latestTime: act.createdAt });
      }
    }
    return grouped;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const data = tasks.map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      description: t.description || '',
      createdAt: t.createdAt,
    }));
    downloadFile(
      JSON.stringify(data, null, 2),
      `${room?.name || 'tasks'}-export.json`,
      'application/json'
    );
    setShowExportMenu(false);
  };

  const exportAsCSV = () => {
    const headers = ['Title', 'Status', 'Priority', 'Description', 'Created At'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = tasks.map((t) =>
      [t.title, t.status, t.priority, t.description || '', t.createdAt]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `${room?.name || 'tasks'}-export.csv`, 'text/csv');
    setShowExportMenu(false);
  };

  if (loading) return <p className="p-6 text-slate-500 bg-cream min-h-screen">Loading...</p>;
  if (error) return <p className="p-6 text-red-600 bg-cream min-h-screen">{error}</p>;

  const columns = [
    { key: 'todo', label: 'To Do', dot: 'bg-slate-400', border: 'border-t-slate-400' },
    { key: 'in-progress', label: 'In Progress', dot: 'bg-amber-400', border: 'border-t-amber-400' },
    { key: 'done', label: 'Done', dot: 'bg-teal-500', border: 'border-t-teal-500' },
  ];

  const priorities = [
    { key: 'low', label: 'Low', color: 'text-teal-700 bg-teal-50' },
    { key: 'medium', label: 'Medium', color: 'text-amber-700 bg-amber-50' },
    { key: 'high', label: 'High', color: 'text-red-700 bg-red-50' },
  ];

  const initials = (name) => (name ? name.charAt(0).toUpperCase() : '?');
  const avatarColors = ['bg-indigo', 'bg-teal-600', 'bg-amber-500', 'bg-rose-500'];

  const tabs = [
    { key: 'board', label: 'Board' },
    { key: 'activity', label: 'Activity' },
    { key: 'members', label: 'Members' },
  ];

  const myRole = room?.members?.find(
    (m) => m.user?._id === (user._id || user.id)
  )?.role;
  const isOwner = myRole === 'owner';
  const isViewer = myRole === 'viewer';

  const taskActivities = selectedTask
    ? activities.filter((a) => a.task === selectedTask._id)
    : [];

  return (
    <div className="min-h-screen bg-cream font-sans flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-slate-100 h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-purple-500 flex items-center justify-center text-white text-base">
            ⚡
          </div>
          <span className="font-serif text-lg font-bold text-ink">Flock</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
<button
  onClick={() => {
    setActiveTab('dashboard');
    navigate('/dashboard'); // यह आपको डैशबोर्ड पेज पर ले जाएगा
  }}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'dashboard'
      ? 'bg-[#1f2937] text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-black'
  }`}
>
  <span className="text-base">🏠</span> Dashboard
</button>
<button
  onClick={() => {
    setActiveTab('workspaces'); // बस यही रखें
    // navigate('/') वाली लाइन को हटा दें
  }}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'workspaces'
      ? 'bg-[#1f2937] text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-black'
  }`}
>
  <span className="text-base">🏢</span> Workspaces
</button>
<button
  onClick={() => setActiveTab('members')}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'members'
      ? 'bg-[#1f2937] text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-black'
  }`}
>
  <span className="text-base">👥</span> Members
</button>
          <button
  onClick={() => setActiveTab('activity')}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'activity'
      ? 'bg-[#1f2937] text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-black'
  }`}
>
  <span className="text-base">📈</span> Activity
  {activities.length > 0 && (
    <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeTab === 'activity' ? 'bg-white/20' : 'bg-slate-100'}`}>
      {activities.length}
    </span>
  )}
</button>
          <button
  onClick={() => setActiveTab('settings')}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'settings'
      ? 'bg-[#1f2937] text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-black'
  }`}
>
  <span className="text-base">⚙️</span> Settings
</button>
          
        </nav>

        <div className="px-4 pb-5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-indigo text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
<button
  onClick={() => {
    logout();
    navigate('/login');
  }}
  className="w-full text-center px-4 py-3 mt-4 bg-[#1f2937] text-white font-medium rounded-lg text-sm transition-all hover:bg-[#2d3748]"
>
  Logout
</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-gradient-to-r from-ink via-[#241f4d] to-indigo-dark text-white px-8 py-6">
          <div className="mx-auto flex justify-between items-start">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-indigo-300 hover:text-indigo-200 mb-2 transition"
              >
                ← Back to Dashboard
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-xl font-semibold">{room?.name}</h1>
                <span className="text-[11px] font-medium bg-white/10 text-white/80 px-2.5 py-1 rounded-full">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                Code: {room?.roomCode}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room?.roomCode || '');
                  }}
                  className="text-slate-400 hover:text-white transition"
                  title="Copy code"
                >
                  ⧉
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative mr-3">
                <button
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    if (!showNotifications) setUnreadCount(0);
                  }}
                  className="relative text-white/80 hover:text-white text-lg"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-10"
                    ></div>
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="px-4 py-2.5 text-xs text-ink border-b border-slate-50 last:border-0"
                          >
                            <p>{n.text}</p>
                            <p className="text-slate-400 mt-0.5">
                              {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                {onlineUsers.length} online
              </span>
              <div className="flex -space-x-2 mr-2">
                {onlineUsers.map((u, i) => (
                  <div
                    key={u.userId + i}
                    title={u.userName}
                    className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} border-2 border-ink flex items-center justify-center text-xs font-semibold`}
                  >
                    {initials(u.userName)}
                  </div>
                ))}
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo flex items-center justify-center text-sm font-semibold border-2 border-white/20">
                {initials(user?.name)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-8">
          <div className="mx-auto flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-indigo text-indigo'
                    : 'border-transparent text-slate-500 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto p-8 w-full flex-1">
        {activeTab === 'board' && (
          <>
            <div className="flex gap-2 mb-6">
              {!isViewer && (
                <form onSubmit={handleAddTask} className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo transition text-lg leading-none"
                    title="Add task"
                  >
                    ⊕
                  </button>
                </form>
              )}

              {!isViewer && (
                <button
                  onClick={handleAddTask}
                  className="bg-indigo text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-dark transition shrink-0"
                >
                  + Add Task
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  className="border border-slate-200 bg-white text-ink px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition shrink-0"
                >
                  Export ▾
                </button>
                {showExportMenu && (
                  <>
                    <div
                      onClick={() => setShowExportMenu(false)}
                      className="fixed inset-0 z-10"
                    ></div>
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={exportAsCSV}
                        className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-slate-50 transition"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={exportAsJSON}
                        className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-slate-50 transition border-t border-slate-100"
                      >
                        Export as JSON
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="bg-white/60 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></span>
                      <h2 className="font-serif font-semibold text-sm text-ink">{col.label}</h2>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                        {colTasks.length}
                      </span>
                    </div>

                    {colTasks.map((task) => {
                      const priorityInfo = priorities.find((p) => p.key === task.priority);
                      return (
                        <div
                          key={task._id}
                          onClick={() => openTaskPanel(task)}
                          className={`relative bg-white rounded-lg p-3 mb-2 shadow-sm border-t-2 ${col.border} hover:shadow-md transition cursor-pointer`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-ink">{task.title}</p>
                            {!isViewer && (
                              <div className="relative shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuTaskId((prev) => (prev === task._id ? null : task._id));
                                  }}
                                  className="text-slate-300 hover:text-slate-500 leading-none px-1"
                                >
                                  ⋮
                                </button>
                                {openMenuTaskId === task._id && (
                                  <>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuTaskId(null);
                                      }}
                                      className="fixed inset-0 z-10"
                                    ></div>
                                    <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuTaskId(null);
                                          openTaskPanel(task);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-slate-50 transition"
                                      >
                                        View details
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuTaskId(null);
                                          handleDelete(task._id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition border-t border-slate-100"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {priorityInfo && (
                            <span
                              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${priorityInfo.color}`}
                            >
                              {priorityInfo.label}
                            </span>
                          )}

                          <div className="flex gap-3 mt-2.5 text-xs items-center">
                            {!isViewer && col.key !== 'todo' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(
                                    task,
                                    col.key === 'in-progress' ? 'todo' : 'in-progress'
                                  );
                                }}
                                className="text-indigo font-medium"
                              >
                                ← Move
                              </button>
                            )}
                            {!isViewer && col.key !== 'done' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(
                                    task,
                                    col.key === 'todo' ? 'in-progress' : 'done'
                                  );
                                }}
                                className="text-teal-600 font-medium"
                              >
                                Move →
                              </button>
                            )}
                            {!isViewer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task._id);
                                }}
                                className="text-red-400 hover:text-red-600 ml-auto"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && quickAddColumn !== col.key && (
                      <div className="flex flex-col items-center text-center py-6 px-2">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-xs font-medium text-slate-400">
                          {col.key === 'done' ? 'No tasks yet' : 'No tasks'}
                        </p>
                        {col.key === 'done' && (
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Great job! You've completed everything.
                          </p>
                        )}
                      </div>
                    )}

                    {!isViewer && (
                      <>
                        {quickAddColumn === col.key ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleQuickAddToColumn(col.key);
                            }}
                            className="mt-1"
                          >
                            <input
                              autoFocus
                              type="text"
                              value={quickAddTitle}
                              onChange={(e) => setQuickAddTitle(e.target.value)}
                              onBlur={() => handleQuickAddToColumn(col.key)}
                              placeholder="Task title..."
                              className="w-full border border-indigo/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo"
                            />
                          </form>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickAddColumn(col.key);
                              setQuickAddTitle('');
                            }}
                            className="w-full text-left px-3 py-2.5 mt-1 text-xs font-medium text-slate-400 hover:text-indigo hover:bg-white rounded-lg border border-dashed border-slate-200 hover:border-indigo/40 transition"
                          >
                            + Add another task
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink mb-6">Activity</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {groupActivities(activities).map((act, i) => (
                  <div
                    key={act._id || i}
                    className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(act.user?.name)}
                    </div>
                    <div>
                      <p className="text-sm text-ink">
                        <span className="font-medium text-indigo">{act.user?.name || 'Someone'}</span>{' '}
                        <span className="text-slate-600">
                          {act.action}
                          {act.count > 1 && (
                            <span className="text-xs text-slate-400 ml-1">(×{act.count})</span>
                          )}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(act.latestTime).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-ink">Members</h2>
              <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                {room?.members?.length || 0} member{room?.members?.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 mb-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Invite new member
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Share this code — anyone with it can join this workspace.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider bg-slate-50 text-ink">
                  {room?.roomCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room?.roomCode || '');
                    alert('Room code copied!');
                  }}
                  className="bg-indigo text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-dark transition"
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name or email..."
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
              {room?.members
                ?.filter((m) => {
                  const q = memberSearch.toLowerCase();
                  return (
                    m.user?.name?.toLowerCase().includes(q) ||
                    m.user?.email?.toLowerCase().includes(q)
                  );
                })
                .map((m, i) => (
                  <div key={m.user?._id || i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center text-sm font-semibold`}
                      >
                        {initials(m.user?.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{m.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                    {isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user?._id, e.target.value)}
                        className="text-xs font-medium text-indigo bg-indigo/10 px-2.5 py-1.5 rounded-full uppercase border-none focus:outline-none focus:ring-2 focus:ring-indigo cursor-pointer"
                      >
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs font-medium text-indigo bg-indigo/10 px-2.5 py-1 rounded-full uppercase">
                        {m.role}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-8 py-4">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Flock. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-ink transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-ink transition cursor-pointer">Terms of Service</span>
              <span className="hover:text-ink transition cursor-pointer">Help</span>
            </div>
          </div>
        </footer>
      </div>

      {selectedTask && (
        <>
          <div
            onClick={closeTaskPanel}
            className="fixed inset-0 bg-black/20 z-40"
          ></div>

          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <button
                onClick={handleDeleteFromPanel}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Delete
              </button>
              <button
                onClick={closeTaskPanel}
                className="text-slate-400 hover:text-ink text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5">
                {selectedTask.title}
              </h2>

              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Priority
                </label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handlePriorityChange(p.key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                        selectedTask.priority === p.key
                          ? p.color
                          : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {conflictWarning && (
                <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-lg px-3 py-2 mb-3 flex items-center justify-between gap-2">
                  <span>⚠️ Kisi aur ne is task ko update kiya hai. Tumhara draft save nahi hua.</span>
                  <button
                    onClick={handleConflictRefresh}
                    className="font-semibold underline shrink-0"
                  >
                    Refresh
                  </button>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={handleDescriptionSave}
                  rows={5}
                  placeholder="Add a description..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent resize-none"
                />
                {saving && <p className="text-xs text-slate-400 mt-1">Saving...</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Activity on this task
                </label>
                {taskActivities.length === 0 ? (
                  <p className="text-xs text-slate-400">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {groupActivities(taskActivities).map((act, i) => (
                      <p key={i} className="text-xs text-slate-500">
                        <span className="font-medium text-indigo">{act.user?.name}</span> {act.action}
                        {act.count > 1 && <span className="text-slate-400"> (×{act.count})</span>} ·{' '}
                        {new Date(act.latestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Version History ({selectedTask.history?.length || 0})
                </label>
                {!selectedTask.history || selectedTask.history.length === 0 ? (
                  <p className="text-xs text-slate-400">No previous versions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {[...selectedTask.history].reverse().map((h, i) => {
                      const originalIndex = selectedTask.history.length - 1 - i;
                      return (
                        <div
                          key={originalIndex}
                          className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-100"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-slate-400">
                              {new Date(h.updatedAt).toLocaleString([], {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <button
                              onClick={() => handleRestore(originalIndex)}
                              className="text-indigo font-semibold hover:underline"
                            >
                              Restore
                            </button>
                          </div>
                          <p className="text-slate-600">
                            Status: <span className="font-medium">{h.status}</span> · Priority:{' '}
                            <span className="font-medium">{h.priority}</span>
                          </p>
                          {h.description && (
                            <p className="text-slate-500 mt-1 italic truncate">"{h.description}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RoomPage;