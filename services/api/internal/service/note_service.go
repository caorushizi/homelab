package service

import (
	"context"
	"github.com/example/api/internal/domain"
	"unicode/utf8"
)

// NoteStore defines note persistence.
type NoteStore interface {
	GetNote(context.Context, string) (*domain.MachineNote, error)
	SaveNote(context.Context, string, string, int64) (*domain.MachineNote, error)
}

// NoteService validates machine notes.
type NoteService struct{ store NoteStore }

// NewNoteService constructs a note service.
func NewNoteService(store NoteStore) *NoteService { return &NoteService{store: store} }

// GetNote loads a machine note.
func (s *NoteService) GetNote(ctx context.Context, id string) (*domain.MachineNote, error) {
	return s.store.GetNote(ctx, id)
}

// SaveNote validates the UTF-8 document size and revision.
func (s *NoteService) SaveNote(ctx context.Context, id, content string, revision int64) (*domain.MachineNote, error) {
	if len(content) > 100*1024 || !utf8.ValidString(content) || revision < 0 || revision >= 9007199254740991 {
		return nil, ErrInvalidInventoryInput
	}
	return s.store.SaveNote(ctx, id, content, revision)
}
