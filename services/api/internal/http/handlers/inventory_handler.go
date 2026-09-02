package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/example/api/internal/domain"
	"github.com/example/api/internal/http/response"
	"github.com/example/api/internal/service"
)

// InventoryManager defines the application operations consumed by the HTTP layer.
type InventoryManager interface {
	Topology(ctx context.Context) ([]domain.Router, error)
	CreateRouter(ctx context.Context, input service.RouterInput) (*domain.Router, error)
	UpdateRouter(ctx context.Context, id string, input service.RouterInput) (*domain.Router, error)
	DeleteRouter(ctx context.Context, id string) error
	CreateMachine(ctx context.Context, routerID string, input service.MachineInput) (*domain.Machine, error)
	UpdateMachine(ctx context.Context, id string, input service.MachineInput) (*domain.Machine, error)
	DeleteMachine(ctx context.Context, id string) error
	CreateService(ctx context.Context, machineID string, input service.ServiceInput) (*domain.ServiceEndpoint, error)
	UpdateService(ctx context.Context, id string, input service.ServiceInput) (*domain.ServiceEndpoint, error)
	DeleteService(ctx context.Context, id string) error
}

// InventoryHandler exposes manual inventory CRUD endpoints.
type InventoryHandler struct {
	inventory InventoryManager
}

type routerRequest struct {
	Name          string `json:"name" binding:"required"`
	Address       string `json:"address" binding:"required"`
	ManagementURL string `json:"management_url" binding:"required"`
	Image         string `json:"image"`
	Status        string `json:"status"`
	SortOrder     int    `json:"sort_order"`
}

type machineRequest struct {
	Name          string `json:"name" binding:"required"`
	Address       string `json:"address" binding:"required"`
	ManagementURL string `json:"management_url"`
	Image         string `json:"image"`
	Status        string `json:"status"`
	SortOrder     int    `json:"sort_order"`
}

type serviceRequest struct {
	Name      string `json:"name" binding:"required"`
	URL       string `json:"url" binding:"required"`
	Icon      string `json:"icon"`
	Status    string `json:"status"`
	SortOrder int    `json:"sort_order"`
}

// NewInventoryHandler creates an inventory handler.
func NewInventoryHandler(inventory InventoryManager) *InventoryHandler {
	return &InventoryHandler{inventory: inventory}
}

// Topology returns every router with nested machines and services.
func (h *InventoryHandler) Topology(c *gin.Context) {
	topology, err := h.inventory.Topology(c.Request.Context())
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, topology)
}

// CreateRouter creates a router.
func (h *InventoryHandler) CreateRouter(c *gin.Context) {
	var req routerRequest
	if !bind(c, &req) {
		return
	}
	router, err := h.inventory.CreateRouter(c.Request.Context(), routerInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.Created(c, router)
}

// UpdateRouter updates a router.
func (h *InventoryHandler) UpdateRouter(c *gin.Context) {
	var req routerRequest
	if !bind(c, &req) {
		return
	}
	router, err := h.inventory.UpdateRouter(c.Request.Context(), c.Param("routerID"), routerInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, router)
}

// DeleteRouter deletes a router.
func (h *InventoryHandler) DeleteRouter(c *gin.Context) {
	if err := h.inventory.DeleteRouter(c.Request.Context(), c.Param("routerID")); err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, gin.H{"deleted": true})
}

// CreateMachine creates a machine under a router.
func (h *InventoryHandler) CreateMachine(c *gin.Context) {
	var req machineRequest
	if !bind(c, &req) {
		return
	}
	machine, err := h.inventory.CreateMachine(c.Request.Context(), c.Param("routerID"), machineInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.Created(c, machine)
}

// UpdateMachine updates a machine.
func (h *InventoryHandler) UpdateMachine(c *gin.Context) {
	var req machineRequest
	if !bind(c, &req) {
		return
	}
	machine, err := h.inventory.UpdateMachine(c.Request.Context(), c.Param("machineID"), machineInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, machine)
}

// DeleteMachine deletes a machine.
func (h *InventoryHandler) DeleteMachine(c *gin.Context) {
	if err := h.inventory.DeleteMachine(c.Request.Context(), c.Param("machineID")); err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, gin.H{"deleted": true})
}

// CreateService creates a service endpoint under a machine.
func (h *InventoryHandler) CreateService(c *gin.Context) {
	var req serviceRequest
	if !bind(c, &req) {
		return
	}
	endpoint, err := h.inventory.CreateService(c.Request.Context(), c.Param("machineID"), serviceInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.Created(c, endpoint)
}

// UpdateService updates a service endpoint.
func (h *InventoryHandler) UpdateService(c *gin.Context) {
	var req serviceRequest
	if !bind(c, &req) {
		return
	}
	endpoint, err := h.inventory.UpdateService(c.Request.Context(), c.Param("serviceID"), serviceInput(req))
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, endpoint)
}

// DeleteService deletes a service endpoint.
func (h *InventoryHandler) DeleteService(c *gin.Context) {
	if err := h.inventory.DeleteService(c.Request.Context(), c.Param("serviceID")); err != nil {
		writeInventoryError(c, err)
		return
	}
	response.OK(c, gin.H{"deleted": true})
}

func bind(c *gin.Context, target any) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		response.Error(c, http.StatusBadRequest, 40000, "invalid request body")
		return false
	}
	return true
}

func routerInput(req routerRequest) service.RouterInput {
	return service.RouterInput{Name: req.Name, Address: req.Address, ManagementURL: req.ManagementURL,
		Image: req.Image, Status: req.Status, SortOrder: req.SortOrder}
}

func machineInput(req machineRequest) service.MachineInput {
	return service.MachineInput{Name: req.Name, Address: req.Address, ManagementURL: req.ManagementURL,
		Image: req.Image, Status: req.Status, SortOrder: req.SortOrder}
}

func serviceInput(req serviceRequest) service.ServiceInput {
	return service.ServiceInput{Name: req.Name, URL: req.URL, Icon: req.Icon,
		Status: req.Status, SortOrder: req.SortOrder}
}

func writeInventoryError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidInventoryInput):
		response.Error(c, http.StatusBadRequest, 40010, "invalid inventory input")
	case errors.Is(err, service.ErrInventoryNotFound):
		response.Error(c, http.StatusNotFound, 40410, "inventory item not found")
	default:
		response.Error(c, http.StatusInternalServerError, 50010, "inventory operation failed")
	}
}
