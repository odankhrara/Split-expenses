import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { User } from '../types';
import './Layout.css';

export default function People() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.users
      .list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    api.users
      .create({ name: name.trim(), email: email.trim() })
      .then(() => {
        setName('');
        setEmail('');
        load();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  if (loading && users.length === 0)
    return <div className="page">Loading people…</div>;

  return (
    <div className="page">
      <h1>People</h1>
      <nav className="nav-links">
        <Link to="/">Groups</Link>
        <Link to="/groups/new">New group</Link>
      </nav>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-inline">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          Add person
        </button>
      </form>
      <ul className="card-list">
        {users.map((u) => (
          <li key={u.id}>
            <span className="card">
              <strong>{u.name}</strong> · {u.email}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
