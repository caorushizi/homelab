FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS builder

ARG TARGETARCH
ARG GOPROXY=https://proxy.golang.org,direct

WORKDIR /src
COPY go.mod go.sum ./
RUN GOPROXY=$GOPROXY go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/labmap-api ./cmd/server

FROM alpine:3.22

RUN addgroup -S labmap && adduser -S -G labmap labmap

COPY --from=builder /out/labmap-api /usr/local/bin/labmap-api
COPY api /app/api

WORKDIR /app
USER labmap

ENV APP_ENV=production \
    PORT=3000 \
    DATABASE_DRIVER=postgres

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

ENTRYPOINT ["labmap-api"]
