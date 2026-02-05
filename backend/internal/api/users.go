package api

import (
	"encoding/json"
	"net/http"

	"github.com/billsplit/backend/internal/models"
)

func (s *Server) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest(w, "invalid JSON")
		return
	}
	if req.Name == "" || req.Email == "" {
		ErrBadRequest(w, "name and email required")
		return
	}
	res, err := s.db.Exec(
		`INSERT INTO users (name, email) VALUES (?, ?)`,
		req.Name, req.Email,
	)
	if err != nil {
		Err(w, http.StatusConflict, err.Error())
		return
	}
	id, _ := res.LastInsertId()
	JSON(w, http.StatusCreated, models.User{ID: id, Name: req.Name, Email: req.Email})
}

func (s *Server) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, name, email FROM users ORDER BY id`)
	if err != nil {
		ErrInternal(w, err)
		return
	}
	defer rows.Close()
	list := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			ErrInternal(w, err)
			return
		}
		list = append(list, u)
	}
	JSON(w, http.StatusOK, list)
}
