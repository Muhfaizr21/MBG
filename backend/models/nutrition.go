package models

// NutritionItem adalah satu baris dataset gizi (nilai per 100 g bahan).
// Sumber: backend/data/dataset_nutrisi_kasar.csv.
type NutritionItem struct {
	Name         string  `json:"name"`
	Calories     float64 `json:"calories"`
	Protein      float64 `json:"protein"`
	Fat          float64 `json:"fat"`
	Carbohydrate float64 `json:"carbohydrate"`
}

// NutritionMatch adalah hasil pencocokan satu nama bahan ke dataset,
// sudah diskalakan sesuai berat porsi (gram/100).
type NutritionMatch struct {
	Name      string  `json:"name"`
	MatchedTo string  `json:"matchedTo"`
	WeightG   float64 `json:"weightG"`
	Energy    float64 `json:"energy"`
	Protein   float64 `json:"protein"`
	Fat       float64 `json:"fat"`
	Carbs     float64 `json:"carbs"`
}
