#!/usr/bin/env python3
"""Mana3 booking API — SQLite date database + inquiry storage."""
import json
import sqlite3
import uuid
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mana3-bookings.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript(SCHEMA_PATH.read_text())
    migrate_db(conn)
    conn.commit()
    conn.close()


def migrate_db(conn):
    cols = {r[1] for r in conn.execute("PRAGMA table_info(bookings)").fetchall()}
    if "event_days" not in cols:
        conn.execute("ALTER TABLE bookings ADD COLUMN event_days TEXT")
    if "event_span" not in cols:
        conn.execute("ALTER TABLE bookings ADD COLUMN event_span INTEGER")


def json_response(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Pin")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class BookingHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[booking-api] {fmt % args}")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Pin")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return json_response(self, 200, {"ok": True, "time": datetime.utcnow().isoformat()})

        if parsed.path == "/api/availability":
            qs = parse_qs(parsed.query)
            service = (qs.get("service") or ["all"])[0]
            conn = get_db()
            rows = conn.execute(
                """SELECT date, service, status, note FROM availability
                   WHERE service IN (?, 'all') ORDER BY date""",
                (service,),
            ).fetchall()
            conn.close()
            return json_response(self, 200, {"availability": [dict(r) for r in rows]})

        if parsed.path == "/api/bookings":
            if not self._check_admin():
                return json_response(self, 401, {"error": "Unauthorized"})
            conn = get_db()
            rows = conn.execute(
                "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200"
            ).fetchall()
            conn.close()
            return json_response(self, 200, {"bookings": [dict(r) for r in rows]})

        json_response(self, 404, {"error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return json_response(self, 400, {"error": "Invalid JSON"})

        if parsed.path == "/api/bookings":
            return self._create_booking(data)

        if parsed.path == "/api/availability":
            if not self._check_admin():
                return json_response(self, 401, {"error": "Unauthorized"})
            return self._set_availability(data)

        json_response(self, 404, {"error": "Not found"})

    def do_PATCH(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/bookings/"):
            return json_response(self, 404, {"error": "Not found"})
        if not self._check_admin():
            return json_response(self, 401, {"error": "Unauthorized"})

        booking_id = parsed.path.split("/")[-1]
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode("utf-8"))
        status = data.get("status")
        if status not in ("pending", "contacted", "confirmed", "declined"):
            return json_response(self, 400, {"error": "Invalid status"})

        conn = get_db()
        conn.execute("UPDATE bookings SET status = ? WHERE id = ?", (status, booking_id))
        conn.commit()
        row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        conn.close()
        if not row:
            return json_response(self, 404, {"error": "Not found"})
        return json_response(self, 200, {"booking": dict(row)})

    def _check_admin(self):
        pin = self.headers.get("X-Admin-Pin", "")
        config_path = Path(__file__).resolve().parent.parent / "booking" / "js" / "config.js"
        expected = "mana3"
        if config_path.exists():
            text = config_path.read_text()
            for line in text.splitlines():
                if "adminPin" in line and ":" in line:
                    expected = line.split(":", 1)[1].strip().strip("',\"")
                    break
        return pin == expected

    def _create_booking(self, data):
        required = ["client_name", "service"]
        for key in required:
            if not data.get(key):
                return json_response(self, 400, {"error": f"Missing {key}"})

        booking_id = str(uuid.uuid4())[:8]
        created = datetime.utcnow().isoformat() + "Z"

        event_days = data.get("event_days")
        if isinstance(event_days, list):
            event_days_json = json.dumps(event_days)
        elif isinstance(event_days, str):
            event_days_json = event_days
        else:
            event_days_json = None

        event_span = data.get("event_span")
        if event_span is not None:
            try:
                event_span = int(event_span)
            except (TypeError, ValueError):
                event_span = None

        conn = get_db()
        conn.execute(
            """INSERT INTO bookings (
              id, created_at, service, package_name, event_date, event_type,
              event_span, event_days,
              client_name, email, phone, whatsapp, instagram, preferred_contact,
              message, addon_estimate, status, source
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                booking_id,
                created,
                data.get("service"),
                data.get("package_name"),
                data.get("event_date"),
                data.get("event_type"),
                event_span,
                event_days_json,
                data.get("client_name"),
                data.get("email"),
                data.get("phone"),
                data.get("whatsapp"),
                data.get("instagram"),
                data.get("preferred_contact"),
                data.get("message"),
                data.get("addon_estimate"),
                "pending",
                data.get("source", "website"),
            ),
        )

        hold_dates = []
        if isinstance(data.get("event_days"), list):
            hold_dates = [d.get("date") for d in data["event_days"] if d.get("date")]
        elif data.get("event_date"):
            hold_dates = [d.strip() for d in str(data["event_date"]).split(",") if d.strip()]

        service = data.get("service", "all")
        for event_date in hold_dates:
            for svc in (service, "all"):
                conn.execute(
                    """INSERT INTO availability (date, service, status, note)
                       VALUES (?, ?, 'hold', ?)
                       ON CONFLICT(date, service) DO UPDATE SET
                         status='hold', note=excluded.note, updated_at=datetime('now')""",
                    (event_date, svc, f"Hold: {data.get('client_name')}"),
                )
        conn.commit()
        row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        conn.close()
        return json_response(self, 201, {"booking": dict(row)})

    def _set_availability(self, data):
        dates = data.get("dates") or [data]
        conn = get_db()
        for item in dates:
            conn.execute(
                """INSERT INTO availability (date, service, status, note)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(date, service) DO UPDATE SET
                     status=excluded.status, note=excluded.note, updated_at=datetime('now')""",
                (
                    item.get("date"),
                    item.get("service", "all"),
                    item.get("status", "blocked"),
                    item.get("note"),
                ),
            )
        conn.commit()
        conn.close()
        return json_response(self, 200, {"ok": True})


def main():
    import os

    init_db()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8787"))
    server = HTTPServer((host, port), BookingHandler)
    print(f"Mana3 booking API → http://{host}:{port}")
    print(f"Database → {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
