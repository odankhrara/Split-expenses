const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const api = {
  users: {
    list: () => request<import('./types').User[] | null>('/users').then((d) => (Array.isArray(d) ? d : [])),
    create: (body: { name: string; email: string }) =>
      request<import('./types').User>('/users', { method: 'POST', body: JSON.stringify(body) }),
  },
  groups: {
    list: () => request<import('./types').Group[] | null>('/groups').then((d) => (Array.isArray(d) ? d : [])),
    get: (id: number) => request<import('./types').Group>(`/groups/${id}`),
    create: (body: { name: string; currency?: string; member_ids?: number[] }) =>
      request<import('./types').Group>('/groups', { method: 'POST', body: JSON.stringify(body) }),
    addMember: (groupId: number, userId: number) =>
      request<{ group_id: number; user_id: number }>(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
  },
  expenses: {
    list: (groupId: number) =>
      request<import('./types').Expense[]>(`/groups/${groupId}/expenses`),
    create: (
      groupId: number,
      body: {
        payer_id: number;
        amount_cents: number;
        description: string;
        splits?: import('./types').SplitPart[];
      }
    ) =>
      request<import('./types').Expense>(`/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  balances: {
    get: (groupId: number) =>
      request<{ balances: import('./types').Balance[] }>(`/groups/${groupId}/balances`),
  },
  settlements: {
    list: (groupId: number) =>
      request<import('./types').Settlement[]>(`/groups/${groupId}/settlements`),
    create: (
      groupId: number,
      body: { from_user_id: number; to_user_id: number; amount_cents: number }
    ) =>
      request<import('./types').Settlement>(`/groups/${groupId}/settlements`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
};

export function centsToDisplay(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
