CREATE TABLE foco_commerce_quotes (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  terms_version TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  capacity_approved INTEGER NOT NULL CHECK (capacity_approved = 1),
  body TEXT NOT NULL CHECK (json_valid(body))
);
--> statement-breakpoint
CREATE TABLE foco_commerce_orders (
  id TEXT PRIMARY KEY NOT NULL,
  quote_id TEXT NOT NULL UNIQUE REFERENCES foco_commerce_quotes(id),
  customer_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  body TEXT NOT NULL CHECK (json_valid(body))
    CHECK (json_extract(body, '$.amount') = 3990)
    CHECK (json_extract(body, '$.currency') = 'brl')
    CHECK (json_extract(body, '$.quoteId') = quote_id)
    CHECK (json_extract(body, '$.customerId') = customer_id)
    CHECK (json_extract(body, '$.revision') = revision)
    CHECK (json_extract(body, '$.stripeSessionId') IS stripe_session_id),
  UNIQUE (customer_id, idempotency_key)
);
--> statement-breakpoint
CREATE TABLE foco_commerce_events (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES foco_commerce_orders(id),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  expected_revision INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0 CHECK (processed IN (0, 1))
);
