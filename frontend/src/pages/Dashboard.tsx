import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Group } from '../types';
import './Layout.css';

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.groups
      .list()
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading groups…</div>;
  if (error) return <div className="page error">Error: {error}</div>;

  return (
    <div className="page">
      <h1>Groups</h1>
      <nav className="nav-links">
        <Link to="/people">People</Link>
        <Link to="/groups/new">New group</Link>
      </nav>
      {(groups ?? []).length === 0 ? (
        <p>No groups yet. Create one to start splitting bills.</p>
      ) : (
        <ul className="card-list">
          {(groups ?? []).map((g) => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className="card">
                <strong>{g.name}</strong>
                <span>{g.currency} · {g.member_ids?.length ?? 0} members</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
