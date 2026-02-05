package main

import (
	"log"
	"net/http"
	"os"

	"github.com/billsplit/backend/internal/api"
	"github.com/billsplit/backend/internal/db"
)

func main() {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}
	database, err := db.Open(dataDir)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	srv := api.New(database)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, srv.Handler()))
}
