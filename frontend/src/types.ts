export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  currency: string;
  member_ids?: number[];
}

export interface SplitPart {
  user_id: number;
  amount_cents: number;
}

export interface Expense {
  id: number;
  group_id: number;
  payer_id: number;
  amount_cents: number;
  description: string;
  splits?: SplitPart[];
}

export interface Balance {
  user_id: number;
  amount_cents: number;
}

export interface Settlement {
  id: number;
  group_id: number;
  from_user_id: number;
  to_user_id: number;
  amount_cents: number;
}
