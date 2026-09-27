package utils

import (
	"backend/models"
	"encoding/json"
	"net/http"
)

// JSON sends a JSON response with the provided status code
func JSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

// Success sends a standardized success JSON response
func Success(w http.ResponseWriter, statusCode int, message string, data any) {
	JSON(w, statusCode, models.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error sends a standardized error JSON response
func Error(w http.ResponseWriter, statusCode int, message string) {
	JSON(w, statusCode, models.APIResponse{
		Success: false,
		Error:   message,
	})
}
