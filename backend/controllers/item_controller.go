package controllers

import (
	"backend/models"
	"backend/repositories"
	"backend/services"
	"backend/utils"
	"encoding/json"
	"errors"
	"net/http"
)

type ItemController struct {
	service services.ItemService
}

func NewItemController(service services.ItemService) *ItemController {
	return &ItemController{
		service: service,
	}
}

// GetAll godoc
// @Summary      Get all items
// @Description  Get list of all items from repository
// @Tags         items
// @Produce      json
// @Success      200  {object}  models.APIResponse{data=[]models.Item}
// @Failure      500  {object}  models.APIResponse
// @Router       /api/items [get]
func (c *ItemController) GetAll(w http.ResponseWriter, r *http.Request) {
	items, err := c.service.GetAllItems(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve items")
		return
	}
	utils.Success(w, http.StatusOK, "Items retrieved successfully", items)
}

// GetByID godoc
// @Summary      Get item by ID
// @Description  Get a single item by its unique ID
// @Tags         items
// @Produce      json
// @Param        id   path      string  true  "Item ID"
// @Success      200  {object}  models.APIResponse{data=models.Item}
// @Failure      400  {object}  models.APIResponse
// @Failure      404  {object}  models.APIResponse
// @Failure      500  {object}  models.APIResponse
// @Router       /api/items/{id} [get]
func (c *ItemController) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "Missing item ID in path")
		return
	}

	item, err := c.service.GetItemByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, repositories.ErrItemNotFound) {
			utils.Error(w, http.StatusNotFound, "Item not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve item")
		return
	}

	utils.Success(w, http.StatusOK, "Item retrieved successfully", item)
}

// Create godoc
// @Summary      Create a new item
// @Description  Create a new item with title, description, and category
// @Tags         items
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateItemRequest  true  "Create Item Request"
// @Success      201      {object}  models.APIResponse{data=models.Item}
// @Failure      400      {object}  models.APIResponse
// @Failure      500      {object}  models.APIResponse
// @Router       /api/items [post]
func (c *ItemController) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	created, err := c.service.CreateItem(r.Context(), req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidInput) {
			utils.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to create item")
		return
	}

	utils.Success(w, http.StatusCreated, "Item created successfully", created)
}

// Delete godoc
// @Summary      Delete item by ID
// @Description  Delete an item by its unique ID
// @Tags         items
// @Produce      json
// @Param        id   path      string  true  "Item ID"
// @Success      200  {object}  models.APIResponse
// @Failure      400  {object}  models.APIResponse
// @Failure      404  {object}  models.APIResponse
// @Failure      500  {object}  models.APIResponse
// @Router       /api/items/{id} [delete]
func (c *ItemController) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "Missing item ID in path")
		return
	}

	if err := c.service.DeleteItem(r.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrItemNotFound) {
			utils.Error(w, http.StatusNotFound, "Item not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	utils.Success(w, http.StatusOK, "Item deleted successfully", nil)
}
