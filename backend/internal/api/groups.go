package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/billsplit/backend/internal/models"
	"github.com/go-chi/chi/v5"
)

func (s *Server) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest(w, "invalid JSON")
		return
	}
	if req.Name == "" {
		ErrBadRequest(w, "name required")
		return
	}
	if req.Currency == "" {
		req.Currency = "USD"
	}
	res, err := s.db.Exec(
		`INSERT INTO groups (name, currency) VALUES (?, ?)`,
		req.Name, req.Currency,
	)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	gid, _ := res.LastInsertId()
	for _, uid := range req.MemberIDs {
		_, _ = s.db.Exec(`INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`, gid, uid)
	}
	JSON(w, http.StatusCreated, models.Group{ID: gid, Name: req.Name, Currency: req.Currency, MemberIDs: req.MemberIDs})
}

func (s *Server) ListGroups(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, name, currency FROM groups ORDER BY id`)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	defer rows.Close()
	list := []models.Group{}
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Currency); err != nil {
			ErrInternal(w, err)
			return
		}
		g.MemberIDs, _ = s.groupMemberIDs(g.ID)
		list = append(list, g)
	}
	JSON(w, http.StatusOK, list)
}

func (s *Server) GetGroup(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	var g models.Group
	err = s.db.QueryRow(`SELECT id, name, currency FROM groups WHERE id = ?`, id).Scan(&g.ID, &g.Name, &g.Currency)
	if err != nil {
		ErrNotFound(w, "group not found")
		return
	}
	g.MemberIDs, _ = s.groupMemberIDs(g.ID)
	JSON(w, http.StatusOK, g)
}

func (s *Server) AddMember(w http.ResponseWriter, r *http.Request) {
	groupID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		ErrBadRequest(w, "invalid group id")
		return
	}
	var req models.AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest(w, "invalid JSON")
		return
	}
	_, err = s.db.Exec(`INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`, groupID, req.UserID)
	if err != nil {
		ErrBadRequest(w, err.Error())
		return
	}
	JSON(w, http.StatusCreated, map[string]int64{"group_id": groupID, "user_id": req.UserID})
}

func (s *Server) groupMemberIDs(groupID int64) ([]int64, error) {
	rows, err := s.db.Query(`SELECT user_id FROM group_members WHERE group_id = ? ORDER BY user_id`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
