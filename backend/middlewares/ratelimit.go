package middlewares

import (
	"backend/utils"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type clientVisitor struct {
	tokens     int
	lastRefill time.Time
}

// RateLimiter is a thread-safe token bucket rate limiter per client IP.
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*clientVisitor
	rate     int           // tokens added per interval
	burst    int           // max tokens
	interval time.Duration // refill interval
}

// NewRateLimiter creates a token bucket rate limiter.
func NewRateLimiter(rate int, burst int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*clientVisitor),
		rate:     rate,
		burst:    burst,
		interval: interval,
	}

	// Periodically cleanup inactive visitors every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			threshold := time.Now().Add(-10 * time.Minute)
			for ip, v := range rl.visitors {
				if v.lastRefill.Before(threshold) {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

// Limit returns an HTTP middleware that enforces the rate limit.
func (rl *RateLimiter) Limit(customErrorMessage ...string) func(http.Handler) http.Handler {
	msg := "Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi."
	if len(customErrorMessage) > 0 && customErrorMessage[0] != "" {
		msg = customErrorMessage[0]
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ClientIP(r)
			if !rl.allow(ip) {
				w.Header().Set("Retry-After", "60")
				utils.Error(w, http.StatusTooManyRequests, msg)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[ip]
	if !exists {
		rl.visitors[ip] = &clientVisitor{
			tokens:     rl.burst - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens
	elapsed := now.Sub(v.lastRefill)
	if elapsed >= rl.interval {
		tokensToAdd := int(elapsed / rl.interval) * rl.rate
		v.tokens += tokensToAdd
		if v.tokens > rl.burst {
			v.tokens = rl.burst
		}
		v.lastRefill = now
	}

	if v.tokens > 0 {
		v.tokens--
		return true
	}

	return false
}

// ClientIP extracts real client IP considering reverse proxies (Cloudflare, Nginx).
func ClientIP(r *http.Request) string {
	// 1. CF-Connecting-IP
	if cfIP := r.Header.Get("CF-Connecting-IP"); cfIP != "" {
		return strings.TrimSpace(cfIP)
	}

	// 2. X-Forwarded-For (leftmost client IP)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		clientIP := strings.TrimSpace(ips[0])
		if clientIP != "" {
			return clientIP
		}
	}

	// 3. X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}

	// 4. RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
