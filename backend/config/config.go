package config

import (
	"os"
)

type Config struct {
	Port   string
	AppEnv string
}

// LoadConfig initializes application configurations from environment variables with sensible defaults
func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	return &Config{
		Port:   port,
		AppEnv: appEnv,
	}
}
