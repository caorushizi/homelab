package handlers

import (
	"context"
	"github.com/example/api/internal/domain"
	"github.com/example/api/internal/repository"
	"github.com/example/api/internal/service"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type handlerNoteStore struct{}

func (handlerNoteStore) GetNote(_ context.Context, id string) (*domain.MachineNote, error) {
	if id == "missing" {
		return nil, repository.ErrNotFound
	}
	return &domain.MachineNote{MachineID: id}, nil
}
func (handlerNoteStore) SaveNote(_ context.Context, id, content string, revision int64) (*domain.MachineNote, error) {
	if revision != 0 {
		return nil, repository.ErrNoteConflict
	}
	return &domain.MachineNote{MachineID: id, Content: content, Revision: 1}, nil
}
func TestNoteEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewNoteHandler(service.NewNoteService(handlerNoteStore{}))
	r := gin.New()
	r.GET("/machines/:machineID/note", h.Get)
	r.PUT("/machines/:machineID/note", h.Put)
	for _, tc := range []struct {
		name, method, path, body string
		status                   int
	}{
		{"get", http.MethodGet, "/machines/m/note", "", 200},
		{"missing", http.MethodGet, "/machines/missing/note", "", 404},
		{"save", http.MethodPut, "/machines/m/note", `{"content":"# hello","revision":0}`, 200},
		{"conflict", http.MethodPut, "/machines/m/note", `{"content":"hello","revision":2}`, 409},
		{"required", http.MethodPut, "/machines/m/note", `{"content":""}`, 400},
		{"invalid", http.MethodPut, "/machines/m/note", `{`, 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			r.ServeHTTP(w, req)
			if w.Code != tc.status {
				t.Fatalf("got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}
