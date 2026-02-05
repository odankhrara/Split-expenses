import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, centsToDisplay } from '../api';
import type { Group, User, Balance } from '../types';
import './Layout.css';

export default function Balances() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id || isNaN(groupId)) return;
    setLoading(true);
    Promise.all([api.groups.get(groupId), api.users.list(), api.balances.get(groupId)])
      .then(([g, u, b]) => {
        setGroup(g);
        setUsers(u);
        setBalances(b.balances);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id, groupId]);

  const userName = (uid: number) => users.find((u) => u.id === uid)?.name ?? `User ${uid}`;

  if (loading && !group) return <div className="page">Loading…</div>;
  if (error || !group) return <div className="page error">{error || 'Group not found'}</div>;

  return (
    <div className="page">
      <h1>Balances · {group.name}</h1>
      <nav className="nav-links">
        <Link to={`/groups/${groupId}`}>Back to group</Link>
        <Link to={`/groups/${groupId}/settle`}>Settle up</Link>
      </nav>
      <p className="muted">Updates every 5s. Positive = you are owed; negative = you owe.</p>
      {balances.length === 0 ? (
        <p>No balances yet. Add an expense first.</p>
      ) : (
        <ul className="card-list">
          {balances.map((b) => (
            <li key={b.user_id}>
              <span className={`card ${b.amount_cents >= 0 ? 'positive' : 'negative'}`}>
                <strong>{userName(b.user_id)}</strong>: {b.amount_cents >= 0 ? 'owed' : 'owes'}{' '}
                {centsToDisplay(Math.abs(b.amount_cents), group.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
