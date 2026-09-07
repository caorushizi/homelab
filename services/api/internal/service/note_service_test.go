package service

import (
	"context"
	"errors"
	"github.com/example/api/internal/domain"
	"strings"
	"testing"
)

type noteStoreStub struct{ called bool }

func (s *noteStoreStub) GetNote(context.Context, string) (*domain.MachineNote, error) {
	return nil, nil
}
func (s *noteStoreStub) SaveNote(_ context.Context, id, content string, revision int64) (*domain.MachineNote, error) {
	s.called = true
	return &domain.MachineNote{MachineID: id, Content: content, Revision: revision + 1}, nil
}
func TestNoteValidation(t *testing.T) {
	for _, tc := range []struct {
		name, content string
		revision      int64
		invalid       bool
	}{
		{"empty", "", 0, false}, {"limit", strings.Repeat("a", 100*1024), 0, false}, {"oversized", strings.Repeat("中", 35000), 0, true}, {"negative", "", -1, true}, {"invalid UTF8", string([]byte{255}), 0, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := &noteStoreStub{}
			_, err := NewNoteService(store).SaveNote(context.Background(), "m", tc.content, tc.revision)
			if errors.Is(err, ErrInvalidInventoryInput) != tc.invalid || store.called == tc.invalid {
				t.Fatalf("validation: %v called %v", err, store.called)
			}
		})
	}
}
