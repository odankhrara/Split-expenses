import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { User } from '../types';
import './Layout.css';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.users.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const toggleMember = (id: number) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    api.groups
      .create({ name: name.trim(), currency, member_ids: memberIds })
      .then((g) => navigate(`/groups/${g.id}`))
      .catch((err) => {
        setError(err.message);
        setSubmitting(false);
      });
  };

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1>Create group</h1>
      <form onSubmit={handleSubmit} className="form">
        {error && <p className="error">{error}</p>}
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Currency
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>Members</legend>
          {users.length === 0 ? (
            <p className="muted">
              No people yet. <Link to="/people">Add people</Link> first, then come back to create a group.
            </p>
          ) : (
            users.map((u) => (
              <label key={u.id} className="checkbox checkbox-row">
                <input
                  type="checkbox"
                  checked={memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  aria-label={`Select ${u.name}`}
                />
                <span>{u.name}</span>
              </label>
            ))
          )}
        </fieldset>
        <button type="submit" disabled={submitting}>
          Create group
        </button>
      </form>
    </div>
  );
}
