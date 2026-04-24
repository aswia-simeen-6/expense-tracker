package main

import (
	"log"
	"os"

	"expense-tracker/handler"
	"expense-tracker/store"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	dbPath := env("DB_PATH", "expenses.db")

	s, err := store.New(dbPath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}
	defer s.Close()

	h := handler.New(s)

	app := fiber.New(fiber.Config{ErrorHandler: jsonError})
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))

	api := app.Group("/api")
	api.Post("/expenses", h.CreateExpense)
	api.Get("/expenses", h.ListExpenses)
	api.Put("/expenses/:id", h.UpdateExpense)
	api.Delete("/expenses/:id", h.DeleteExpense)

	
	port := env("PORT", "8080")
	log.Printf("listening on :%s", port)
	log.Fatal(app.Listen(":" + port))
}

func jsonError(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
