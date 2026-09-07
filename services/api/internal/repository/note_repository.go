package repository

import (
	"context"
	"errors"
	"github.com/example/api/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"time"
)

// ErrNoteConflict indicates a stale document revision.
var ErrNoteConflict = errors.New("note revision conflict")

// GetNote returns an empty version-zero document when no note exists.
func (r *InventoryRepository) GetNote(ctx context.Context, id string) (*domain.MachineNote, error) {
	var machine domain.Machine
	if err := r.db.WithContext(ctx).Select("id").First(&machine, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	note := &domain.MachineNote{MachineID: id}
	err := r.db.WithContext(ctx).First(note, "machine_id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return note, nil
	}
	return note, err
}

// SaveNote atomically compares the revision before replacing a document.
func (r *InventoryRepository) SaveNote(ctx context.Context, id, content string, revision int64) (*domain.MachineNote, error) {
	note := &domain.MachineNote{MachineID: id, Content: content, Revision: revision + 1, UpdatedAt: time.Now().UTC()}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var machine domain.Machine
		if err := tx.Select("id").First(&machine, "id = ?", id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return err
		}
		var result *gorm.DB
		if revision == 0 {
			result = tx.Omit("Machine").Clauses(clause.OnConflict{DoNothing: true}).Create(note)
		} else {
			result = tx.Model(&domain.MachineNote{}).Where("machine_id = ? AND revision = ?", id, revision).Updates(map[string]any{"content": content, "revision": note.Revision, "updated_at": note.UpdatedAt})
		}
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrNoteConflict
		}
		return nil
	})
	return note, err
}
