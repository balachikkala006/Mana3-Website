CREATE TABLE IF NOT EXISTS availability (
  date TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked', 'hold')),
  note TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (date, service)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  service TEXT NOT NULL,
  package_name TEXT,
  event_date TEXT,
  event_type TEXT,
  event_span INTEGER,
  event_days TEXT,
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  preferred_contact TEXT,
  message TEXT,
  addon_estimate TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT 'website'
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
