package domain

import "time"

// Router is a manually managed network router and the root of a Homelab topology.
type Router struct {
	ID            string    `gorm:"primaryKey;size:36" json:"id"`
	Name          string    `gorm:"size:120;not null" json:"name"`
	Address       string    `gorm:"size:255;not null" json:"address"`
	ManagementURL string    `gorm:"size:2048;not null" json:"management_url"`
	Image         string    `gorm:"size:80" json:"image"`
	Status        string    `gorm:"size:24;not null;default:unknown" json:"status"`
	SortOrder     int       `gorm:"not null;default:0" json:"sort_order"`
	Machines      []Machine `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"machines"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Machine is a manually managed host attached to one router.
type Machine struct {
	ID            string            `gorm:"primaryKey;size:36" json:"id"`
	RouterID      string            `gorm:"size:36;not null;index" json:"router_id"`
	Name          string            `gorm:"size:120;not null" json:"name"`
	Address       string            `gorm:"size:255;not null" json:"address"`
	ManagementURL string            `gorm:"size:2048" json:"management_url"`
	Image         string            `gorm:"size:80" json:"image"`
	Status        string            `gorm:"size:24;not null;default:unknown" json:"status"`
	SortOrder     int               `gorm:"not null;default:0" json:"sort_order"`
	Services      []ServiceEndpoint `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"services"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// ServiceEndpoint is an actionable web service exposed by a machine.
type ServiceEndpoint struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	MachineID string    `gorm:"size:36;not null;index" json:"machine_id"`
	Name      string    `gorm:"size:120;not null" json:"name"`
	URL       string    `gorm:"size:2048;not null" json:"url"`
	Icon      string    `gorm:"size:80" json:"icon"`
	Status    string    `gorm:"size:24;not null;default:unknown" json:"status"`
	SortOrder int       `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
