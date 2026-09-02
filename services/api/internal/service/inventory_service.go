package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/google/uuid"

	"github.com/example/api/internal/domain"
	"github.com/example/api/internal/repository"
)

var (
	// ErrInvalidInventoryInput indicates malformed manual inventory data.
	ErrInvalidInventoryInput = errors.New("invalid inventory input")
	// ErrInventoryNotFound indicates that a router, machine, or service does not exist.
	ErrInventoryNotFound = errors.New("inventory item not found")
)

// InventoryStore defines persistence required by InventoryService.
type InventoryStore interface {
	Topology(ctx context.Context) ([]domain.Router, error)
	CreateRouter(ctx context.Context, router *domain.Router) error
	UpdateRouter(ctx context.Context, router *domain.Router) error
	DeleteRouter(ctx context.Context, id string) error
	CreateMachine(ctx context.Context, machine *domain.Machine) error
	UpdateMachine(ctx context.Context, machine *domain.Machine) error
	DeleteMachine(ctx context.Context, id string) error
	CreateService(ctx context.Context, endpoint *domain.ServiceEndpoint) error
	UpdateService(ctx context.Context, endpoint *domain.ServiceEndpoint) error
	DeleteService(ctx context.Context, id string) error
}

// InventoryService validates and manages Homelab inventory.
type InventoryService struct {
	store InventoryStore
}

// RouterInput contains editable router fields.
type RouterInput struct {
	Name, Address, ManagementURL, Image, Status string
	SortOrder                                   int
}

// MachineInput contains editable machine fields.
type MachineInput struct {
	Name, Address, ManagementURL, Image, Status string
	SortOrder                                   int
}

// ServiceInput contains editable service endpoint fields.
type ServiceInput struct {
	Name, URL, Icon, Status string
	SortOrder               int
}

// NewInventoryService creates an inventory service.
func NewInventoryService(store InventoryStore) *InventoryService {
	return &InventoryService{store: store}
}

// Topology returns the complete hierarchy.
func (s *InventoryService) Topology(ctx context.Context) ([]domain.Router, error) {
	routers, err := s.store.Topology(ctx)
	if err != nil {
		return nil, fmt.Errorf("loading topology: %w", err)
	}
	return routers, nil
}

// CreateRouter validates and creates a router.
func (s *InventoryService) CreateRouter(ctx context.Context, input RouterInput) (*domain.Router, error) {
	router, err := routerFromInput(uuid.NewString(), input)
	if err != nil {
		return nil, err
	}
	if err := s.store.CreateRouter(ctx, router); err != nil {
		return nil, fmt.Errorf("creating router: %w", err)
	}
	return router, nil
}

// UpdateRouter validates and updates a router.
func (s *InventoryService) UpdateRouter(ctx context.Context, id string, input RouterInput) (*domain.Router, error) {
	router, err := routerFromInput(strings.TrimSpace(id), input)
	if err != nil {
		return nil, err
	}
	if err := mapStoreError(s.store.UpdateRouter(ctx, router)); err != nil {
		return nil, err
	}
	return router, nil
}

// DeleteRouter deletes a router.
func (s *InventoryService) DeleteRouter(ctx context.Context, id string) error {
	return mapStoreError(s.store.DeleteRouter(ctx, strings.TrimSpace(id)))
}

// CreateMachine validates and creates a machine under a router.
func (s *InventoryService) CreateMachine(ctx context.Context, routerID string, input MachineInput) (*domain.Machine, error) {
	machine, err := machineFromInput(uuid.NewString(), strings.TrimSpace(routerID), input)
	if err != nil {
		return nil, err
	}
	if err := s.store.CreateMachine(ctx, machine); err != nil {
		return nil, fmt.Errorf("creating machine: %w", err)
	}
	return machine, nil
}

