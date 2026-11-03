CREATE TABLE foco_requests (
  id TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  created_ms INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX foco_requests_day_idx ON foco_requests (day);
