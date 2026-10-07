package middlewares

import "backend/models"

// hasPermission delegates to the server-side role→permission matrix.
// Keeping resolution here (not in the request payload) enforces that
// permissions can never be forged by the client.
func hasPermission(role, permission string) bool {
	return models.HasPermission(role, permission)
}
