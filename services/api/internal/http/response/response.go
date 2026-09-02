package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Success bool   `json:"success"`
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Body{
		Success: true,
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Body{
		Success: true,
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func Error(c *gin.Context, status int, code int, message string) {
	c.AbortWithStatusJSON(status, Body{
		Success: false,
		Code:    code,
		Message: message,
	})
}
