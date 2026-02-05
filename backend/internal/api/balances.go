package api

import (
	"net/http"
	"strconv"

	"github.com/billsplit/backend/internal/logic"
	"github.com/billsplit/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) GetBalances(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	var exists int
	if err := s.db.QueryRow(`SELECT 1 FROM groups WHERE id = ?`, groupID).Scan(&exists); err != nil {
		ErrNotFound(w, "group not found")
		return
	}
	balances, err := logic.ComputeBalances(s.db, groupID)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	out := []models.Balance{}
	for uid, cents := range balances {
		out = append(out, models.Balance{UserID: uid, AmountCents: cents})
	}
	JSON(w, http.StatusOK, models.BalancesResponse{Balances: out})
}
