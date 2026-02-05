import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, centsToDisplay } from '../api';
import type { Group, User } from '../types';
import './Layout.css';

export default function AddExpense() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payerId, setPayerId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [evenSplit, setEvenSplit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(groupId)) return;
    Promise.all([api.groups.get(groupId), api.users.list()]).then(([g, u]) => {
      setGroup(g);
      setUsers(u);
    });
  }, [id, groupId]);
  const userName = (uid: number) => users.find((u) => u.id === uid)?.name ?? `User ${uid}`;

  const members = group?.member_ids ?? [];
  const amountCents = Math.round(parseFloat(amount || '0') * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerId || amountCents <= 0 || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    const body: { payer_id: number; amount_cents: number; description: string; splits?: { user_id: number; amount_cents: number }[] } = {
      payer_id: Number(payerId),
      amount_cents: amountCents,
      description: description.trim(),
    };
    if (!evenSplit && members.length > 0) {
      const perPerson = Math.floor(amountCents / members.length);
      const rem = amountCents - perPerson * members.length;
      body.splits = members.map((uid, i) => ({
        user_id: uid,
        amount_cents: perPerson + (i < rem ? 1 : 0),
      }));
    }
    api.expenses
      .create(groupId, body)
      .then(() => {
        setAmount('');
        setDescription('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  if (!group) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1>Add expense · {group.name}</h1>
      <nav className="nav-links">
        <Link to={`/groups/${groupId}`}>Back to group</Link>
      </nav>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {amount && (
            <small>= {amountCents} cents ({centsToDisplay(amountCents, group.currency)})</small>
          )}
        </label>
        <label>
          Paid by
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value ? Number(e.target.value) : '')}
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
        <label className="checkbox">
          <input
            type="checkbox"
            checked={evenSplit}
            onChange={(e) => setEvenSplit(e.target.checked)}
          />
          Split evenly among all members (backend will round to avoid drift)
        </label>
        <button type="submit" disabled={submitting}>
          Add expense
        </button>
      </form>
    </div>
  );
}
