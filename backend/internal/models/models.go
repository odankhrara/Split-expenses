package models

type User struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type CreateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Group struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Currency  string  `json:"currency"`
	MemberIDs []int64 `json:"member_ids,omitempty"`
}

type CreateGroupRequest struct {
	Name      string  `json:"name"`
	Currency  string  `json:"currency"`
	MemberIDs []int64 `json:"member_ids,omitempty"`
}

type AddMemberRequest struct {
	UserID int64 `json:"user_id"`
}

type Expense struct {
	ID          int64       `json:"id"`
	GroupID     int64       `json:"group_id"`
	PayerID     int64       `json:"payer_id"`
	AmountCents int64       `json:"amount_cents"`
	Description string      `json:"description"`
	Splits      []SplitPart `json:"splits,omitempty"`
}

type SplitPart struct {
	UserID      int64 `json:"user_id"`
	AmountCents int64 `json:"amount_cents"`
}

type CreateExpenseRequest struct {
	PayerID     int64       `json:"payer_id"`
	AmountCents int64       `json:"amount_cents"`
	Description string      `json:"description"`
	Splits      []SplitPart `json:"splits,omitempty"`
}

type Settlement struct {
	ID          int64 `json:"id"`
	GroupID     int64 `json:"group_id"`
	FromUserID  int64 `json:"from_user_id"`
	ToUserID    int64 `json:"to_user_id"`
	AmountCents int64 `json:"amount_cents"`
}

type CreateSettlementRequest struct {
	FromUserID  int64 `json:"from_user_id"`
	ToUserID    int64 `json:"to_user_id"`
	AmountCents int64 `json:"amount_cents"`
}

type Balance struct {
	UserID      int64 `json:"user_id"`
	AmountCents int64 `json:"amount_cents"`
}

type BalancesResponse struct {
	Balances []Balance `json:"balances"`
}

type SettleSuggestion struct {
	FromUserID  int64 `json:"from_user_id"`
	ToUserID    int64 `json:"to_user_id"`
	AmountCents int64 `json:"amount_cents"`
}
