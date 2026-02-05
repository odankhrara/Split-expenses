package api

import (
	"encoding/json"
	"net/http"
)

func JSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Err(w http.ResponseWriter, status int, message string) {
	JSON(w, status, map[string]string{"error": message})
}

func ErrBadRequest(w http.ResponseWriter, message string) {
	Err(w, http.StatusBadRequest, message)
}

func ErrNotFound(w http.ResponseWriter, message string) {
	Err(w, http.StatusNotFound, message)
}

func ErrInternal(w http.ResponseWriter, err error) {
	Err(w, http.StatusInternalServerError, err.Error())
}
