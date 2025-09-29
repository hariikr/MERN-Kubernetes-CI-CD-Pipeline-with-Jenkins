import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [health, setHealth] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    try {
      setLoading(true);
      await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      });
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
  };

  const updateUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !name.trim() || !email.trim()) return;

    try {
      setLoading(true);
      await fetch(`${API_URL}/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      });
      setName('');
      setEmail('');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
  };

  useEffect(() => {
    // Check backend health
    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(err => setHealth('Backend unavailable'));

    // Fetch users
    fetchUsers();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🧑‍💼 User Management System</h1>
          <div className={`health-status ${health.includes('unavailable') ? 'offline' : 'online'}`}>
            <span className="status-dot"></span>
            {health || 'Checking...'}
          </div>
        </header>

        <div className="content">
          <div className="form-section">
            <h2>{editingUser ? '✏️ Edit User' : '➕ Add New User'}</h2>
            <form onSubmit={editingUser ? updateUser : addUser} className="user-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  id="name"
                  type="text"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter full name" 
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter email address" 
                  required 
                />
              </div>
              <div className="form-buttons">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? '⏳ Loading...' : editingUser ? '✅ Update User' : '➕ Add User'}
                </button>
                {editingUser && (
                  <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                    ❌ Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="users-section">
            <h2>👥 Users List ({users.length})</h2>
            {loading && <div className="loading">Loading...</div>}
            {users.length === 0 && !loading ? (
              <div className="empty-state">
                <p>📝 No users found. Add your first user!</p>
              </div>
            ) : (
              <div className="users-grid">
                {users.map(user => (
                  <div key={user._id} className="user-card">
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <small>ID: {user._id}</small>
                    </div>
                    <div className="user-actions">
                      <button 
                        onClick={() => startEdit(user)} 
                        className="btn btn-edit"
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteUser(user._id)} 
                        className="btn btn-delete"
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
