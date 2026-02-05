package api

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	db *sql.DB
}

func New(db *sql.DB) *Server {
	return &Server{db: db}
}

func (s *Server) Handler() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Route("/api", func(r chi.Router) {
		r.Post("/users", s.CreateUser)
		r.Get("/users", s.ListUsers)

		r.Post("/groups", s.CreateGroup)
		r.Get("/groups", s.ListGroups)
		r.Get("/groups/{id}", s.GetGroup)
		r.Post("/groups/{id}/members", s.AddMember)
		r.Get("/groups/{id}/expenses", s.ListExpenses)
		r.Post("/groups/{id}/expenses", s.CreateExpense)
		r.Get("/groups/{id}/balances", s.GetBalances)
		r.Get("/groups/{id}/settlements", s.ListSettlements)
		r.Post("/groups/{id}/settlements", s.CreateSettlement)
	})

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
