package handlers

type Set struct {
	Notes     *NoteHandler
	App       *AppHandler
	Health    *HealthHandler
	Inventory *InventoryHandler
}
