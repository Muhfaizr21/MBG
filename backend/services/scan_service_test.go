package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/models"
)

type scanRepoStub struct {
	batch *models.ScanBatchInfo
}

func (r *scanRepoStub) FindBatch(context.Context, string) (*models.ScanBatchInfo, error) {
	return r.batch, nil
}
func (*scanRepoStub) InsertScan(context.Context, *models.ScanLog) error { return nil }
func (*scanRepoStub) CountToday(context.Context) (int, error)           { return 0, nil }
func (*scanRepoStub) ListRecentScans(context.Context, string, int) ([]models.ScanLog, error) {
	return nil, nil
}
func (*scanRepoStub) UpdateScanFeedback(context.Context, string, int, string, *float64) error {
	return nil
}
func (*scanRepoStub) DeleteScan(context.Context, string, string) (string, error) { return "", nil }
func (*scanRepoStub) DeleteAllScans(context.Context, string) ([]string, error)   { return nil, nil }

func scanServiceWithPrediction(t *testing.T, prediction map[string]any, status int, repo *scanRepoStub) ScanService {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if status != http.StatusOK {
			http.Error(w, "unavailable", status)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(prediction)
	}))
	t.Cleanup(server.Close)
	return NewScanService(repo, server.URL, nil)
}

func submitTestScan(t *testing.T, service ScanService) (*models.ScanResult, error) {
	t.Helper()
	return service.SubmitScan(context.Background(), ScanSubmission{
		ActorID:  "validator-1",
		Image:    []byte("image"),
		FileName: "scan.jpg",
		BatchID:  "BTH-01",
	})
}

func TestSubmitScanSeparatesMenuAndCookedFreshnessModels(t *testing.T) {
	service := scanServiceWithPrediction(t, map[string]any{
		"menu_class_name": "chicken_curry", "menu_confidence": 0.88,
		"freshness_class_name": "Fresh", "freshness_confidence": 0.93,
		"freshness_class_probabilities": map[string]float64{"Fresh": 0.93, "Spoiled": 0.07},
		"latency_ms":                    42.5,
	}, http.StatusOK, &scanRepoStub{batch: &models.ScanBatchInfo{
		BatchID: "BTH-01", SPPGName: "SPPG Menteng", MenuName: "Nasi Ayam Sayur",
		ProductionDate: "2026-10-07", Macros: &models.Macros{Energy: 520, Protein: 27, Carbs: 68, Fat: 16},
	}})

	result, err := submitTestScan(t, service)
	if err != nil {
		t.Fatal(err)
	}
	if result.MenuName != "Nasi Ayam Sayur" || result.MenuClass != "chicken_curry" {
		t.Fatalf("menu result not preserved: %+v", result)
	}
	if result.FreshnessClass != "Fresh" || result.FreshnessConfidence != 0.93 || result.Score != 93 {
		t.Fatalf("freshness result not preserved: %+v", result)
	}
	if result.Verdict != models.VerdictPeringatan {
		t.Fatalf("fresh visual prediction must still require staff verification, got %q", result.Verdict)
	}
	if result.BatchInfo == nil || result.BatchInfo.SPPGName != "SPPG Menteng" || result.Macros == nil || result.Macros.Energy != 520 {
		t.Fatalf("batch context not returned: %+v", result.BatchInfo)
	}
}

func TestSubmitScanSpoiledAndLowConfidenceRequireDifferentOutcomes(t *testing.T) {
	tests := []struct {
		name       string
		class      string
		confidence float64
		want       string
	}{
		{name: "spoiled with high confidence", class: "Spoiled", confidence: 0.95, want: models.VerdictTolak},
		{name: "low confidence", class: "Fresh", confidence: 0.49, want: models.VerdictPeringatan},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			service := scanServiceWithPrediction(t, map[string]any{
				"menu_class_name": "", "menu_confidence": 0,
				"freshness_class_name": tc.class, "freshness_confidence": tc.confidence,
				"freshness_class_probabilities": map[string]float64{"Fresh": 1 - tc.confidence, "Spoiled": tc.confidence},
				"latency_ms":                    12,
			}, http.StatusOK, &scanRepoStub{})
			result, err := submitTestScan(t, service)
			if err != nil {
				t.Fatal(err)
			}
			if result.Verdict != tc.want {
				t.Fatalf("got verdict %q, want %q", result.Verdict, tc.want)
			}
		})
	}
}

func TestSubmitScanUsesIndonesianDisplayNamesButKeepsRawClasses(t *testing.T) {
	service := scanServiceWithPrediction(t, map[string]any{
		"menu_class_name": "chicken_curry", "menu_display_name": "kari ayam",
		"menu_confidence": 0.88,
		"freshness_class_name": "Fresh", "freshness_display_name": "Segar",
		"freshness_confidence": 0.93,
		"freshness_class_probabilities": map[string]float64{"Fresh": 0.93, "Spoiled": 0.07},
		"latency_ms":                    42.5,
	}, http.StatusOK, &scanRepoStub{})

	result, err := submitTestScan(t, service)
	if err != nil {
		t.Fatal(err)
	}
	// Label mentah dipertahankan karena componentAliases mencocokkan kunci Inggris.
	if result.MenuClass != "chicken_curry" || result.FreshnessClass != "Fresh" {
		t.Fatalf("raw classes must stay untouched: %+v", result)
	}
	if result.MenuDisplay != "kari ayam" || result.FreshnessDisplay != "Segar" {
		t.Fatalf("indonesian display names lost: %+v", result)
	}
	if result.MenuName != "kari ayam" {
		t.Fatalf("display name should back menuName without a batch menu: %q", result.MenuName)
	}

	notes := map[string]string{}
	for _, check := range result.Checks {
		notes[check.Label] = check.Note
	}
	if note := notes["Pengenalan menu (YOLOv8)"]; !strings.Contains(note, "kari ayam") {
		t.Fatalf("menu check note must show the indonesian name: %q", note)
	}
	if note := notes["Kesegaran hidangan matang (YOLOv8)"]; !strings.Contains(note, "Segar") {
		t.Fatalf("freshness check note must show the indonesian name: %q", note)
	}
}

func TestSubmitScanFallsBackWhenAIServiceOmitsDisplayNames(t *testing.T) {
	// Layanan AI lawas tidak mengirim *_display_name; tampilan jatuh ke
	// menuDisplayName (title case) agar catatan tetap terbaca.
	service := scanServiceWithPrediction(t, map[string]any{
		"menu_class_name": "chicken_curry", "menu_confidence": 0.88,
		"freshness_class_name": "Fresh", "freshness_confidence": 0.93,
		"freshness_class_probabilities": map[string]float64{"Fresh": 0.93, "Spoiled": 0.07},
		"latency_ms":                    12,
	}, http.StatusOK, &scanRepoStub{})

	result, err := submitTestScan(t, service)
	if err != nil {
		t.Fatal(err)
	}
	if result.MenuDisplay != "Chicken Curry" {
		t.Fatalf("missing display name must fall back to title case, got %q", result.MenuDisplay)
	}
	if result.FreshnessDisplay != "Fresh" {
		t.Fatalf("missing freshness display name must keep the raw class, got %q", result.FreshnessDisplay)
	}
}

func TestSubmitScanReportsUnavailableAI(t *testing.T) {
	service := scanServiceWithPrediction(t, nil, http.StatusServiceUnavailable, &scanRepoStub{})
	_, err := submitTestScan(t, service)
	if err == nil || !strings.Contains(err.Error(), ErrAIUnavailable.Error()) {
		t.Fatalf("expected ErrAIUnavailable, got %v", err)
	}
}
