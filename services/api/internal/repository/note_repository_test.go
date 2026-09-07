package repository

import (
	"context"
	"errors"
	"github.com/example/api/internal/domain"
	"github.com/example/api/internal/platform/database"
	"go.uber.org/zap"
	"testing"
)

func TestNoteLifecycle(t *testing.T) {
	db, err := database.Open("sqlite", "", ":memory:", zap.NewNop())
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()
	r := NewInventoryRepository(db)
	ctx := context.Background()
	if err := r.CreateRouter(ctx, &domain.Router{ID: "r", Name: "r", Address: "r"}); err != nil {
		t.Fatal(err)
	}
	if err := r.CreateMachine(ctx, &domain.Machine{ID: "m", RouterID: "r", Name: "m", Address: "m"}); err != nil {
		t.Fatal(err)
	}
	n, err := r.GetNote(ctx, "m")
	if err != nil || n.Revision != 0 {
		t.Fatalf("empty: %v %v", n, err)
	}
	n, err = r.SaveNote(ctx, "m", "# 中文\n```sh\nls\n```", 0)
	if err != nil || n.Revision != 1 {
		t.Fatalf("save: %v %v", n, err)
	}
	for _, revision := range []int64{0, 2} {
		if _, err := r.SaveNote(ctx, "m", "stale", revision); !errors.Is(err, ErrNoteConflict) {
			t.Fatalf("conflict: %v", err)
		}
	}
	n, err = r.GetNote(ctx, "m")
	if err != nil || n.Content != "# 中文\n```sh\nls\n```" {
		t.Fatalf("read: %v %v", n, err)
	}
	n, err = r.SaveNote(ctx, "m", "", 1)
	if err != nil || n.Revision != 2 || n.Content != "" {
		t.Fatalf("clear: %v %v", n, err)
	}
	if _, err := r.SaveNote(ctx, "missing", "", 0); !errors.Is(err, ErrNotFound) {
		t.Fatalf("missing: %v", err)
	}
	if err := r.DeleteRouter(ctx, "r"); err != nil {
		t.Fatal(err)
	}
	var count int64
	if err := db.Model(&domain.MachineNote{}).Count(&count).Error; err != nil || count != 0 {
		t.Fatalf("cascade: %d %v", count, err)
	}
}