// UpdateMachine validates and updates a machine.
func (s *InventoryService) UpdateMachine(ctx context.Context, id string, input MachineInput) (*domain.Machine, error) {
	machine, err := machineFromInput(strings.TrimSpace(id), "", input)
	if err != nil {
		return nil, err
	}
	if err := mapStoreError(s.store.UpdateMachine(ctx, machine)); err != nil {
		return nil, err
	}
	return machine, nil
}

// DeleteMachine deletes a machine and its services.
func (s *InventoryService) DeleteMachine(ctx context.Context, id string) error {
	return mapStoreError(s.store.DeleteMachine(ctx, strings.TrimSpace(id)))
}

// CreateService validates and creates a service under a machine.
func (s *InventoryService) CreateService(ctx context.Context, machineID string, input ServiceInput) (*domain.ServiceEndpoint, error) {
	endpoint, err := serviceFromInput(uuid.NewString(), strings.TrimSpace(machineID), input)
	if err != nil {
		return nil, err
	}
	if err := s.store.CreateService(ctx, endpoint); err != nil {
		return nil, fmt.Errorf("creating service: %w", err)
	}
	return endpoint, nil
}

// UpdateService validates and updates a service endpoint.
func (s *InventoryService) UpdateService(ctx context.Context, id string, input ServiceInput) (*domain.ServiceEndpoint, error) {
	endpoint, err := serviceFromInput(strings.TrimSpace(id), "", input)
	if err != nil {
		return nil, err
	}
	if err := mapStoreError(s.store.UpdateService(ctx, endpoint)); err != nil {
		return nil, err
	}
	return endpoint, nil
}

// DeleteService deletes a service endpoint.
func (s *InventoryService) DeleteService(ctx context.Context, id string) error {
	return mapStoreError(s.store.DeleteService(ctx, strings.TrimSpace(id)))
}

func routerFromInput(id string, input RouterInput) (*domain.Router, error) {
	name, address := strings.TrimSpace(input.Name), strings.TrimSpace(input.Address)
	managementURL, err := normalizeURL(input.ManagementURL, true)
	if id == "" || name == "" || address == "" || err != nil {
		return nil, ErrInvalidInventoryInput
	}
	return &domain.Router{ID: id, Name: name, Address: address, ManagementURL: managementURL,
		Image: strings.TrimSpace(input.Image), Status: normalizeStatus(input.Status), SortOrder: input.SortOrder}, nil
}

func machineFromInput(id, routerID string, input MachineInput) (*domain.Machine, error) {
	name, address := strings.TrimSpace(input.Name), strings.TrimSpace(input.Address)
	managementURL, err := normalizeURL(input.ManagementURL, false)
	if id == "" || name == "" || address == "" || err != nil {
		return nil, ErrInvalidInventoryInput
	}
	return &domain.Machine{ID: id, RouterID: routerID, Name: name, Address: address,
		ManagementURL: managementURL, Image: strings.TrimSpace(input.Image),
		Status: normalizeStatus(input.Status), SortOrder: input.SortOrder}, nil
}

func serviceFromInput(id, machineID string, input ServiceInput) (*domain.ServiceEndpoint, error) {
	name := strings.TrimSpace(input.Name)
	endpointURL, err := normalizeURL(input.URL, true)
	if id == "" || name == "" || err != nil {
		return nil, ErrInvalidInventoryInput
	}
	return &domain.ServiceEndpoint{ID: id, MachineID: machineID, Name: name, URL: endpointURL,
		Icon: strings.TrimSpace(input.Icon), Status: normalizeStatus(input.Status), SortOrder: input.SortOrder}, nil
}

func normalizeURL(raw string, required bool) (string, error) {
	value := strings.TrimSpace(raw)
	if value == "" && !required {
		return "", nil
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return "", ErrInvalidInventoryInput
	}
	return parsed.String(), nil
}

func normalizeStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "online", "offline":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return "unknown"
	}
}

func mapStoreError(err error) error {
	if errors.Is(err, repository.ErrNotFound) {
		return ErrInventoryNotFound
	}
	if err != nil {
		return fmt.Errorf("updating inventory: %w", err)
	}
	return nil
}
