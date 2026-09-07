package handlers

import (
	"errors"
	"github.com/example/api/internal/http/response"
	"github.com/example/api/internal/repository"
	"github.com/example/api/internal/service"
	"github.com/gin-gonic/gin"
	"net/http"
)

// NoteHandler handles machine document requests.
type NoteHandler struct{ notes *service.NoteService }

// NewNoteHandler constructs a note handler.
func NewNoteHandler(notes *service.NoteService) *NoteHandler { return &NoteHandler{notes: notes} }

// Get returns a machine note.
func (h *NoteHandler) Get(c *gin.Context) {
	note, err := h.notes.GetNote(c.Request.Context(), c.Param("machineID"))
	if err != nil {
		writeNoteError(c, err)
		return
	}
	response.OK(c, note)
}

// Put saves a note with optimistic concurrency control.
func (h *NoteHandler) Put(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1024*1024)
	var req struct {
		Content  *string `json:"content"`
		Revision *int64  `json:"revision"`
	}
	if !bind(c, &req) {
		return
	}
	if req.Content == nil || req.Revision == nil {
		response.Error(c, 400, 40010, "content and revision are required")
		return
	}
	note, err := h.notes.SaveNote(c.Request.Context(), c.Param("machineID"), *req.Content, *req.Revision)
	if err != nil {
		writeNoteError(c, err)
		return
	}
	response.OK(c, note)
}
func writeNoteError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrNoteConflict):
		response.Error(c, 409, 40910, "note was updated by another client")
	case errors.Is(err, repository.ErrNotFound):
		response.Error(c, 404, 40410, "machine not found")
	default:
		writeInventoryError(c, err)
	}
}
