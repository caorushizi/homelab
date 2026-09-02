package repository

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/example/api/internal/domain"
)

func TestInventoryRepositoryTopology(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("opening sqlite: %v", err)
	}
	if err := db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
		t.Fatalf("enabling foreign keys: %v", err)
	}
	if err := db.AutoMigrate(&domain.Router{}, &domain.Machine{}, &domain.ServiceEndpoint{}); err != nil {
		t.Fatalf("migrating schema: %v", err)
	}

	repo := NewInventoryRepository(db)
	ctx := context.Background()
	router := &domain.Router{ID: "r1", Name: "主路由", Address: "192.168.1.1", ManagementURL: "http://192.168.1.1", Status: "online"}
	machine := &domain.Machine{ID: "m1", RouterID: router.ID, Name: "NAS", Address: "192.168.1.10", Status: "online"}
	endpoint := &domain.ServiceEndpoint{ID: "s1", MachineID: machine.ID, Name: "Plex", URL: "http://192.168.1.10:32400", Status: "online"}

	if err := repo.CreateRouter(ctx, router); err != nil {
		t.Fatalf("creating router: %v", err)
	}
	if err := repo.CreateMachine(ctx, machine); err != nil {
		t.Fatalf("creating machine: %v", err)
	}
	if err := repo.CreateService(ctx, endpoint); err != nil {
		t.Fatalf("creating service: %v", err)
	}

	topology, err := repo.Topology(ctx)
	if err != nil {
		t.Fatalf("loading topology: %v", err)
	}
	if len(topology) != 1 || len(topology[0].Machines) != 1 || len(topology[0].Machines[0].Services) != 1 {
		t.Fatalf("unexpected topology: %#v", topology)
	}
}
