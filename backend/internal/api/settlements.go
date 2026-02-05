package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/billsplit/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) CreateSettlement(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	var req models.CreateSettlementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest(w, "invalid JSON")
		return
	}
	if req.AmountCents <= 0 || req.FromUserID == req.ToUserID {
		ErrBadRequest(w, "amount_cents > 0 and from_user_id != to_user_id required")
		return
	}
	memberIDs, err := s.groupMemberIDs(groupID)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	if !contains(memberIDs, req.FromUserID) || !contains(memberIDs, req.ToUserID) {
		ErrBadRequest(w, "from and to must be group members")
		return
	}
	res, err := s.db.Exec(`
		INSERT INTO settlements (group_id, from_user_id, to_user_id, amount_cents) VALUES (?, ?, ?, ?)
	`, groupID, req.FromUserID, req.ToUserID, req.AmountCents)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	id, _ := res.LastInsertId()
	JSON(w, http.StatusCreated, models.Settlement{
		ID: id, GroupID: groupID, FromUserID: req.FromUserID, ToUserID: req.ToUserID, AmountCents: req.AmountCents,
	})
}

func (s *Server) ListSettlements(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	rows, err := s.db.Query(`
		SELECT id, group_id, from_user_id, to_user_id, amount_cents FROM settlements WHERE group_id = ? ORDER BY id
	`, groupID)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	defer rows.Close()
	list := []models.Settlement{}
	for rows.Next() {
		var set models.Settlement
		if err := rows.Scan(&set.ID, &set.GroupID, &set.FromUserID, &set.ToUserID, &set.AmountCents); err != nil {
			ErrInternal(w, err)
			return
		}
		list = append(list, set)
	}
	JSON(w, http.StatusOK, list)
}
