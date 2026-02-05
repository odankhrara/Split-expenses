import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, centsToDisplay } from '../api';
import type { Group, User } from '../types';
import './Layout.css';

export default function SettleUp() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [fromId, setFromId] = useState<number | ''>('');
  const [toId, setToId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(groupId)) return;
    Promise.all([api.groups.get(groupId), api.users.list()]).then(([g, u]) => {
      setGroup(g);
      setUsers(u);
    });
  }, [id, groupId]);

  const amountCents = Math.round(parseFloat(amount || '0') * 100);
  const members = group?.member_ids ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || fromId === toId || amountCents <= 0) return;
    setSubmitting(true);
    setError(null);
    api.settlements
      .create(groupId, {
        from_user_id: Number(fromId),
        to_user_id: Number(toId),
        amount_cents: amountCents,
      })
      .then(() => setAmount(''))
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  const userName = (uid: number) => users.find((u) => u.id === uid)?.name ?? `User ${uid}`;

  if (!group) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1>Settle up · {group.name}</h1>
      <nav className="nav-links">
        <Link to={`/groups/${groupId}`}>Back to group</Link>
        <Link to={`/groups/${groupId}/balances`}>Balances</Link>
      </nav>
      {error && <p className="error">{error}</p>}
      <p className="muted">Record a payment: who paid whom. Partial payments are supported.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          From (payer)
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Select</option>
            {members.map((uid) => (
              <option key={uid} value={uid}>
                {userName(uid)}
              </option>
            ))}
          </select>
        </label>
        <label>
          To (receiver)
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Select</option>
            {members.map((uid) => (
              <option key={uid} value={uid}>
                {userName(uid)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {amount && <small>= {centsToDisplay(amountCents, group.currency)}</small>}
        </label>
        <button type="submit" disabled={submitting || fromId === toId}>
          Record payment
        </button>
      </form>
    </div>
  );
}
