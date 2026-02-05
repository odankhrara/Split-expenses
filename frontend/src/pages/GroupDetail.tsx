import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, centsToDisplay } from '../api';
import type { Group, User, Expense, Balance } from '../types';
import './Layout.css';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMemberId, setAddMemberId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const load = () => {
    if (!id || isNaN(groupId)) return;
    setLoading(true);
    Promise.all([
      api.groups.get(groupId),
      api.users.list(),
      api.expenses.list(groupId),
      api.balances.get(groupId),
    ])
      .then(([g, u, e, b]) => {
        setGroup(g ? { ...g, member_ids: g.member_ids ?? [] } : null);
        setUsers(Array.isArray(u) ? u : []);
        setExpenses(Array.isArray(e) ? e : []);
        setBalances(Array.isArray(b?.balances) ? b.balances : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [id, groupId]);

  const userName = (uid: number) => users.find((u) => u.id === uid)?.name ?? `User ${uid}`;

  if (loading && !group) return <div className="page">Loading…</div>;
  if (error || !group) return <div className="page error">{error || 'Group not found'}</div>;

  return (
    <div className="page">
      <h1>{group.name}</h1>
      <nav className="nav-links">
        <Link to="/">Groups</Link>
        <Link to={`/groups/${groupId}/expenses/new`}>Add expense</Link>
        <Link to={`/groups/${groupId}/balances`}>Balances</Link>
        <Link to={`/groups/${groupId}/settle`}>Settle up</Link>
      </nav>
      <section>
        <h2>Members</h2>
        {addMemberError && <p className="error">{addMemberError}</p>}
        <div className="form-inline">
          <select
            value={addMemberId}
            onChange={(e) => setAddMemberId(e.target.value)}
          >
            <option value="">Add member…</option>
            {users
              .filter((u) => !(group.member_ids ?? []).includes(u.id))
              .map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!addMemberId || adding}
            onClick={() => {
              if (!addMemberId) return;
              setAdding(true);
              setAddMemberError(null);
              api.groups
                .addMember(groupId, Number(addMemberId))
                .then(() => {
                  setAddMemberId('');
                  load();
                })
                .catch((err) => setAddMemberError(err.message))
                .finally(() => setAdding(false));
            }}
          >
            Add
          </button>
        </div>
        <ul className="card-list">
          {(group.member_ids ?? []).map((uid) => (
            <li key={uid}>
              <span className="card">{userName(uid)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Expenses</h2>
        {expenses.length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          <ul className="card-list">
            {expenses.map((e) => (
              <li key={e.id}>
                <span className="card">
                  <strong>{e.description}</strong> · {centsToDisplay(e.amount_cents, group.currency)} paid by {userName(e.payer_id)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>Balances (live)</h2>
        <button type="button" onClick={load} className="btn-sm">Refresh</button>
        {balances.length === 0 ? (
          <p>No balances (add an expense first).</p>
        ) : (
          <ul className="card-list">
            {balances.map((b) => (
              <li key={b.user_id}>
                <span className="card">
                  {userName(b.user_id)}: {b.amount_cents >= 0 ? 'owed' : 'owes'} {centsToDisplay(Math.abs(b.amount_cents), group.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
