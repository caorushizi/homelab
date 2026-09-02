package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/example/api/internal/domain"
)

// ErrNotFound indicates that an inventory entity does not exist.
var ErrNotFound = errors.New("resource not found")

// InventoryRepository persists routers, machines, and service endpoints.
type InventoryRepository struct {
	db *gorm.DB
}

// NewInventoryRepository creates an inventory repository backed by Gorm.
func NewInventoryRepository(db *gorm.DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

// Topology returns the complete ordered router hierarchy.
func (r *InventoryRepository) Topology(ctx context.Context) ([]domain.Router, error) {
	routers := []domain.Router{}
	err := r.db.WithContext(ctx).
		Preload("Machines", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, name ASC")
		}).
		Preload("Machines.Services", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, name ASC")
		}).
		Order("sort_order ASC, name ASC").
		Find(&routers).Error
	return routers, err
}

// CreateRouter stores a router.
func (r *InventoryRepository) CreateRouter(ctx context.Context, router *domain.Router) error {
	return r.db.WithContext(ctx).Create(router).Error
}

// UpdateRouter stores editable router fields.
func (r *InventoryRepository) UpdateRouter(ctx context.Context, router *domain.Router) error {
	result := r.db.WithContext(ctx).Model(&domain.Router{}).Where("id = ?", router.ID).Updates(map[string]any{
		"name": router.Name, "address": router.Address, "management_url": router.ManagementURL,
		"image": router.Image, "status": router.Status, "sort_order": router.SortOrder,
	})
	return changed(result)
}

// DeleteRouter removes a router and its descendants.
func (r *InventoryRepository) DeleteRouter(ctx context.Context, id string) error {
	return changed(r.db.WithContext(ctx).Delete(&domain.Router{}, "id = ?", id))
}

// CreateMachine stores a machine.
func (r *InventoryRepository) CreateMachine(ctx context.Context, machine *domain.Machine) error {
	return r.db.WithContext(ctx).Create(machine).Error
}

// UpdateMachine stores editable machine fields.
func (r *InventoryRepository) UpdateMachine(ctx context.Context, machine *domain.Machine) error {
	result := r.db.WithContext(ctx).Model(&domain.Machine{}).Where("id = ?", machine.ID).Updates(map[string]any{
		"name": machine.Name, "address": machine.Address, "management_url": machine.ManagementURL,
		"image": machine.Image, "status": machine.Status, "sort_order": machine.SortOrder,
	})
	return changed(result)
}

// DeleteMachine removes a machine and its service endpoints.
func (r *InventoryRepository) DeleteMachine(ctx context.Context, id string) error {
	return changed(r.db.WithContext(ctx).Delete(&domain.Machine{}, "id = ?", id))
}

// CreateService stores a machine service endpoint.
func (r *InventoryRepository) CreateService(ctx context.Context, endpoint *domain.ServiceEndpoint) error {
	return r.db.WithContext(ctx).Create(endpoint).Error
}

// UpdateService stores editable service fields.
func (r *InventoryRepository) UpdateService(ctx context.Context, endpoint *domain.ServiceEndpoint) error {
	result := r.db.WithContext(ctx).Model(&domain.ServiceEndpoint{}).Where("id = ?", endpoint.ID).Updates(map[string]any{
		"name": endpoint.Name, "url": endpoint.URL, "icon": endpoint.Icon,
		"status": endpoint.Status, "sort_order": endpoint.SortOrder,
	})
	return changed(result)
}

// DeleteService removes a service endpoint.
func (r *InventoryRepository) DeleteService(ctx context.Context, id string) error {
	return changed(r.db.WithContext(ctx).Delete(&domain.ServiceEndpoint{}, "id = ?", id))
}

func changed(result *gorm.DB) error {
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
