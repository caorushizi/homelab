package domain

import "time"

// MachineNote stores one Markdown document per machine.
type MachineNote struct {
	MachineID string    `gorm:"primaryKey;size:36" json:"machine_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Revision  int64     `gorm:"not null" json:"revision"`
	UpdatedAt time.Time `json:"updated_at"`
	Machine   Machine   `gorm:"foreignKey:MachineID;constraint:OnDelete:CASCADE;" json:"-"`
}
