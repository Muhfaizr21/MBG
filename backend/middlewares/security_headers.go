package middlewares

import (
	"net/http"
)

// SecurityHeaders sets defense-in-depth HTTP security headers to protect against
// clickjacking, MIME-sniffing, XSS, and unencrypted transport.
func SecurityHeaders(appEnv string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Anti-clickjacking
			w.Header().Set("X-Frame-Options", "DENY")
			// Anti-MIME sniffing
			w.Header().Set("X-Content-Type-Options", "nosniff")
			// Cross-site scripting filter
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			// Referrer policy
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			// Permissions policy
			w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			// Content Security Policy
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none';")

			// HSTS only in production (to avoid locking localhost/dev environments)
			if appEnv == "production" || r.TLS != nil {
				w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			}

			next.ServeHTTP(w, r)
		})
	}
}
