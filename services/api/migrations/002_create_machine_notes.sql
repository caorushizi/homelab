CREATE TABLE IF NOT EXISTS machine_notes (
 machine_id text PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
 content text NOT NULL DEFAULT '',
 revision bigint NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
