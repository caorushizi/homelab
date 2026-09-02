CREATE TABLE IF NOT EXISTS routers (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  management_url text NOT NULL,
  image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'unknown',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machines (
  id text PRIMARY KEY,
  router_id text NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  management_url text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'unknown',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_machines_router_id ON machines(router_id);

CREATE TABLE IF NOT EXISTS service_endpoints (
  id text PRIMARY KEY,
  machine_id text NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'unknown',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_endpoints_machine_id ON service_endpoints(machine_id);
