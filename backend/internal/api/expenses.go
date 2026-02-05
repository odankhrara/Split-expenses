package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/billsplit/backend/internal/logic"
	"github.com/billsplit/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) CreateExpense(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	var req models.CreateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest(w, "invalid JSON")
		return
	}
	if req.AmountCents <= 0 || req.Description == "" {
		ErrBadRequest(w, "amount_cents > 0 and description required")
		return
	}
	memberIDs, err := s.groupMemberIDs(groupID)
	if err != nil || len(memberIDs) == 0 {
		ErrBadRequest(w, "group has no members")
		return
	}
	if !contains(memberIDs, req.PayerID) {
		ErrBadRequest(w, "payer must be a group member")
		return
	}
	var splits map[int64]int64
	if len(req.Splits) == 0 {
		splits, err = logic.DistributeEvenSplit(req.AmountCents, memberIDs)
		if err != nil {
			ErrBadRequest(w, err.Error())
			return
		}
	} else {
		splits = make(map[int64]int64)
		var sum int64
		for _, sp := range req.Splits {
			if !contains(memberIDs, sp.UserID) {
				ErrBadRequest(w, "all split user_ids must be group members")
				return
			}
			splits[sp.UserID] = sp.AmountCents
			sum += sp.AmountCents
		}
		if sum != req.AmountCents {
			ErrBadRequest(w, "splits must sum to amount_cents (no drift)")
			return
		}
	}
	tx, err := s.db.Begin()
	if err != nil {
		ErrInternal(w, err)
		return
	}
	defer tx.Rollback()
	res, err := tx.Exec(
		`INSERT INTO expenses (group_id, payer_id, amount_cents, description) VALUES (?, ?, ?, ?)`,
		groupID, req.PayerID, req.AmountCents, req.Description,
	)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	expenseID, _ := res.LastInsertId()
	for uid, cents := range splits {
		if cents > 0 {
			_, err = tx.Exec(`INSERT INTO expense_splits (expense_id, user_id, amount_cents) VALUES (?, ?, ?)`, expenseID, uid, cents)
			if err != nil {
				ErrInternal(w, err)
				return
			}
		}
	}
	if err := tx.Commit(); err != nil {
		ErrInternal(w, err)
		return
	}
	exp := models.Expense{
		ID: expenseID, GroupID: groupID, PayerID: req.PayerID,
		AmountCents: req.AmountCents, Description: req.Description,
	}
	for uid, cents := range splits {
		exp.Splits = append(exp.Splits, models.SplitPart{UserID: uid, AmountCents: cents})
	}
	JSON(w, http.StatusCreated, exp)
}

func (s *Server) ListExpenses(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	rows, err := s.db.Query(`
		SELECT e.id, e.group_id, e.payer_id, e.amount_cents, e.description
		FROM expenses e WHERE e.group_id = ? ORDER BY e.id
	`, groupID)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	defer rows.Close()
	list := []models.Expense{}
	for rows.Next() {
		var e models.Expense
		if err := rows.Scan(&e.ID, &e.GroupID, &e.PayerID, &e.AmountCents, &e.Description); err != nil {
			ErrInternal(w, err)
			return
		}
		e.Splits, _ = s.expenseSplits(e.ID)
		list = append(list, e)
	}
	JSON(w, http.StatusOK, list)
}

func (s *Server) expenseSplits(expenseID int64) ([]models.SplitPart, error) {
	rows, err := s.db.Query(`SELECT user_id, amount_cents FROM expense_splits WHERE expense_id = ?`, expenseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.SplitPart
	for rows.Next() {
		var sp models.SplitPart
		if err := rows.Scan(&sp.UserID, &sp.AmountCents); err != nil {
			return nil, err
		}
		out = append(out, sp)
	}
	return out, nil
}

func contains(s []int64, x int64) bool {
	for _, v := range s {
		if v == x {
			return true
		}
	}
	return false
}
