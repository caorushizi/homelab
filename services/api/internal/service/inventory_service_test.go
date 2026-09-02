package service

import (
	"context"
	"errors"
	"testing"

	"github.com/example/api/internal/domain"
	"github.com/example/api/internal/repository"
)

type inventoryStoreStub struct {
	router *domain.Router
	err    error
}

func (s *inventoryStoreStub) Topology(context.Context) ([]domain.Router, error) { return nil, s.err }
func (s *inventoryStoreStub) CreateRouter(_ context.Context, router *domain.Router) error {
	s.router = router
	return s.err
}
func (s *inventoryStoreStub) UpdateRouter(context.Context, *domain.Router) error { return s.err }
func (s *inventoryStoreStub) DeleteRouter(context.Context, string) error         { return s.err }
func (s *inventoryStoreStub) CreateMachine(context.Context, *domain.Machine) error {
	return s.err
}
func (s *inventoryStoreStub) UpdateMachine(context.Context, *domain.Machine) error { return s.err }
func (s *inventoryStoreStub) DeleteMachine(context.Context, string) error          { return s.err }
func (s *inventoryStoreStub) CreateService(context.Context, *domain.ServiceEndpoint) error {
	return s.err
}
func (s *inventoryStoreStub) UpdateService(context.Context, *domain.ServiceEndpoint) error {
	return s.err
}
func (s *inventoryStoreStub) DeleteService(context.Context, string) error { return s.err }

func TestInventoryServiceCreateRouter(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		input   RouterInput
		wantErr error
	}{
		{
			name:  "valid router",
			input: RouterInput{Name: "  主路由  ", Address: "192.168.1.1", ManagementURL: "http://192.168.1.1", Status: "online"},
		},
		{
			name:    "invalid management url",
			input:   RouterInput{Name: "主路由", Address: "192.168.1.1", ManagementURL: "192.168.1.1"},
			wantErr: ErrInvalidInventoryInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			store := &inventoryStoreStub{}
			created, err := NewInventoryService(store).CreateRouter(context.Background(), tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("CreateRouter() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				if created.Name != "主路由" || created.Status != "online" || created.ID == "" {
					t.Fatalf("CreateRouter() returned unexpected router: %#v", created)
				}
			}
		})
	}
}

func TestInventoryServiceMapsNotFound(t *testing.T) {
	t.Parallel()
	store := &inventoryStoreStub{err: repository.ErrNotFound}
	err := NewInventoryService(store).DeleteRouter(context.Background(), "missing")
	if !errors.Is(err, ErrInventoryNotFound) {
		t.Fatalf("DeleteRouter() error = %v, want ErrInventoryNotFound", err)
	}
}
